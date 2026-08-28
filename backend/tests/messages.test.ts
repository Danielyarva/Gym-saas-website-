import request from 'supertest';

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendClientInviteEmail: jest.fn(),
    sendNewMessageEmail: jest.fn(),
    sendAtRiskAlertEmail: jest.fn(),
  },
}));

import { emailService } from '../src/services/email.service';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();
const sendClientInviteEmailMock = emailService.sendClientInviteEmail as jest.Mock;

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

async function registerCoach(email: string, fullName: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: 'Password123', fullName });
  const csrfToken = extractCookie(res.headers['set-cookie'] as unknown as string[], 'csrf_token')!;
  return { agent, csrfToken };
}

async function createOnboardedClientAccount(coach: { agent: request.Agent; csrfToken: string }, email: string, fullName: string) {
  const createRes = await coach.agent.post('/api/clients').set('X-CSRF-Token', coach.csrfToken).send({ fullName, email });
  const clientId = createRes.body.data.id as string;

  await coach.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coach.csrfToken);
  const rawToken = sendClientInviteEmailMock.mock.calls.at(-1)![2] as string;

  const clientAgent = request.agent(app);
  const acceptRes = await clientAgent.post(`/api/auth/invite/${rawToken}/accept`).send({ password: 'ClientPassword123' });
  const clientCsrfToken = extractCookie(acceptRes.headers['set-cookie'] as unknown as string[], 'csrf_token')!;

  return { agent: clientAgent, csrfToken: clientCsrfToken, clientId };
}

beforeEach(() => {
  sendClientInviteEmailMock.mockClear();
});

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('messages', () => {
  it('lets a client and coach exchange messages, marking the other side\'s messages read on view', async () => {
    const coach = await registerCoach('msg-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'msg-client-a@example.com', 'Client A');

    const sendRes = await client.agent
      .post(`/api/clients/${client.clientId}/messages`)
      .set('X-CSRF-Token', client.csrfToken)
      .field('content', 'Hey coach, quick question');
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.senderRole).toBe('CLIENT');

    const unreadRow = await prisma.message.findUnique({ where: { id: sendRes.body.data.id } });
    expect(unreadRow?.readAt).toBeNull();

    const coachViewRes = await coach.agent.get(`/api/clients/${client.clientId}/messages`);
    expect(coachViewRes.status).toBe(200);
    expect(coachViewRes.body.data.total).toBe(1);

    const nowReadRow = await prisma.message.findUnique({ where: { id: sendRes.body.data.id } });
    expect(nowReadRow?.readAt).not.toBeNull();

    const replyRes = await coach.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', coach.csrfToken).field('content', 'Sure, what\'s up?');
    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.senderRole).toBe('COACH');

    const clientViewRes = await client.agent.get(`/api/clients/${client.clientId}/messages`);
    expect(clientViewRes.status).toBe(200);
    expect(clientViewRes.body.data.total).toBe(2);
  });

  it('rejects a message with neither text nor an attachment', async () => {
    const coach = await registerCoach('msg-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coach, 'msg-client-b@example.com', 'Client B');

    const res = await client.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', client.csrfToken).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts an image attachment with no text', async () => {
    const coach = await registerCoach('msg-coach-c@example.com', 'Coach C');
    const client = await createOnboardedClientAccount(coach, 'msg-client-c@example.com', 'Client C');

    const res = await client.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', client.csrfToken).attach('attachment', tinyPng, 'photo.png');
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBeNull();
    expect(res.body.data.attachmentUrl).toMatch(/^http/);
  });

  it('enforces mixed-role ownership on reading and writing', async () => {
    const coachA = await registerCoach('msg-coach-d@example.com', 'Coach D');
    const coachB = await registerCoach('msg-coach-e@example.com', 'Coach E');
    const clientA = await createOnboardedClientAccount(coachA, 'msg-client-d@example.com', 'Client D');
    const otherClient = await createOnboardedClientAccount(coachB, 'msg-client-e@example.com', 'Client E');

    const otherCoachReadRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/messages`);
    expect(otherCoachReadRes.status).toBe(404);

    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${clientA.clientId}/messages`);
    expect(otherClientReadRes.status).toBe(403);

    const otherClientSendRes = await otherClient.agent
      .post(`/api/clients/${clientA.clientId}/messages`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .field('content', 'hi');
    expect(otherClientSendRes.status).toBe(403);

    const otherCoachSendRes = await coachB.agent.post(`/api/clients/${clientA.clientId}/messages`).set('X-CSRF-Token', coachB.csrfToken).field('content', 'hi');
    expect(otherCoachSendRes.status).toBe(404);
  });

  it('reports a typing indicator to the other party', async () => {
    const coach = await registerCoach('msg-coach-f@example.com', 'Coach F');
    const client = await createOnboardedClientAccount(coach, 'msg-client-f@example.com', 'Client F');

    const typingRes = await client.agent.post(`/api/clients/${client.clientId}/messages/typing`).set('X-CSRF-Token', client.csrfToken);
    expect(typingRes.status).toBe(200);

    const coachViewRes = await coach.agent.get(`/api/clients/${client.clientId}/messages`);
    expect(coachViewRes.status).toBe(200);
    expect(coachViewRes.body.data.otherPartyTyping).toBe(true);

    const clientViewRes = await client.agent.get(`/api/clients/${client.clientId}/messages`);
    expect(clientViewRes.body.data.otherPartyTyping).toBe(false);
  });

  it('surfaces the coach\'s conversations across their roster on GET /api/messages, isolated per coach', async () => {
    const coachA = await registerCoach('msg-coach-g@example.com', 'Coach G');
    const coachB = await registerCoach('msg-coach-h@example.com', 'Coach H');
    const client = await createOnboardedClientAccount(coachA, 'msg-client-g@example.com', 'Client G');

    await client.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', client.csrfToken).field('content', 'hello');

    const coachAConversationsRes = await coachA.agent.get('/api/messages');
    expect(coachAConversationsRes.status).toBe(200);
    expect(coachAConversationsRes.body.data.conversations).toHaveLength(1);
    expect(coachAConversationsRes.body.data.conversations[0].unreadCount).toBe(1);

    const coachBConversationsRes = await coachB.agent.get('/api/messages');
    expect(coachBConversationsRes.status).toBe(200);
    expect(coachBConversationsRes.body.data.conversations).toHaveLength(0);

    const clientConversationsRes = await client.agent.get('/api/messages');
    expect(clientConversationsRes.status).toBe(403);
  });
});

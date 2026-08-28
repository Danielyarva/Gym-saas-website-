import request from 'supertest';

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendClientInviteEmail: jest.fn(),
  },
}));

// Deliberately does NOT mock src/ai — .env.test has no ANTHROPIC_API_KEY, so
// this exercises the real graceful-degradation path every AI feature falls
// back to in this sandbox: a clean 503, never a 500, and no partial writes.
import { emailService } from '../src/services/email.service';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();
const sendClientInviteEmailMock = emailService.sendClientInviteEmail as jest.Mock;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

describe('AI features with no ANTHROPIC_API_KEY configured', () => {
  it('chat: returns 503 AI_NOT_CONFIGURED (not 500), but still saves the client\'s message', async () => {
    const coach = await registerCoach('nc-chat-coach@example.com', 'Coach');
    const client = await createOnboardedClientAccount(coach, 'nc-chat-client@example.com', 'Client');

    const sendRes = await client.agent
      .post(`/api/clients/${client.clientId}/ai/chat`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ content: 'How is my progress?' });
    expect(sendRes.status).toBe(503);
    expect(sendRes.body.error.code).toBe('AI_NOT_CONFIGURED');

    const historyRes = await client.agent.get(`/api/clients/${client.clientId}/ai/chat`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.total).toBe(1);
    expect(historyRes.body.data.messages[0].role).toBe('USER');

    const usageLog = await prisma.aiUsageLog.findFirst({ where: { clientId: client.clientId, feature: 'chat' } });
    expect(usageLog?.success).toBe(false);
    expect(usageLog?.errorMessage).toBe('AI_NOT_CONFIGURED');
  });

  it('check-in analysis: submitting a check-in still succeeds and produces no insight', async () => {
    const coach = await registerCoach('nc-insight-coach@example.com', 'Coach');
    const client = await createOnboardedClientAccount(coach, 'nc-insight-client@example.com', 'Client');

    const submitRes = await client.agent.post(`/api/clients/${client.clientId}/checkins`).set('X-CSRF-Token', client.csrfToken).send({ steps: 4000 });
    expect(submitRes.status).toBe(200);

    await wait(100);

    const insightsRes = await client.agent.get(`/api/clients/${client.clientId}/ai/insights`);
    expect(insightsRes.status).toBe(200);
    expect(insightsRes.body.data.total).toBe(0);

    const insightRows = await prisma.aiInsight.count({ where: { clientId: client.clientId } });
    expect(insightRows).toBe(0);
  });

  it('weekly report: generating returns 503 AI_NOT_CONFIGURED and writes no row; listing still works', async () => {
    const coach = await registerCoach('nc-report-coach@example.com', 'Coach');
    const client = await createOnboardedClientAccount(coach, 'nc-report-client@example.com', 'Client');

    const generateRes = await coach.agent.post(`/api/clients/${client.clientId}/ai/weekly-report`).set('X-CSRF-Token', coach.csrfToken).send({});
    expect(generateRes.status).toBe(503);
    expect(generateRes.body.error.code).toBe('AI_NOT_CONFIGURED');

    const reportCount = await prisma.weeklyReport.count({ where: { clientId: client.clientId } });
    expect(reportCount).toBe(0);

    const listRes = await coach.agent.get(`/api/clients/${client.clientId}/ai/weekly-report`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(0);

    const crossClientRes = await coach.agent.get('/api/reports');
    expect(crossClientRes.status).toBe(200);
    expect(crossClientRes.body.data.total).toBe(0);
  });
});

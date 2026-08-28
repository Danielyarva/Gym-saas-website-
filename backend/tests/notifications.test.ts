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
import { emailQueue } from '../src/jobs/queues';
import { resetDatabase, extractCookie } from './helpers';
import { waitForQueueIdle } from './queue-helpers';

const app = createApp();
const sendClientInviteEmailMock = emailService.sendClientInviteEmail as jest.Mock;
const sendNewMessageEmailMock = emailService.sendNewMessageEmail as jest.Mock;
const sendAtRiskAlertEmailMock = emailService.sendAtRiskAlertEmail as jest.Mock;

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
  sendNewMessageEmailMock.mockClear();
  sendAtRiskAlertEmailMock.mockClear();
});

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('notification triggers', () => {
  it('notifies the coach when their client checks in, and again when the workout is marked incomplete', async () => {
    const coach = await registerCoach('notif-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'notif-client-a@example.com', 'Client A');

    await client.agent.post(`/api/clients/${client.clientId}/checkins`).set('X-CSRF-Token', client.csrfToken).send({ workoutCompleted: false, steps: 2000 });

    const checkinRes = await coach.agent.get('/api/notifications');
    expect(checkinRes.status).toBe(200);
    const types = checkinRes.body.data.notifications.map((n: { type: string }) => n.type);
    expect(types).toEqual(expect.arrayContaining(['CLIENT_CHECKIN', 'MISSED_WORKOUT']));
    expect(checkinRes.body.data.unreadCount).toBe(2);

    // The client never receives their own check-in's notifications.
    const clientRes = await client.agent.get('/api/notifications');
    expect(clientRes.body.data.notifications).toHaveLength(0);
  });

  it('does not notify a missed workout when workoutCompleted is left unset', async () => {
    const coach = await registerCoach('notif-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coach, 'notif-client-b@example.com', 'Client B');

    await client.agent.post(`/api/clients/${client.clientId}/checkins`).set('X-CSRF-Token', client.csrfToken).send({ steps: 5000 });

    const res = await coach.agent.get('/api/notifications');
    const types = res.body.data.notifications.map((n: { type: string }) => n.type);
    expect(types).toEqual(['CLIENT_CHECKIN']);
  });

  it('notifies both sides on a new message, emailing only the recipient', async () => {
    const coach = await registerCoach('notif-coach-c@example.com', 'Coach C');
    const client = await createOnboardedClientAccount(coach, 'notif-client-c@example.com', 'Client C');

    await client.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', client.csrfToken).field('content', 'hi coach');

    const coachRes = await coach.agent.get('/api/notifications');
    expect(coachRes.body.data.notifications.map((n: { type: string }) => n.type)).toContain('NEW_MESSAGE');
    await waitForQueueIdle(emailQueue);
    expect(sendNewMessageEmailMock).toHaveBeenCalledTimes(1);

    sendNewMessageEmailMock.mockClear();
    await coach.agent.post(`/api/clients/${client.clientId}/messages`).set('X-CSRF-Token', coach.csrfToken).field('content', 'hi client');

    const clientRes = await client.agent.get('/api/notifications');
    expect(clientRes.body.data.notifications.map((n: { type: string }) => n.type)).toContain('NEW_MESSAGE');
    await waitForQueueIdle(emailQueue);
    expect(sendNewMessageEmailMock).toHaveBeenCalledTimes(1);
  });

  it('lets a user mark one notification read and mark all read, self-scoped to their own', async () => {
    const coach = await registerCoach('notif-coach-d@example.com', 'Coach D');
    const client = await createOnboardedClientAccount(coach, 'notif-client-d@example.com', 'Client D');

    await client.agent.post(`/api/clients/${client.clientId}/checkins`).set('X-CSRF-Token', client.csrfToken).send({ steps: 1000 });
    await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ date: new Date().toISOString(), steps: 1200, notes: 'resubmit' });

    const listRes = await coach.agent.get('/api/notifications');
    const [first] = listRes.body.data.notifications;

    const markOneRes = await coach.agent.patch(`/api/notifications/${first.id}/read`).set('X-CSRF-Token', coach.csrfToken);
    expect(markOneRes.status).toBe(200);

    const afterOneRes = await coach.agent.get('/api/notifications');
    expect(afterOneRes.body.data.unreadCount).toBe(afterOneRes.body.data.total - 1);

    const markAllRes = await coach.agent.post('/api/notifications/read-all').set('X-CSRF-Token', coach.csrfToken);
    expect(markAllRes.status).toBe(200);

    const afterAllRes = await coach.agent.get('/api/notifications');
    expect(afterAllRes.body.data.unreadCount).toBe(0);
  });

  it("a coach cannot mark another coach's notification read", async () => {
    const coachA = await registerCoach('notif-coach-e@example.com', 'Coach E');
    const coachB = await registerCoach('notif-coach-f@example.com', 'Coach F');
    const client = await createOnboardedClientAccount(coachA, 'notif-client-e@example.com', 'Client E');

    await client.agent.post(`/api/clients/${client.clientId}/checkins`).set('X-CSRF-Token', client.csrfToken).send({ steps: 3000 });

    const listRes = await coachA.agent.get('/api/notifications');
    const [notification] = listRes.body.data.notifications;

    await coachB.agent.patch(`/api/notifications/${notification.id}/read`).set('X-CSRF-Token', coachB.csrfToken);

    const stillUnreadRow = await prisma.notification.findUnique({ where: { id: notification.id } });
    expect(stillUnreadRow?.readAt).toBeNull();
  });
});

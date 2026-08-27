import request from 'supertest';

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendClientInviteEmail: jest.fn(),
  },
}));

import { emailService } from '../src/services/email.service';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();
const sendClientInviteEmailMock = emailService.sendClientInviteEmail as jest.Mock;

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

describe('daily check-ins', () => {
  it('lets a client submit a check-in, upserts on resubmit, and keeps CoachClient/ClientProfile fresh', async () => {
    const coach = await registerCoach('checkin-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'checkin-client-a@example.com', 'Client A');

    const submitRes = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ weightKg: 82.5, workoutCompleted: true, steps: 9000, mood: 'GOOD', energy: 'GOOD', nutritionAdherence: 'EXCELLENT', notes: 'Felt strong' });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.weightKg).toBe(82.5);

    const coachClient = await prisma.coachClient.findFirst({ where: { clientId: client.clientId } });
    expect(coachClient?.lastCheckInAt).not.toBeNull();
    const profile = await prisma.clientProfile.findUnique({ where: { clientId: client.clientId } });
    expect(Number(profile?.currentWeightKg)).toBe(82.5);

    // Resubmitting the same day upserts rather than creating a second row.
    const resubmitRes = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ weightKg: 82.0, mood: 'VERY_GOOD' });
    expect(resubmitRes.status).toBe(200);
    const count = await prisma.dailyCheckIn.count({ where: { clientId: client.clientId } });
    expect(count).toBe(1);

    const todayRes = await client.agent.get(`/api/clients/${client.clientId}/checkins/today`);
    expect(todayRes.status).toBe(200);
    expect(todayRes.body.data.weightKg).toBe(82.0);
    expect(todayRes.body.data.mood).toBe('VERY_GOOD');

    const auditRow = await prisma.auditLog.findFirst({ where: { action: 'CHECK_IN_SUBMITTED', entityId: client.clientId } });
    expect(auditRow).not.toBeNull();
  });

  it('rejects backdating beyond yesterday', async () => {
    const coach = await registerCoach('checkin-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coach, 'checkin-client-b@example.com', 'Client B');

    const tooOldDate = new Date();
    tooOldDate.setUTCDate(tooOldDate.getUTCDate() - 3);

    const res = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ date: tooOldDate.toISOString(), steps: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enforces role and ownership: only the client can submit, coach+client (and only that pair) can read history', async () => {
    const coachA = await registerCoach('checkin-coach-c@example.com', 'Coach C');
    const coachB = await registerCoach('checkin-coach-d@example.com', 'Coach D');
    const clientA = await createOnboardedClientAccount(coachA, 'checkin-client-c@example.com', 'Client C');
    const otherClient = await createOnboardedClientAccount(coachB, 'checkin-client-d@example.com', 'Client D');

    await clientA.agent.post(`/api/clients/${clientA.clientId}/checkins`).set('X-CSRF-Token', clientA.csrfToken).send({ steps: 7000 });

    const coachReadRes = await coachA.agent.get(`/api/clients/${clientA.clientId}/checkins`);
    expect(coachReadRes.status).toBe(200);
    expect(coachReadRes.body.data.total).toBe(1);

    const otherCoachReadRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/checkins`);
    expect(otherCoachReadRes.status).toBe(404);

    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${clientA.clientId}/checkins`);
    expect(otherClientReadRes.status).toBe(403);

    const coachSubmitRes = await coachA.agent.post(`/api/clients/${clientA.clientId}/checkins`).set('X-CSRF-Token', coachA.csrfToken).send({ steps: 1000 });
    expect(coachSubmitRes.status).toBe(403);

    const otherClientSubmitRes = await otherClient.agent
      .post(`/api/clients/${clientA.clientId}/checkins`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .send({ steps: 1000 });
    expect(otherClientSubmitRes.status).toBe(403);
  });
});

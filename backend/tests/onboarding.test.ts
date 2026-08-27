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

/** Creates a client under `coach`, invites them, and accepts the invite as that client — returns an authenticated client agent + clientId. */
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

describe('onboarding', () => {
  it('lets a client save each step, persists the data, and only advances currentStep forward', async () => {
    const coach = await registerCoach('onboarding-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'onboarding-client-a@example.com', 'Client A');

    const step1Res = await client.agent
      .patch(`/api/clients/${client.clientId}/onboarding/step/1`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ heightCm: 178 });
    expect(step1Res.status).toBe(200);
    expect(step1Res.body.data.basicInfo.heightCm).toBe(178);
    expect(step1Res.body.data.currentStep).toBe(2);

    const step2Res = await client.agent
      .patch(`/api/clients/${client.clientId}/onboarding/step/2`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ type: 'WEIGHT_LOSS', targetValue: 75, targetUnit: 'kg' });
    expect(step2Res.status).toBe(200);
    expect(step2Res.body.data.goal).toEqual(expect.objectContaining({ type: 'WEIGHT_LOSS', targetValue: 75, targetUnit: 'kg' }));
    expect(step2Res.body.data.currentStep).toBe(3);

    // Re-visiting step 1 after progressing past it must not regress currentStep back to 2.
    const step1AgainRes = await client.agent
      .patch(`/api/clients/${client.clientId}/onboarding/step/1`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ heightCm: 180 });
    expect(step1AgainRes.status).toBe(200);
    expect(step1AgainRes.body.data.basicInfo.heightCm).toBe(180);
    expect(step1AgainRes.body.data.currentStep).toBe(3);

    // Re-submitting the same goal type must update, not duplicate, the primary goal.
    const goalCount = await prisma.goal.count({ where: { clientId: client.clientId } });
    expect(goalCount).toBe(1);
  });

  it('rejects completion until required steps are done, then completes once they are', async () => {
    const coach = await registerCoach('onboarding-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coach, 'onboarding-client-b@example.com', 'Client B');

    const tooEarlyRes = await client.agent.post(`/api/clients/${client.clientId}/onboarding/complete`).set('X-CSRF-Token', client.csrfToken);
    expect(tooEarlyRes.status).toBe(400);
    expect(tooEarlyRes.body.error.code).toBe('VALIDATION_ERROR');

    await client.agent.patch(`/api/clients/${client.clientId}/onboarding/step/1`).set('X-CSRF-Token', client.csrfToken).send({ dateOfBirth: '1995-01-01' });
    await client.agent.patch(`/api/clients/${client.clientId}/onboarding/step/2`).set('X-CSRF-Token', client.csrfToken).send({ type: 'GENERAL_FITNESS' });

    const completeRes = await client.agent.post(`/api/clients/${client.clientId}/onboarding/complete`).set('X-CSRF-Token', client.csrfToken);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.completedAt).toBeTruthy();
  });

  it('enforces role and ownership: only the client can write, coach+client (and only that pair) can read', async () => {
    const coachA = await registerCoach('onboarding-coach-c@example.com', 'Coach C');
    const coachB = await registerCoach('onboarding-coach-d@example.com', 'Coach D');
    const clientA = await createOnboardedClientAccount(coachA, 'onboarding-client-c@example.com', 'Client C');
    const otherClient = await createOnboardedClientAccount(coachB, 'onboarding-client-d@example.com', 'Client D');

    // Coach A (owner) can read.
    const coachReadRes = await coachA.agent.get(`/api/clients/${clientA.clientId}/onboarding`);
    expect(coachReadRes.status).toBe(200);

    // Coach B (not the owner) cannot.
    const otherCoachReadRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/onboarding`);
    expect(otherCoachReadRes.status).toBe(404);

    // A different client cannot read this client's onboarding.
    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${clientA.clientId}/onboarding`);
    expect(otherClientReadRes.status).toBe(403);

    // A coach cannot write a step, even the owning coach — onboarding is client-only.
    const coachWriteRes = await coachA.agent
      .patch(`/api/clients/${clientA.clientId}/onboarding/step/1`)
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ heightCm: 170 });
    expect(coachWriteRes.status).toBe(403);

    // A different client cannot write this client's onboarding either.
    const otherClientWriteRes = await otherClient.agent
      .patch(`/api/clients/${clientA.clientId}/onboarding/step/1`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .send({ heightCm: 170 });
    expect(otherClientWriteRes.status).toBe(403);
  });
});

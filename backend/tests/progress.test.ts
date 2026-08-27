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

async function createClientWithGoal(
  coach: { agent: request.Agent; csrfToken: string },
  email: string,
  fullName: string,
  weights: { startingWeightKg: number; goalWeightKg: number },
) {
  const createRes = await coach.agent
    .post('/api/clients')
    .set('X-CSRF-Token', coach.csrfToken)
    .send({ fullName, email, startingWeightKg: weights.startingWeightKg, goalWeightKg: weights.goalWeightKg });
  return createRes.body.data.id as string;
}

async function inviteAndAccept(coach: { agent: request.Agent; csrfToken: string }, clientId: string) {
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

describe('check-in measurement extension and computed stats', () => {
  it('upserts a same-day BodyMeasurement on resubmit and recomputes adherencePct/progressPct', async () => {
    const coach = await registerCoach('progress-coach-a@example.com', 'Coach A');
    const clientId = await createClientWithGoal(coach, 'progress-client-a@example.com', 'Client A', { startingWeightKg: 90, goalWeightKg: 80 });
    const client = await inviteAndAccept(coach, clientId);

    const step1Res = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ weightKg: 85, workoutCompleted: true, waistCm: 90, chestCm: 100 });
    expect(step1Res.status).toBe(200);

    const measurementCount = await prisma.bodyMeasurement.count({ where: { clientId: client.clientId, source: 'CHECK_IN' } });
    expect(measurementCount).toBe(1);

    const coachClientAfterFirst = await prisma.coachClient.findFirst({ where: { clientId: client.clientId } });
    expect(coachClientAfterFirst?.adherencePct).toBe(100);
    // starting 90, current 85, goal 80: covered 5 of 10 = 50%.
    expect(coachClientAfterFirst?.progressPct).toBe(50);

    // Resubmitting the same day updates the measurement row rather than duplicating it.
    const step2Res = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ weightKg: 84, workoutCompleted: false, waistCm: 89 });
    expect(step2Res.status).toBe(200);

    const measurementCountAfter = await prisma.bodyMeasurement.count({ where: { clientId: client.clientId, source: 'CHECK_IN' } });
    expect(measurementCountAfter).toBe(1);

    const measurement = await prisma.bodyMeasurement.findFirst({ where: { clientId: client.clientId, source: 'CHECK_IN' } });
    expect(Number(measurement?.waistCm)).toBe(89);
    expect(Number(measurement?.chestCm)).toBe(100); // untouched field from the first submit persists

    const coachClientAfterSecond = await prisma.coachClient.findFirst({ where: { clientId: client.clientId } });
    // Still one DailyCheckIn row (same day, upserted) — its workoutCompleted flipped to false -> 0/1 = 0%.
    expect(coachClientAfterSecond?.adherencePct).toBe(0);
    expect(coachClientAfterSecond?.progressPct).toBe(60);
  });
});

describe('progress photos', () => {
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  it('lets a client upload and delete their own photo, and enforces ownership on every route', async () => {
    const coach = await registerCoach('progress-coach-b@example.com', 'Coach B');
    const clientId = await createClientWithGoal(coach, 'progress-client-b@example.com', 'Client B', { startingWeightKg: 90, goalWeightKg: 80 });
    const client = await inviteAndAccept(coach, clientId);

    const otherClientId = await createClientWithGoal(coach, 'progress-client-c@example.com', 'Client C', { startingWeightKg: 90, goalWeightKg: 80 });
    const otherClient = await inviteAndAccept(coach, otherClientId);

    const uploadRes = await client.agent
      .post(`/api/clients/${client.clientId}/progress-photos`)
      .set('X-CSRF-Token', client.csrfToken)
      .attach('photo', tinyPng, 'test.png');
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.url).toMatch(/^http/);
    const photoId = uploadRes.body.data.id;

    // Coach can view.
    const coachListRes = await coach.agent.get(`/api/clients/${client.clientId}/progress-photos`);
    expect(coachListRes.status).toBe(200);
    expect(coachListRes.body.data.total).toBe(1);

    // A different client cannot upload for this client, view it, or delete it.
    const otherUploadRes = await otherClient.agent
      .post(`/api/clients/${client.clientId}/progress-photos`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .attach('photo', tinyPng, 'test.png');
    expect(otherUploadRes.status).toBe(403);

    const otherListRes = await otherClient.agent.get(`/api/clients/${client.clientId}/progress-photos`);
    expect(otherListRes.status).toBe(403);

    const otherDeleteRes = await otherClient.agent.delete(`/api/clients/${client.clientId}/progress-photos/${photoId}`).set('X-CSRF-Token', otherClient.csrfToken);
    expect(otherDeleteRes.status).toBe(403);

    // The coach cannot delete it either — only the uploading client can.
    const coachDeleteRes = await coach.agent.delete(`/api/clients/${client.clientId}/progress-photos/${photoId}`).set('X-CSRF-Token', coach.csrfToken);
    expect(coachDeleteRes.status).toBe(403);

    const deleteRes = await client.agent.delete(`/api/clients/${client.clientId}/progress-photos/${photoId}`).set('X-CSRF-Token', client.csrfToken);
    expect(deleteRes.status).toBe(200);

    const afterDeleteRes = await coach.agent.get(`/api/clients/${client.clientId}/progress-photos`);
    expect(afterDeleteRes.body.data.total).toBe(0);
  });

  it('rejects a non-image upload', async () => {
    const coach = await registerCoach('progress-coach-d@example.com', 'Coach D');
    const clientId = await createClientWithGoal(coach, 'progress-client-d@example.com', 'Client D', { startingWeightKg: 90, goalWeightKg: 80 });
    const client = await inviteAndAccept(coach, clientId);

    const res = await client.agent
      .post(`/api/clients/${client.clientId}/progress-photos`)
      .set('X-CSRF-Token', client.csrfToken)
      .attach('photo', Buffer.from('not an image'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('progress charts', () => {
  it('returns weight, measurement, and check-in series filtered by range, readable by both coach and client', async () => {
    const coach = await registerCoach('progress-coach-e@example.com', 'Coach E');
    const clientId = await createClientWithGoal(coach, 'progress-client-e@example.com', 'Client E', { startingWeightKg: 90, goalWeightKg: 80 });
    const client = await inviteAndAccept(coach, clientId);

    await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ weightKg: 88, steps: 8000, sleepHours: 7, workoutCompleted: true, nutritionAdherence: 'GOOD', waistCm: 91 });

    const clientChartsRes = await client.agent.get(`/api/clients/${client.clientId}/progress/charts?range=MONTHLY`);
    expect(clientChartsRes.status).toBe(200);
    expect(clientChartsRes.body.data.weight.length).toBeGreaterThan(0);
    expect(clientChartsRes.body.data.steps).toEqual([{ date: expect.any(String), value: 8000 }]);
    expect(clientChartsRes.body.data.workoutAdherence).toEqual([{ date: expect.any(String), value: 100 }]);
    expect(clientChartsRes.body.data.nutritionAdherence).toEqual([{ date: expect.any(String), value: 75 }]);
    expect(clientChartsRes.body.data.waistCm.length).toBe(1);

    const coachChartsRes = await coach.agent.get(`/api/clients/${client.clientId}/progress/charts?range=WEEKLY`);
    expect(coachChartsRes.status).toBe(200);

    const otherCoach = await registerCoach('progress-coach-f@example.com', 'Coach F');
    const otherCoachRes = await otherCoach.agent.get(`/api/clients/${client.clientId}/progress/charts?range=WEEKLY`);
    expect(otherCoachRes.status).toBe(404);
  });
});

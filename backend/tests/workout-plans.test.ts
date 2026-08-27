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

describe('exercise library', () => {
  it('lists the global library, lets a coach manage their own custom exercises, and blocks editing global or another coach\'s exercises', async () => {
    const coachA = await registerCoach('exlib-coach-a@example.com', 'Coach A');
    const coachB = await registerCoach('exlib-coach-b@example.com', 'Coach B');

    const listRes = await coachA.agent.get('/api/exercises');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    const globalExercise = listRes.body.data[0];

    const createRes = await coachA.agent
      .post('/api/exercises')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ name: 'Custom Curl', muscleGroup: 'BICEPS', equipment: 'DUMBBELL', difficulty: 'BEGINNER' });
    expect(createRes.status).toBe(201);
    const customExerciseId = createRes.body.data.id;

    const editGlobalRes = await coachA.agent
      .patch(`/api/exercises/${globalExercise.id}`)
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ name: 'Hacked' });
    expect(editGlobalRes.status).toBe(404);

    const editOtherCoachRes = await coachB.agent
      .patch(`/api/exercises/${customExerciseId}`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ name: 'Hacked' });
    expect(editOtherCoachRes.status).toBe(404);

    const editOwnRes = await coachA.agent
      .patch(`/api/exercises/${customExerciseId}`)
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ name: 'Renamed Curl' });
    expect(editOwnRes.status).toBe(200);
    expect(editOwnRes.body.data.name).toBe('Renamed Curl');
  });
});

describe('workout plan builder', () => {
  it('lets a coach build a plan with days and exercises, reorder them, and activate it', async () => {
    const coach = await registerCoach('plan-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'plan-client-a@example.com', 'Client A');
    const exercise = await prisma.exercise.findFirstOrThrow({ where: { coachId: null } });

    const createPlanRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Strength Block 1' });
    expect(createPlanRes.status).toBe(201);
    const planId = createPlanRes.body.data.id;
    expect(createPlanRes.body.data.status).toBe('DRAFT');

    const dayARes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans/${planId}/days`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ label: 'Push Day' });
    const dayBRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans/${planId}/days`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ label: 'Pull Day' });
    const dayAId = dayARes.body.data.id;
    const dayBId = dayBRes.body.data.id;

    const reorderDaysRes = await coach.agent
      .patch(`/api/clients/${client.clientId}/workout-plans/${planId}/days/reorder`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ orderedIds: [dayBId, dayAId] });
    expect(reorderDaysRes.status).toBe(200);

    const exerciseRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans/${planId}/days/${dayAId}/exercises`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ exerciseId: exercise.id, sets: 3, reps: '8-12' });
    expect(exerciseRes.status).toBe(201);
    expect(exerciseRes.body.data.exercise.id).toBe(exercise.id);

    const activateRes = await coach.agent
      .patch(`/api/clients/${client.clientId}/workout-plans/${planId}`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ status: 'ACTIVE' });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe('ACTIVE');

    const auditRow = await prisma.auditLog.findFirst({ where: { action: 'WORKOUT_PLAN_ASSIGNED', entityId: client.clientId } });
    expect(auditRow).not.toBeNull();

    const deleteActiveRes = await coach.agent.delete(`/api/clients/${client.clientId}/workout-plans/${planId}`).set('X-CSRF-Token', coach.csrfToken);
    expect(deleteActiveRes.status).toBe(400);

    const getPlanRes = await coach.agent.get(`/api/clients/${client.clientId}/workout-plans/${planId}`);
    expect(getPlanRes.body.data.days.map((d: { id: string }) => d.id)).toEqual([dayBId, dayAId]);
  });

  it('enforces one active plan per client: activating a second plan archives the first', async () => {
    const coach = await registerCoach('plan-coach-invariant@example.com', 'Coach Invariant');
    const client = await createOnboardedClientAccount(coach, 'plan-client-invariant@example.com', 'Client Invariant');

    const planARes = await coach.agent.post(`/api/clients/${client.clientId}/workout-plans`).set('X-CSRF-Token', coach.csrfToken).send({ name: 'Plan A' });
    const planAId = planARes.body.data.id;
    const planBRes = await coach.agent.post(`/api/clients/${client.clientId}/workout-plans`).set('X-CSRF-Token', coach.csrfToken).send({ name: 'Plan B' });
    const planBId = planBRes.body.data.id;

    await coach.agent.patch(`/api/clients/${client.clientId}/workout-plans/${planAId}`).set('X-CSRF-Token', coach.csrfToken).send({ status: 'ACTIVE' });
    const afterFirstActivation = await coach.agent.get(`/api/clients/${client.clientId}/workout-plans/${planAId}`);
    expect(afterFirstActivation.body.data.status).toBe('ACTIVE');

    const activateSecondRes = await coach.agent
      .patch(`/api/clients/${client.clientId}/workout-plans/${planBId}`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ status: 'ACTIVE' });
    expect(activateSecondRes.status).toBe(200);
    expect(activateSecondRes.body.data.status).toBe('ACTIVE');

    const planAAfterRes = await coach.agent.get(`/api/clients/${client.clientId}/workout-plans/${planAId}`);
    expect(planAAfterRes.body.data.status).toBe('ARCHIVED');

    const activeCount = await prisma.workoutPlan.count({ where: { clientId: client.clientId, status: 'ACTIVE' } });
    expect(activeCount).toBe(1);
  });

  it('blocks a coach from touching another coach\'s client plan, and a coach cannot access a workout day/exercise through the wrong plan', async () => {
    const coachA = await registerCoach('plan-coach-b@example.com', 'Coach B');
    const coachB = await registerCoach('plan-coach-c@example.com', 'Coach C');
    const clientA = await createOnboardedClientAccount(coachA, 'plan-client-b@example.com', 'Client B');
    const clientOfB = await createOnboardedClientAccount(coachB, 'plan-client-c@example.com', 'Client C');

    const createPlanRes = await coachA.agent
      .post(`/api/clients/${clientA.clientId}/workout-plans`)
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ name: 'Plan A' });
    const planId = createPlanRes.body.data.id;

    // Coach B cannot even see clientA (not their own client) -> 404 at the ownership middleware.
    const crossCoachRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/workout-plans/${planId}`);
    expect(crossCoachRes.status).toBe(404);

    // Coach B's own client's (unrelated) plan ID used against clientA's URL must 404, not leak cross-plan data.
    const otherPlanRes = await coachB.agent
      .post(`/api/clients/${clientOfB.clientId}/workout-plans`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ name: 'Plan for Client C' });
    const otherPlanId = otherPlanRes.body.data.id;

    const mismatchedPlanRes = await coachA.agent.get(`/api/clients/${clientA.clientId}/workout-plans/${otherPlanId}`);
    expect(mismatchedPlanRes.status).toBe(404);
  });

  it('resolves the client\'s active-plan "today" workout, lets the client mark an exercise and the workout complete, and lets the coach read the log history', async () => {
    const coach = await registerCoach('today-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'today-client-a@example.com', 'Client A');
    const exercise = await prisma.exercise.findFirstOrThrow({ where: { coachId: null } });

    // No active plan yet.
    const noPlanRes = await client.agent.get(`/api/clients/${client.clientId}/workout/today`);
    expect(noPlanRes.status).toBe(404);
    expect(noPlanRes.body.error.code).toBe('PLAN_NOT_ACTIVE');

    const planRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Today Plan' });
    const planId = planRes.body.data.id;
    const dayRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans/${planId}/days`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ label: 'Full Body' });
    const dayId = dayRes.body.data.id;
    const weRes = await coach.agent
      .post(`/api/clients/${client.clientId}/workout-plans/${planId}/days/${dayId}/exercises`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ exerciseId: exercise.id, sets: 3, reps: '10' });
    const workoutExerciseId = weRes.body.data.id;

    await coach.agent.patch(`/api/clients/${client.clientId}/workout-plans/${planId}`).set('X-CSRF-Token', coach.csrfToken).send({ status: 'ACTIVE' });

    // Coach can preview the same "today" view via requireClientOwnershipOrSelf.
    const coachTodayRes = await coach.agent.get(`/api/clients/${client.clientId}/workout/today`);
    expect(coachTodayRes.status).toBe(200);
    expect(coachTodayRes.body.data.day.exercises[0].id).toBe(workoutExerciseId);

    // A different client cannot read this client's today view.
    const otherClient = await createOnboardedClientAccount(coach, 'today-client-b@example.com', 'Client B');
    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${client.clientId}/workout/today`);
    expect(otherClientReadRes.status).toBe(403);

    const markRes = await client.agent
      .patch(`/api/clients/${client.clientId}/workout/today/exercises/${workoutExerciseId}`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ completed: true, actualSets: 3, actualReps: '10' });
    expect(markRes.status).toBe(200);
    expect(markRes.body.data.completed).toBe(true);

    // A different client cannot mark this client's exercise complete.
    const otherClientMarkRes = await otherClient.agent
      .patch(`/api/clients/${client.clientId}/workout/today/exercises/${workoutExerciseId}`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .send({ completed: true });
    expect(otherClientMarkRes.status).toBe(403);

    const completeRes = await client.agent.post(`/api/clients/${client.clientId}/workout/today/complete`).set('X-CSRF-Token', client.csrfToken);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    const logsRes = await coach.agent.get(`/api/clients/${client.clientId}/workout/logs`);
    expect(logsRes.status).toBe(200);
    expect(logsRes.body.data.total).toBe(1);
    expect(logsRes.body.data.logs[0].status).toBe('COMPLETED');

    // A client cannot read the coach-only log history endpoint.
    const clientLogsRes = await client.agent.get(`/api/clients/${client.clientId}/workout/logs`);
    expect(clientLogsRes.status).toBe(403);
  });
});

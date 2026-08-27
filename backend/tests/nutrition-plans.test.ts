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

describe('nutrition plan builder', () => {
  it('lets a coach build a plan with meals and foods, computes daily totals, and enforces the draft-only delete rule', async () => {
    const coach = await registerCoach('nutrition-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'nutrition-client-a@example.com', 'Client A');

    const createPlanRes = await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Cut Phase 1', dailyWaterTargetMl: 3000 });
    expect(createPlanRes.status).toBe(201);
    const planId = createPlanRes.body.data.id;
    expect(createPlanRes.body.data.status).toBe('DRAFT');

    const mealRes = await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans/${planId}/meals`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ type: 'BREAKFAST' });
    expect(mealRes.status).toBe(201);
    const mealId = mealRes.body.data.id;

    await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans/${planId}/meals/${mealId}/foods`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Oats', quantity: '80g', calories: 300, proteinG: 10, carbsG: 50, fatG: 5, fiberG: 8 });
    const food2Res = await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans/${planId}/meals/${mealId}/foods`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Whey Protein', quantity: '30g', calories: 120, proteinG: 24, carbsG: 3, fatG: 1, fiberG: 0 });
    expect(food2Res.status).toBe(201);

    const getPlanRes = await coach.agent.get(`/api/clients/${client.clientId}/nutrition-plans/${planId}`);
    expect(getPlanRes.status).toBe(200);
    expect(getPlanRes.body.data.dailyTotals).toEqual({ calories: 420, proteinG: 34, carbsG: 53, fatG: 6, fiberG: 8 });
    expect(getPlanRes.body.data.meals[0].totals.calories).toBe(420);

    const activateRes = await coach.agent
      .patch(`/api/clients/${client.clientId}/nutrition-plans/${planId}`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ status: 'ACTIVE' });
    expect(activateRes.status).toBe(200);

    const auditRow = await prisma.auditLog.findFirst({ where: { action: 'NUTRITION_PLAN_ASSIGNED', entityId: client.clientId } });
    expect(auditRow).not.toBeNull();

    const deleteActiveRes = await coach.agent
      .delete(`/api/clients/${client.clientId}/nutrition-plans/${planId}`)
      .set('X-CSRF-Token', coach.csrfToken);
    expect(deleteActiveRes.status).toBe(400);
  });

  it('lets both the client and their coach read the active plan with totals, blocks a different client, and blocks a different coach', async () => {
    const coach = await registerCoach('nutrition-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coach, 'nutrition-client-b@example.com', 'Client B');
    const otherCoach = await registerCoach('nutrition-coach-c@example.com', 'Coach C');
    const otherClient = await createOnboardedClientAccount(coach, 'nutrition-client-c@example.com', 'Client C');

    const noPlanRes = await client.agent.get(`/api/clients/${client.clientId}/nutrition-plan/active`);
    expect(noPlanRes.status).toBe(404);
    expect(noPlanRes.body.error.code).toBe('PLAN_NOT_ACTIVE');

    const planRes = await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Active Plan' });
    const planId = planRes.body.data.id;
    const mealRes = await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans/${planId}/meals`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ type: 'LUNCH' });
    await coach.agent
      .post(`/api/clients/${client.clientId}/nutrition-plans/${planId}/meals/${mealRes.body.data.id}/foods`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ name: 'Chicken Breast', quantity: '200g', calories: 330, proteinG: 62, carbsG: 0, fatG: 7, fiberG: 0 });
    await coach.agent.patch(`/api/clients/${client.clientId}/nutrition-plans/${planId}`).set('X-CSRF-Token', coach.csrfToken).send({ status: 'ACTIVE' });

    const clientReadRes = await client.agent.get(`/api/clients/${client.clientId}/nutrition-plan/active`);
    expect(clientReadRes.status).toBe(200);
    expect(clientReadRes.body.data.dailyTotals.calories).toBe(330);

    const coachReadRes = await coach.agent.get(`/api/clients/${client.clientId}/nutrition-plan/active`);
    expect(coachReadRes.status).toBe(200);

    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${client.clientId}/nutrition-plan/active`);
    expect(otherClientReadRes.status).toBe(403);

    const otherCoachReadRes = await otherCoach.agent.get(`/api/clients/${client.clientId}/nutrition-plan/active`);
    expect(otherCoachReadRes.status).toBe(404);
  });

  it('enforces one active plan per client: activating a second plan archives the first', async () => {
    const coach = await registerCoach('nutrition-coach-invariant@example.com', 'Coach Invariant');
    const client = await createOnboardedClientAccount(coach, 'nutrition-client-invariant@example.com', 'Client Invariant');

    const planARes = await coach.agent.post(`/api/clients/${client.clientId}/nutrition-plans`).set('X-CSRF-Token', coach.csrfToken).send({ name: 'Plan A' });
    const planAId = planARes.body.data.id;
    const planBRes = await coach.agent.post(`/api/clients/${client.clientId}/nutrition-plans`).set('X-CSRF-Token', coach.csrfToken).send({ name: 'Plan B' });
    const planBId = planBRes.body.data.id;

    await coach.agent.patch(`/api/clients/${client.clientId}/nutrition-plans/${planAId}`).set('X-CSRF-Token', coach.csrfToken).send({ status: 'ACTIVE' });
    await coach.agent.patch(`/api/clients/${client.clientId}/nutrition-plans/${planBId}`).set('X-CSRF-Token', coach.csrfToken).send({ status: 'ACTIVE' });

    const planAAfterRes = await coach.agent.get(`/api/clients/${client.clientId}/nutrition-plans/${planAId}`);
    expect(planAAfterRes.body.data.status).toBe('ARCHIVED');

    const activeCount = await prisma.nutritionPlan.count({ where: { clientId: client.clientId, status: 'ACTIVE' } });
    expect(activeCount).toBe(1);
  });
});

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
import { passwordService } from '../src/services/password.service';
import { todayDateOnly } from '../src/utils/date';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();
const sendClientInviteEmailMock = emailService.sendClientInviteEmail as jest.Mock;

async function registerCoach(email: string, fullName: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: 'Password123', fullName });
  const csrfToken = extractCookie(res.headers['set-cookie'] as unknown as string[], 'csrf_token')!;
  return { agent, csrfToken, coachId: res.body.data.coach.id as string };
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

async function loginAsAdmin(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  const csrfToken = extractCookie(res.headers['set-cookie'] as unknown as string[], 'csrf_token')!;
  return { agent, csrfToken };
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Admin analytics — correctness (PRD §31)', () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  let admin: { agent: request.Agent; csrfToken: string };

  beforeAll(async () => {
    const passwordHash = await passwordService.hash('AdminPassword123');
    await prisma.user.create({
      data: { email: 'admin-fixture@example.com', passwordHash, role: 'ADMIN', emailVerified: true, emailVerifiedAt: new Date() },
    });
    admin = await loginAsAdmin('admin-fixture@example.com', 'AdminPassword123');

    // Four coaches: A logged in recently (active/WAU), B/C/D never (or long
    // ago). B/C/D each have a CAPTURED payment ("ever paid"); C and D are
    // effectively churned — C is the specific case Phase 8 fixes: `status`
    // still ACTIVE in the DB but `currentPeriodEnd` already passed (no
    // sweep flips it lazily until that coach next hits a subscription
    // endpoint), D is churned the straightforward way (`status: CANCELED`).
    const coachA = await registerCoach('admin-fixture-coach-a@example.com', 'Coach A');
    const coachB = await registerCoach('admin-fixture-coach-b@example.com', 'Coach B');
    const coachC = await registerCoach('admin-fixture-coach-c@example.com', 'Coach C');
    const coachD = await registerCoach('admin-fixture-coach-d@example.com', 'Coach D');

    await prisma.user.update({ where: { email: 'admin-fixture-coach-a@example.com' }, data: { lastLoginAt: new Date() } });
    await prisma.user.update({ where: { email: 'admin-fixture-coach-b@example.com' }, data: { lastLoginAt: daysAgo(40) } });

    await prisma.payment.create({
      data: { coachId: coachB.coachId, plan: 'PRO', amountInPaise: 99900, status: 'CAPTURED', razorpayOrderId: 'order_fixture_b' },
    });
    await prisma.subscription.update({
      where: { coachId: coachB.coachId },
      data: { plan: 'PRO', status: 'ACTIVE', currentPeriodEnd: daysAgo(-20) }, // 20 days in the future
    });

    await prisma.payment.create({
      data: { coachId: coachC.coachId, plan: 'PRO', amountInPaise: 99900, status: 'CAPTURED', razorpayOrderId: 'order_fixture_c' },
    });
    await prisma.subscription.update({
      where: { coachId: coachC.coachId },
      data: { plan: 'PRO', status: 'ACTIVE', currentPeriodEnd: daysAgo(5) }, // lapsed, but status was never flipped
    });

    await prisma.payment.create({
      data: { coachId: coachD.coachId, plan: 'BUSINESS', amountInPaise: 199900, status: 'CAPTURED', razorpayOrderId: 'order_fixture_d' },
    });
    await prisma.subscription.update({ where: { coachId: coachD.coachId }, data: { plan: 'STARTER', status: 'CANCELED', currentPeriodEnd: null } });

    // Coach A: two clients, one archived. Coach B: one client. Active
    // clients = 2 (A's non-archived + B's), ever created = 3.
    const client1Res = await coachA.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ fullName: 'Client One', email: 'admin-fixture-client-1@example.com' });
    const client2Res = await coachA.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ fullName: 'Client Two', email: 'admin-fixture-client-2@example.com' });
    await coachA.agent.delete(`/api/clients/${client2Res.body.data.id}`).set('X-CSRF-Token', coachA.csrfToken);
    await coachB.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ fullName: 'Client Three', email: 'admin-fixture-client-3@example.com' });

    const client1Id = client1Res.body.data.id as string;

    // One of the two active clients checked in today — check-in rate should read 1/2.
    await prisma.dailyCheckIn.create({ data: { clientId: client1Id, date: todayDateOnly(), steps: 5000 } });

    // AI usage: two logged calls in the last 30 days.
    await prisma.aiUsageLog.create({
      data: { clientId: client1Id, feature: 'chat', model: 'test-model', inputTokens: 10, outputTokens: 20, estimatedCostUsd: 0.05, latencyMs: 100, success: true },
    });
    await prisma.aiUsageLog.create({
      data: { clientId: client1Id, feature: 'chat', model: 'test-model', inputTokens: 10, outputTokens: 20, estimatedCostUsd: 0.1, latencyMs: 120, success: true },
    });
  });

  it('computes every metric against known fixture data, including the churn effective-status fix', async () => {
    const res = await admin.agent.get('/api/admin/analytics');
    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.newCoaches).toEqual({ count: 4, windowDays: 30 });
    expect(data.activeCoaches).toEqual({ count: 1, windowDays: 30, totalCoaches: 4 });
    expect(data.activeClients).toEqual({ count: 2 });
    expect(data.weeklyActiveUsers).toEqual({ count: 1, windowDays: 7 });
    expect(data.checkInRate).toEqual({ pct: 50, numerator: 1, denominator: 2, windowDays: 7 });
    expect(data.aiUsage).toEqual({ requestCount: 2, estimatedCostUsd: expect.closeTo(0.15, 5), windowDays: 30 });
    expect(data.subscriptionConversion).toEqual({ pct: 75, numerator: 3, denominator: 4 });
    // Churn: C (lapsed but status still ACTIVE) and D (status CANCELED) both count, out of 3 ever-paid coaches.
    expect(data.churn).toEqual({ pct: 66.7, numerator: 2, denominator: 3 });
    expect(data.clientRetention).toEqual({ pct: expect.closeTo(66.7, 1), numerator: 2, denominator: 3 });
  });

  it('serves the same analytics from cache on a second call', async () => {
    const first = await admin.agent.get('/api/admin/analytics');
    const second = await admin.agent.get('/api/admin/analytics');
    expect(second.status).toBe(200);
    expect(second.body.data).toEqual(first.body.data);
  });
});

describe('Admin access control', () => {
  it('rejects unauthenticated, COACH, and CLIENT sessions on every admin route', async () => {
    const coach = await registerCoach('admin-access-coach@example.com', 'Access Coach');
    const client = await createOnboardedClientAccount(coach, 'admin-access-client@example.com', 'Access Client');

    const unauthAnalytics = await request(app).get('/api/admin/analytics');
    expect(unauthAnalytics.status).toBe(401);
    const unauthCoaches = await request(app).get('/api/admin/coaches');
    expect(unauthCoaches.status).toBe(401);

    const coachAnalytics = await coach.agent.get('/api/admin/analytics');
    expect(coachAnalytics.status).toBe(403);
    const coachCoaches = await coach.agent.get('/api/admin/coaches');
    expect(coachCoaches.status).toBe(403);

    const clientAnalytics = await client.agent.get('/api/admin/analytics');
    expect(clientAnalytics.status).toBe(403);
    const clientCoaches = await client.agent.get('/api/admin/coaches');
    expect(clientCoaches.status).toBe(403);
  });
});

describe('Admin coach list', () => {
  let admin: { agent: request.Agent; csrfToken: string };

  beforeAll(async () => {
    const passwordHash = await passwordService.hash('AdminPassword123');
    await prisma.user.create({
      data: { email: 'admin-list-fixture@example.com', passwordHash, role: 'ADMIN', emailVerified: true, emailVerifiedAt: new Date() },
    });
    admin = await loginAsAdmin('admin-list-fixture@example.com', 'AdminPassword123');
    await registerCoach('list-coach-unique-zzz@example.com', 'Zebra Unique Name');
  });

  it('paginates and searches by name or email', async () => {
    const pageRes = await admin.agent.get('/api/admin/coaches?page=1&pageSize=2');
    expect(pageRes.status).toBe(200);
    expect(pageRes.body.data.items).toHaveLength(2);
    expect(pageRes.body.data.total).toBeGreaterThanOrEqual(5);

    const searchByNameRes = await admin.agent.get('/api/admin/coaches?search=Zebra Unique');
    expect(searchByNameRes.status).toBe(200);
    expect(searchByNameRes.body.data.items).toHaveLength(1);
    expect(searchByNameRes.body.data.items[0].fullName).toBe('Zebra Unique Name');

    const searchByEmailRes = await admin.agent.get('/api/admin/coaches?search=list-coach-unique-zzz');
    expect(searchByEmailRes.status).toBe(200);
    expect(searchByEmailRes.body.data.items).toHaveLength(1);
  });
});

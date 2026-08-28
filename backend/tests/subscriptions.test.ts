import request from 'supertest';

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendClientInviteEmail: jest.fn(),
    sendNewMessageEmail: jest.fn(),
    sendAtRiskAlertEmail: jest.fn(),
    sendPaymentReceiptEmail: jest.fn(),
  },
}));

// Deliberately does NOT mock src/payments — .env.test has no RAZORPAY_KEY_ID/
// SECRET, so this exercises the real graceful-degradation path checkout/
// verify/webhook all fall back to in this sandbox: a clean 503, never a 500.
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
  const coachId = res.body.data.coach.id as string;
  return { agent, csrfToken, coachId };
}

async function addClient(coach: { agent: request.Agent; csrfToken: string }, email: string, fullName: string) {
  const res = await coach.agent.post('/api/clients').set('X-CSRF-Token', coach.csrfToken).send({ fullName, email });
  return res;
}

async function createOnboardedClientAccount(coach: { agent: request.Agent; csrfToken: string }, email: string, fullName: string) {
  const createRes = await addClient(coach, email, fullName);
  const clientId = createRes.body.data.id as string;

  await coach.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coach.csrfToken);
  const rawToken = sendClientInviteEmailMock.mock.calls.at(-1)![2] as string;

  const clientAgent = request.agent(app);
  const acceptRes = await clientAgent.post(`/api/auth/invite/${rawToken}/accept`).send({ password: 'ClientPassword123' });
  const clientCsrfToken = extractCookie(acceptRes.headers['set-cookie'] as unknown as string[], 'csrf_token')!;

  return { agent: clientAgent, csrfToken: clientCsrfToken, clientId };
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('subscriptions', () => {
  it('gives every new coach a Starter subscription with correct usage and the full plan list', async () => {
    const coach = await registerCoach('sub-coach-a@example.com', 'Coach A');

    const res = await coach.agent.get('/api/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('STARTER');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.usage).toEqual({ used: 0, limit: 5 });
    expect(res.body.data.plans).toHaveLength(3);
    expect(res.body.data.plans.map((p: { plan: string }) => p.plan).sort()).toEqual(['BUSINESS', 'PRO', 'STARTER']);
  });

  it('blocks adding a 6th client on Starter with a 402, and allows it again after archiving one', async () => {
    const coach = await registerCoach('sub-coach-b@example.com', 'Coach B');

    for (let i = 0; i < 5; i += 1) {
      const res = await addClient(coach, `sub-b-client-${i}@example.com`, `Client ${i}`);
      expect(res.status).toBe(201);
    }

    const blockedRes = await addClient(coach, 'sub-b-client-overflow@example.com', 'Overflow Client');
    expect(blockedRes.status).toBe(402);
    expect(blockedRes.body.error.code).toBe('CLIENT_LIMIT_REACHED');

    const statusRes = await coach.agent.get('/api/subscriptions');
    expect(statusRes.body.data.usage.used).toBe(5);

    const listRes = await coach.agent.get('/api/clients?page=1&pageSize=10');
    const firstClientId = listRes.body.data.items[0].id;
    await coach.agent.delete(`/api/clients/${firstClientId}`).set('X-CSRF-Token', coach.csrfToken);

    const retryRes = await addClient(coach, 'sub-b-client-retry@example.com', 'Retry Client');
    expect(retryRes.status).toBe(201);
  });

  it('checkout, verify, and webhook all return a clean BILLING_NOT_CONFIGURED (not a 500) in this sandbox', async () => {
    const coach = await registerCoach('sub-coach-c@example.com', 'Coach C');

    const checkoutRes = await coach.agent.post('/api/subscriptions/checkout').set('X-CSRF-Token', coach.csrfToken).send({ plan: 'PRO' });
    expect(checkoutRes.status).toBe(503);
    expect(checkoutRes.body.error.code).toBe('BILLING_NOT_CONFIGURED');

    const verifyRes = await coach.agent
      .post('/api/subscriptions/verify')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ orderId: 'order_fake', paymentId: 'pay_fake', signature: 'sig_fake' });
    expect(verifyRes.status).toBe(503);
    expect(verifyRes.body.error.code).toBe('BILLING_NOT_CONFIGURED');

    const webhookNoSigRes = await request(app).post('/api/subscriptions/webhook').send({ event: 'payment.captured' });
    expect(webhookNoSigRes.status).toBe(400);
    expect(webhookNoSigRes.body.error.code).toBe('PAYMENT_VERIFICATION_FAILED');

    const webhookWithSigRes = await request(app)
      .post('/api/subscriptions/webhook')
      .set('X-Razorpay-Signature', 'anything')
      .send({ event: 'payment.captured' });
    expect(webhookWithSigRes.status).toBe(503);
    expect(webhookWithSigRes.body.error.code).toBe('BILLING_NOT_CONFIGURED');
  });

  it('blocks downgrading to Starter over capacity, allows it once client count fits', async () => {
    const coach = await registerCoach('sub-coach-d@example.com', 'Coach D');

    // Simulate an already-active Pro plan directly — checkout/verify can't be exercised without real Razorpay keys.
    const futurePeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.update({ where: { coachId: coach.coachId }, data: { plan: 'PRO', status: 'ACTIVE', currentPeriodEnd: futurePeriodEnd } });

    for (let i = 0; i < 6; i += 1) {
      const res = await addClient(coach, `sub-d-client-${i}@example.com`, `Client ${i}`);
      expect(res.status).toBe(201);
    }

    const blockedDowngradeRes = await coach.agent.post('/api/subscriptions/downgrade').set('X-CSRF-Token', coach.csrfToken);
    expect(blockedDowngradeRes.status).toBe(402);
    expect(blockedDowngradeRes.body.error.code).toBe('CLIENT_LIMIT_REACHED');

    const listRes = await coach.agent.get('/api/clients?page=1&pageSize=10');
    for (const client of listRes.body.data.items.slice(0, 2)) {
      await coach.agent.delete(`/api/clients/${client.id}`).set('X-CSRF-Token', coach.csrfToken);
    }

    const downgradeRes = await coach.agent.post('/api/subscriptions/downgrade').set('X-CSRF-Token', coach.csrfToken);
    expect(downgradeRes.status).toBe(200);
    expect(downgradeRes.body.data.plan).toBe('STARTER');
    expect(downgradeRes.body.data.currentPeriodEnd).toBeNull();
  });

  it('self-scopes every endpoint to the calling coach, and blocks a CLIENT role entirely', async () => {
    const coachA = await registerCoach('sub-coach-e@example.com', 'Coach E');
    const coachB = await registerCoach('sub-coach-f@example.com', 'Coach F');

    await addClient(coachA, 'sub-e-client-a@example.com', 'Client A');
    await addClient(coachA, 'sub-e-client-b@example.com', 'Client B');

    const coachAStatus = await coachA.agent.get('/api/subscriptions');
    const coachBStatus = await coachB.agent.get('/api/subscriptions');
    expect(coachAStatus.body.data.usage.used).toBe(2);
    expect(coachBStatus.body.data.usage.used).toBe(0);

    const paymentsRes = await coachB.agent.get('/api/subscriptions/payments');
    expect(paymentsRes.status).toBe(200);
    expect(paymentsRes.body.data.total).toBe(0);

    const client = await createOnboardedClientAccount(coachA, 'sub-e-client-c@example.com', 'Client C');
    const clientStatusRes = await client.agent.get('/api/subscriptions');
    expect(clientStatusRes.status).toBe(403);
    const clientCheckoutRes = await client.agent.post('/api/subscriptions/checkout').set('X-CSRF-Token', client.csrfToken).send({ plan: 'PRO' });
    expect(clientCheckoutRes.status).toBe(403);
  });
});

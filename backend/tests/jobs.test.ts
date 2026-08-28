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

// Weekly-report generation calls through aiService, and the reminder test's
// check-in also queues an analyze-checkin job — branch on toolName the same
// way ai-coach.test.ts does so both paths get a shape they can actually save.
jest.mock('../src/ai', () => ({
  aiService: {
    isConfigured: jest.fn(() => true),
    generateText: jest.fn(async () => 'Mocked assistant reply.'),
    generateStructuredOutput: jest.fn(async (params: { toolName: string }) => {
      if (params.toolName === 'submit_analysis') {
        return {
          riskLevel: 'GREEN',
          confidence: 0.9,
          insights: ['On track'],
          recommendedActions: ['Keep it up'],
          reasoning: 'Consistent check-ins with no red flags.',
        };
      }
      return {
        wins: ['Hit step goal 5 of 7 days'],
        problems: [],
        aiSummary: 'Mocked weekly summary.',
        suggestedActions: ['Keep it up'],
      };
    }),
  },
}));

import { emailService } from '../src/services/email.service';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { pushQueue, weeklyReportQueue } from '../src/jobs/queues';
import { weeklyReportService } from '../src/services/weekly-report.service';
import { reminderService } from '../src/services/reminder.service';
import { resetDatabase, extractCookie } from './helpers';
import { waitForQueueIdle } from './queue-helpers';
import { subtractDays, todayDateOnly } from '../src/utils/date';

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

describe('Weekly report fan-out (worker.ts repeatable job)', () => {
  it('enqueues and generates a report only for a client with check-in data in the completed week', async () => {
    const coach = await registerCoach('jobs-weekly-coach-a@example.com', 'Coach A');
    const withData = await createOnboardedClientAccount(coach, 'jobs-weekly-with-data@example.com', 'With Data');
    const withoutData = await createOnboardedClientAccount(coach, 'jobs-weekly-without-data@example.com', 'Without Data');

    // Seeded directly (not via the check-in API, which blocks backdating
    // beyond yesterday) — covers whatever the "most recently completed
    // week" window resolves to, regardless of today's day-of-week.
    const today = todayDateOnly();
    for (let daysAgo = 1; daysAgo <= 13; daysAgo += 1) {
      await prisma.dailyCheckIn.create({ data: { clientId: withData.clientId, date: subtractDays(today, daysAgo), steps: 5000 } });
    }

    await weeklyReportService.generateForAllActiveClients();
    await waitForQueueIdle(weeklyReportQueue);

    const withDataReports = await prisma.weeklyReport.count({ where: { clientId: withData.clientId } });
    expect(withDataReports).toBe(1);

    const withoutDataReports = await prisma.weeklyReport.count({ where: { clientId: withoutData.clientId } });
    expect(withoutDataReports).toBe(0);
  });
});

describe('Daily check-in reminder sweep (worker.ts repeatable job)', () => {
  it('notifies a client with no check-in today and skips one who already checked in', async () => {
    const coach = await registerCoach('jobs-reminder-coach-a@example.com', 'Coach A');
    const checkedIn = await createOnboardedClientAccount(coach, 'jobs-reminder-checked-in@example.com', 'Checked In');
    const notCheckedIn = await createOnboardedClientAccount(coach, 'jobs-reminder-not-checked-in@example.com', 'Not Checked In');

    await checkedIn.agent.post(`/api/clients/${checkedIn.clientId}/checkins`).set('X-CSRF-Token', checkedIn.csrfToken).send({ steps: 1000 });

    await reminderService.sendDailyCheckInReminders();
    await waitForQueueIdle(pushQueue);

    const checkedInClient = await prisma.client.findUniqueOrThrow({ where: { id: checkedIn.clientId } });
    const notCheckedInClient = await prisma.client.findUniqueOrThrow({ where: { id: notCheckedIn.clientId } });

    const checkedInReminders = await prisma.notification.count({ where: { userId: checkedInClient.userId!, type: 'SYSTEM' } });
    expect(checkedInReminders).toBe(0);

    const notCheckedInReminders = await prisma.notification.findMany({ where: { userId: notCheckedInClient.userId!, type: 'SYSTEM' } });
    expect(notCheckedInReminders).toHaveLength(1);
    expect(notCheckedInReminders[0]!.title).toBe('Check-in reminder');
  });
});

describe('Push subscriptions', () => {
  it('persists a subscribe, exposes the VAPID public key, and removes it on unsubscribe — self-scoped per user', async () => {
    const coach = await registerCoach('jobs-push-coach-a@example.com', 'Coach A');

    const keyRes = await coach.agent.get('/api/push/vapid-public-key');
    expect(keyRes.status).toBe(200);
    expect(typeof keyRes.body.data.publicKey).toBe('string');
    expect(keyRes.body.data.publicKey.length).toBeGreaterThan(0);

    const endpoint = 'https://push.example.com/subscription/abc123';
    const subscribeRes = await coach.agent
      .post('/api/push/subscribe')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ endpoint, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } });
    expect(subscribeRes.status).toBe(201);

    const stored = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    expect(stored).not.toBeNull();
    expect(stored?.p256dh).toBe('p256dh-key');

    const unsubscribeRes = await coach.agent.post('/api/push/unsubscribe').set('X-CSRF-Token', coach.csrfToken).send({ endpoint });
    expect(unsubscribeRes.status).toBe(200);

    const afterDelete = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    expect(afterDelete).toBeNull();
  });

  it('rejects an unauthenticated subscribe attempt', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://push.example.com/subscription/xyz', keys: { p256dh: 'k', auth: 'a' } });
    expect(res.status).toBe(401);
  });

  it("does not let one user unsubscribe another user's push subscription", async () => {
    const owner = await registerCoach('jobs-push-owner@example.com', 'Owner');
    const attacker = await registerCoach('jobs-push-attacker@example.com', 'Attacker');

    const endpoint = 'https://push.example.com/subscription/owner-only';
    const subscribeRes = await owner.agent
      .post('/api/push/subscribe')
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ endpoint, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } });
    expect(subscribeRes.status).toBe(201);

    const unsubscribeRes = await attacker.agent.post('/api/push/unsubscribe').set('X-CSRF-Token', attacker.csrfToken).send({ endpoint });
    expect(unsubscribeRes.status).toBe(200);

    const stillStored = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    expect(stillStored).not.toBeNull();
  });
});

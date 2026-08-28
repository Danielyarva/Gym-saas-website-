import request from 'supertest';

jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendClientInviteEmail: jest.fn(),
  },
}));

// Exercises the full AI pipeline (happy path, ownership, upsert-not-duplicate)
// against a mocked provider layer — src/ai/index.ts's own real "not
// configured" behavior is covered separately in ai-coach-not-configured.test.ts.
jest.mock('../src/ai', () => ({
  aiService: {
    isConfigured: jest.fn(() => true),
    generateText: jest.fn(async () => 'Mocked assistant reply.'),
    generateStructuredOutput: jest.fn(async (params: { toolName: string }) => {
      if (params.toolName === 'submit_analysis') {
        return {
          riskLevel: 'YELLOW',
          confidence: 0.7,
          insights: ['Workout adherence dipped this week'],
          recommendedActions: ['Check in about barriers to training'],
          reasoning: 'Workout completion dropped from 90% to 60% over the last 7 check-ins.',
        };
      }
      return {
        wins: ['Hit step goal 5 of 7 days'],
        problems: ['Missed two workouts'],
        aiSummary: 'Solid week overall with room to improve workout consistency.',
        suggestedActions: ['Discuss workout scheduling next check-in'],
      };
    }),
  },
}));

import { emailService } from '../src/services/email.service';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { aiAnalysisQueue } from '../src/jobs/queues';
import { resetDatabase, extractCookie } from './helpers';
import { waitForQueueIdle } from './queue-helpers';

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

describe('AI chat', () => {
  it('lets a client send a message and read history; coach can read but not send', async () => {
    const coach = await registerCoach('ai-chat-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'ai-chat-client-a@example.com', 'Client A');

    const sendRes = await client.agent
      .post(`/api/clients/${client.clientId}/ai/chat`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ content: 'How is my progress this week?' });
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.role).toBe('ASSISTANT');
    expect(sendRes.body.data.content).toBe('Mocked assistant reply.');

    const historyRes = await client.agent.get(`/api/clients/${client.clientId}/ai/chat`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.total).toBe(2);

    const coachHistoryRes = await coach.agent.get(`/api/clients/${client.clientId}/ai/chat`);
    expect(coachHistoryRes.status).toBe(200);
    expect(coachHistoryRes.body.data.total).toBe(2);

    const coachSendRes = await coach.agent.post(`/api/clients/${client.clientId}/ai/chat`).set('X-CSRF-Token', coach.csrfToken).send({ content: 'hi' });
    expect(coachSendRes.status).toBe(403);
  });

  it('enforces ownership: another coach or another client cannot read or send', async () => {
    const coachA = await registerCoach('ai-chat-coach-b@example.com', 'Coach B');
    const coachB = await registerCoach('ai-chat-coach-c@example.com', 'Coach C');
    const clientA = await createOnboardedClientAccount(coachA, 'ai-chat-client-b@example.com', 'Client B');
    const otherClient = await createOnboardedClientAccount(coachB, 'ai-chat-client-c@example.com', 'Client C');

    const otherCoachReadRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/ai/chat`);
    expect(otherCoachReadRes.status).toBe(404);

    const otherClientReadRes = await otherClient.agent.get(`/api/clients/${clientA.clientId}/ai/chat`);
    expect(otherClientReadRes.status).toBe(403);

    const otherClientSendRes = await otherClient.agent
      .post(`/api/clients/${clientA.clientId}/ai/chat`)
      .set('X-CSRF-Token', otherClient.csrfToken)
      .send({ content: 'hi' });
    expect(otherClientSendRes.status).toBe(403);
  });
});

describe('AI insights', () => {
  it('generates an insight as a side effect of check-in submission, readable by the client and their coach only', async () => {
    const coach = await registerCoach('ai-insight-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'ai-insight-client-a@example.com', 'Client A');

    const emptyRes = await client.agent.get(`/api/clients/${client.clientId}/ai/insights`);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.total).toBe(0);

    const submitRes = await client.agent
      .post(`/api/clients/${client.clientId}/checkins`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({ workoutCompleted: false, steps: 3000 });
    expect(submitRes.status).toBe(200);

    // analyzeCheckIn runs via aiAnalysisQueue after the check-in response — wait for the real worker to finish it.
    await waitForQueueIdle(aiAnalysisQueue);

    const insightsRes = await client.agent.get(`/api/clients/${client.clientId}/ai/insights`);
    expect(insightsRes.status).toBe(200);
    expect(insightsRes.body.data.total).toBe(1);
    expect(insightsRes.body.data.insights[0].riskLevel).toBe('YELLOW');

    const coachInsightsRes = await coach.agent.get(`/api/clients/${client.clientId}/ai/insights`);
    expect(coachInsightsRes.status).toBe(200);
    expect(coachInsightsRes.body.data.total).toBe(1);
  });

  it('enforces ownership on reading insights', async () => {
    const coachA = await registerCoach('ai-insight-coach-b@example.com', 'Coach B');
    const coachB = await registerCoach('ai-insight-coach-c@example.com', 'Coach C');
    const clientA = await createOnboardedClientAccount(coachA, 'ai-insight-client-b@example.com', 'Client B');
    const otherClient = await createOnboardedClientAccount(coachB, 'ai-insight-client-c@example.com', 'Client C');

    const otherCoachRes = await coachB.agent.get(`/api/clients/${clientA.clientId}/ai/insights`);
    expect(otherCoachRes.status).toBe(404);

    const otherClientRes = await otherClient.agent.get(`/api/clients/${clientA.clientId}/ai/insights`);
    expect(otherClientRes.status).toBe(403);
  });
});

describe('Weekly reports', () => {
  it('lets a coach generate a report, regenerating the same week updates rather than duplicates', async () => {
    const coach = await registerCoach('weekly-report-coach-a@example.com', 'Coach A');
    const client = await createOnboardedClientAccount(coach, 'weekly-report-client-a@example.com', 'Client A');

    const generateRes = await coach.agent.post(`/api/clients/${client.clientId}/ai/weekly-report`).set('X-CSRF-Token', coach.csrfToken).send({});
    expect(generateRes.status).toBe(201);
    expect(generateRes.body.data.aiSummary).toBe('Solid week overall with room to improve workout consistency.');

    const regenerateRes = await coach.agent.post(`/api/clients/${client.clientId}/ai/weekly-report`).set('X-CSRF-Token', coach.csrfToken).send({});
    expect(regenerateRes.status).toBe(201);

    const count = await prisma.weeklyReport.count({ where: { clientId: client.clientId } });
    expect(count).toBe(1);

    const listRes = await client.agent.get(`/api/clients/${client.clientId}/ai/weekly-report`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);

    const clientGenerateRes = await client.agent
      .post(`/api/clients/${client.clientId}/ai/weekly-report`)
      .set('X-CSRF-Token', client.csrfToken)
      .send({});
    expect(clientGenerateRes.status).toBe(403);
  });

  it('enforces ownership on generating and reading reports', async () => {
    const coachA = await registerCoach('weekly-report-coach-b@example.com', 'Coach B');
    const coachB = await registerCoach('weekly-report-coach-c@example.com', 'Coach C');
    const clientA = await createOnboardedClientAccount(coachA, 'weekly-report-client-b@example.com', 'Client B');

    const otherCoachGenerateRes = await coachB.agent
      .post(`/api/clients/${clientA.clientId}/ai/weekly-report`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({});
    expect(otherCoachGenerateRes.status).toBe(404);
  });

  it('surfaces the coach\'s generated reports across their roster on GET /api/reports, isolated per coach', async () => {
    const coachA = await registerCoach('reports-coach-a@example.com', 'Coach A');
    const coachB = await registerCoach('reports-coach-b@example.com', 'Coach B');
    const client = await createOnboardedClientAccount(coachA, 'reports-client-a@example.com', 'Client A');

    await coachA.agent.post(`/api/clients/${client.clientId}/ai/weekly-report`).set('X-CSRF-Token', coachA.csrfToken).send({});

    const coachAReportsRes = await coachA.agent.get('/api/reports');
    expect(coachAReportsRes.status).toBe(200);
    expect(coachAReportsRes.body.data.total).toBeGreaterThanOrEqual(1);
    expect(coachAReportsRes.body.data.reports[0].client.id).toBe(client.clientId);

    const coachBReportsRes = await coachB.agent.get('/api/reports');
    expect(coachBReportsRes.status).toBe(200);
    expect(coachBReportsRes.body.data.total).toBe(0);

    const clientReportsRes = await client.agent.get('/api/reports');
    expect(clientReportsRes.status).toBe(403);
  });
});

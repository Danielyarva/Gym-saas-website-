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

function latestInviteToken(): string {
  const lastCall = sendClientInviteEmailMock.mock.calls.at(-1);
  if (!lastCall) throw new Error('sendClientInviteEmail was never called');
  return lastCall[2] as string; // (to, coachFullName, rawToken)
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

describe('client account invite flow', () => {
  it('lets a coach invite their client, and the client accepts and logs in as CLIENT', async () => {
    const coach = await registerCoach('invite-coach-a@example.com', 'Coach A');

    const createRes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Riley Client', email: 'riley@example.com' });
    const clientId = createRes.body.data.id as string;

    const inviteRes = await coach.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coach.csrfToken);
    expect(inviteRes.status).toBe(200);
    expect(sendClientInviteEmailMock).toHaveBeenCalledTimes(1);

    const rawToken = latestInviteToken();

    const previewRes = await request(app).get(`/api/auth/invite/${rawToken}`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.email).toBe('riley@example.com');

    const acceptRes = await request(app).post(`/api/auth/invite/${rawToken}/accept`).send({ password: 'ClientPassword123' });
    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.data.user.role).toBe('CLIENT');
    expect(acceptRes.body.data.user.emailVerified).toBe(true);

    const setCookies = acceptRes.headers['set-cookie'] as unknown as string[];
    const clientCsrf = extractCookie(setCookies, 'csrf_token')!;
    const accessCookie = extractCookie(setCookies, 'access_token')!;

    const meRes = await request(app).get('/api/auth/me').set('Cookie', `access_token=${accessCookie}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.role).toBe('CLIENT');
    void clientCsrf;

    // Reusing the same token must fail — it's single-use.
    const reuseRes = await request(app).post(`/api/auth/invite/${rawToken}/accept`).send({ password: 'AnotherPassword123' });
    expect(reuseRes.status).toBe(404);
    expect(reuseRes.body.error.code).toBe('INVITE_INVALID');

    // Inviting an already-linked client must be rejected.
    const secondInviteRes = await coach.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coach.csrfToken);
    expect(secondInviteRes.status).toBe(409);
    expect(secondInviteRes.body.error.code).toBe('CLIENT_ALREADY_LINKED');
  });

  it('rejects an expired invite token distinctly from an invalid one', async () => {
    const coach = await registerCoach('invite-coach-b@example.com', 'Coach B');
    const createRes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Jamie Client', email: 'jamie@example.com' });
    const clientId = createRes.body.data.id as string;

    await coach.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coach.csrfToken);
    const rawToken = latestInviteToken();

    await prisma.clientInviteToken.updateMany({ where: { clientId }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const expiredRes = await request(app).get(`/api/auth/invite/${rawToken}`);
    expect(expiredRes.status).toBe(410);
    expect(expiredRes.body.error.code).toBe('INVITE_EXPIRED');

    const madeUpRes = await request(app).get('/api/auth/invite/0000000000000000000000000000000000000000000000000000000000000000');
    expect(madeUpRes.status).toBe(404);
    expect(madeUpRes.body.error.code).toBe('INVITE_INVALID');
  });

  it('rejects a mutating invite request without CSRF, and blocks a non-owning coach', async () => {
    const coachA = await registerCoach('invite-coach-c@example.com', 'Coach C');
    const coachB = await registerCoach('invite-coach-d@example.com', 'Coach D');

    const createRes = await coachA.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ fullName: 'Owned Client', email: 'owned@example.com' });
    const clientId = createRes.body.data.id as string;

    const noCsrfRes = await coachA.agent.post(`/api/clients/${clientId}/invite`);
    expect(noCsrfRes.status).toBe(403);

    const otherCoachRes = await coachB.agent.post(`/api/clients/${clientId}/invite`).set('X-CSRF-Token', coachB.csrfToken);
    expect(otherCoachRes.status).toBe(404);

    expect(sendClientInviteEmailMock).not.toHaveBeenCalled();
  });
});

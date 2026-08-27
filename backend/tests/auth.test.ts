import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auth flow', () => {
  const credentials = { email: 'jordan@example.com', password: 'Password123', fullName: 'Jordan Lee' };

  it('registers a new coach and sets httpOnly auth cookies plus a readable CSRF cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('COACH');
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.coach.fullName).toBe(credentials.fullName);

    const setCookies = res.headers['set-cookie'] as unknown as string[];
    expect(setCookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly'))).toBe(true);
    expect(setCookies.some((c) => c.startsWith('refresh_token=') && c.includes('HttpOnly'))).toBe(true);
    expect(setCookies.some((c) => c.startsWith('csrf_token=') && !c.includes('HttpOnly'))).toBe(true);
  });

  it('rejects a duplicate registration email', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in, hydrates /api/auth/me, and rejects a mutating request without the CSRF header', async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(credentials.email);

    const csrfToken = extractCookie(loginRes.headers['set-cookie'] as unknown as string[], 'csrf_token');
    expect(csrfToken).toBeTruthy();

    const noCsrfRes = await agent.post('/api/auth/logout-all');
    expect(noCsrfRes.status).toBe(403);
    expect(noCsrfRes.body.error.code).toBe('FORBIDDEN');

    const withCsrfRes = await agent.post('/api/auth/logout-all').set('X-CSRF-Token', csrfToken!);
    expect(withCsrfRes.status).toBe(200);
  });

  it('rejects requests to protected routes with no session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

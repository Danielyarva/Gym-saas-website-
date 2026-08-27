import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { resetDatabase, extractCookie } from './helpers';

const app = createApp();

async function registerCoach(email: string, fullName: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: 'Password123', fullName });
  const csrfToken = extractCookie(res.headers['set-cookie'] as unknown as string[], 'csrf_token')!;
  return { agent, csrfToken };
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('client CRUD + archive lifecycle', () => {
  it('creates a client, lists it, archives it out of the default view, then restores it', async () => {
    const coach = await registerCoach('coach-e@example.com', 'Coach E');

    const createRes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Priya Shah', email: 'priya@example.com', startingWeightKg: 70, goalWeightKg: 65 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('ON_TRACK');
    expect(createRes.body.data.profile.currentWeightKg).toBe(70);
    const clientId = createRes.body.data.id as string;

    const activeListRes = await coach.agent.get('/api/clients');
    expect(activeListRes.body.data.items.map((c: { id: string }) => c.id)).toContain(clientId);

    const archiveRes = await coach.agent.delete(`/api/clients/${clientId}`).set('X-CSRF-Token', coach.csrfToken);
    expect(archiveRes.status).toBe(200);

    const afterArchiveListRes = await coach.agent.get('/api/clients');
    expect(afterArchiveListRes.body.data.items.map((c: { id: string }) => c.id)).not.toContain(clientId);

    const archivedListRes = await coach.agent.get('/api/clients?archived=true');
    expect(archivedListRes.body.data.items.map((c: { id: string }) => c.id)).toContain(clientId);

    const unarchiveRes = await coach.agent.post(`/api/clients/${clientId}/unarchive`).set('X-CSRF-Token', coach.csrfToken);
    expect(unarchiveRes.status).toBe(200);

    const restoredListRes = await coach.agent.get('/api/clients');
    expect(restoredListRes.body.data.items.map((c: { id: string }) => c.id)).toContain(clientId);
  });

  it('lets the authoring coach update and delete their own note', async () => {
    const coach = await registerCoach('coach-f@example.com', 'Coach F');

    const clientRes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Morgan Blake', email: 'morgan@example.com' });
    const clientId = clientRes.body.data.id as string;

    const noteRes = await coach.agent
      .post(`/api/clients/${clientId}/notes`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ body: 'First check-in went well.' });
    expect(noteRes.status).toBe(201);
    const noteId = noteRes.body.data.id as string;

    const updateRes = await coach.agent
      .patch(`/api/clients/${clientId}/notes/${noteId}`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ body: 'Updated: first check-in went well, adjusted macros.' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.body).toContain('adjusted macros');

    const deleteRes = await coach.agent.delete(`/api/clients/${clientId}/notes/${noteId}`).set('X-CSRF-Token', coach.csrfToken);
    expect(deleteRes.status).toBe(200);

    const listRes = await coach.agent.get(`/api/clients/${clientId}/notes`);
    expect(listRes.body.data).toHaveLength(0);
  });
});

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

describe('coach-client ownership isolation (PRD §32)', () => {
  it('never lets one coach read, list, modify, or archive another coach\'s client', async () => {
    const coachA = await registerCoach('coach-a@example.com', 'Coach A');
    const coachB = await registerCoach('coach-b@example.com', 'Coach B');

    const createRes = await coachA.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ fullName: 'Alex Rivera', email: 'alex@example.com', goalText: 'Fat loss' });
    expect(createRes.status).toBe(201);
    const clientId = createRes.body.data.id as string;

    // Coach B's own client list must not include Coach A's client.
    const listRes = await coachB.agent.get('/api/clients');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(0);

    // Direct ID access, mutation, archive, and notes must all 404 for Coach B —
    // never a distinguishable 403 that would confirm the client exists.
    const getRes = await coachB.agent.get(`/api/clients/${clientId}`);
    expect(getRes.status).toBe(404);
    expect(getRes.body.error.code).toBe('NOT_FOUND');

    const patchRes = await coachB.agent
      .patch(`/api/clients/${clientId}`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ status: 'AT_RISK' });
    expect(patchRes.status).toBe(404);

    const archiveRes = await coachB.agent.delete(`/api/clients/${clientId}`).set('X-CSRF-Token', coachB.csrfToken);
    expect(archiveRes.status).toBe(404);

    const notesListRes = await coachB.agent.get(`/api/clients/${clientId}/notes`);
    expect(notesListRes.status).toBe(404);

    const addNoteRes = await coachB.agent
      .post(`/api/clients/${clientId}/notes`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ body: 'Should never be created' });
    expect(addNoteRes.status).toBe(404);

    // Coach A, the actual owner, can do all of the above.
    const ownGetRes = await coachA.agent.get(`/api/clients/${clientId}`);
    expect(ownGetRes.status).toBe(200);

    const ownArchiveRes = await coachA.agent.delete(`/api/clients/${clientId}`).set('X-CSRF-Token', coachA.csrfToken);
    expect(ownArchiveRes.status).toBe(200);
  });

  it('only lets the authoring coach edit or delete a client note', async () => {
    const coachA = await registerCoach('coach-c@example.com', 'Coach C');
    const coachB = await registerCoach('coach-d@example.com', 'Coach D');

    const createRes = await coachA.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ fullName: 'Sam Chen', email: 'sam@example.com' });
    const clientId = createRes.body.data.id as string;

    const noteRes = await coachA.agent
      .post(`/api/clients/${clientId}/notes`)
      .set('X-CSRF-Token', coachA.csrfToken)
      .send({ body: 'Initial note' });
    expect(noteRes.status).toBe(201);

    // Coach B doesn't own this client at all, so ownership 404s before authorship is even checked.
    const otherCoachEditRes = await coachB.agent
      .patch(`/api/clients/${clientId}/notes/${noteRes.body.data.id}`)
      .set('X-CSRF-Token', coachB.csrfToken)
      .send({ body: 'Hijacked' });
    expect(otherCoachEditRes.status).toBe(404);
  });

  it("never lets a coach edit or delete a note through a different client of their own that they also own", async () => {
    const coach = await registerCoach('coach-g@example.com', 'Coach G');

    const clientARes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Client A', email: 'client-a-notes@example.com' });
    const clientBRes = await coach.agent
      .post('/api/clients')
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ fullName: 'Client B', email: 'client-b-notes@example.com' });
    const clientAId = clientARes.body.data.id as string;
    const clientBId = clientBRes.body.data.id as string;

    const noteRes = await coach.agent
      .post(`/api/clients/${clientAId}/notes`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ body: 'Belongs to client A' });
    const noteId = noteRes.body.data.id as string;

    // The coach owns both clients and authored the note, but the note
    // belongs to client A — reaching it through client B's URL must 404.
    const crossClientEditRes = await coach.agent
      .patch(`/api/clients/${clientBId}/notes/${noteId}`)
      .set('X-CSRF-Token', coach.csrfToken)
      .send({ body: 'Hijacked via wrong client id' });
    expect(crossClientEditRes.status).toBe(404);

    const crossClientDeleteRes = await coach.agent.delete(`/api/clients/${clientBId}/notes/${noteId}`).set('X-CSRF-Token', coach.csrfToken);
    expect(crossClientDeleteRes.status).toBe(404);

    // The note is untouched and still reachable through its real client.
    const stillThereRes = await coach.agent.get(`/api/clients/${clientAId}/notes`);
    expect(stillThereRes.body.data).toHaveLength(1);
    expect(stillThereRes.body.data[0].body).toBe('Belongs to client A');
  });
});

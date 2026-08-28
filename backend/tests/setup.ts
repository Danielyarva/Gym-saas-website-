import path from 'node:path';
import dotenv from 'dotenv';

// Loaded before any test file's own imports run (Jest's setupFilesAfterEnv
// timing), so src/config/env.ts validates against the test database's
// config, never the developer's local .env.
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

// No test currently combines "user has a stored push subscription" with "a
// notification fires for that user," so push/index.ts#sendToUser never
// actually calls webpush.sendNotification today — but that's incidental,
// not guaranteed. Mocked globally (not per-test-file, since no test wants
// the real network call) so a future test can't accidentally make a live
// request to a fake push endpoint.
jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

import { Worker } from 'bullmq';
import { redisConnection } from '../src/jobs/connection';
import { emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue } from '../src/jobs/queues';

const queues = [emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue];
let workers: Worker[] = [];

/**
 * Real in-process Workers against the test Redis DB (.env.test's REDIS_URL
 * ends /1, separate from dev's /0) — jobs enqueued during a test are
 * genuinely processed by a real worker, not mocked.
 *
 * The processors are imported here, inside `beforeAll`, via a dynamic
 * `import()` rather than a static top-level import. Jest fully loads a
 * test file — including its `jest.mock(...)` calls — before running any
 * lifecycle hook, but a setupFilesAfterEnv file's own top-level code runs
 * *before* that. A top-level import here would eagerly cache the real
 * (unmocked) service modules (email.service, ai/index, payments/index, ...)
 * reachable from these processors, before a test file's own
 * `jest.mock('../src/ai', ...)` ever takes effect — silently defeating
 * every test file's mocks. A dynamic import inside `beforeAll` defers
 * module resolution until Jest actually runs this file's hooks, which is
 * after the whole test file (mocks included) has been loaded.
 */
beforeAll(async () => {
  const [{ processEmailJob }, { processAiAnalysisJob }, { processWebhookJob }, { processPushJob }, { processWeeklyReportJob }, { processReminderJob }] =
    await Promise.all([
      import('../src/jobs/processors/email.processor'),
      import('../src/jobs/processors/ai-analysis.processor'),
      import('../src/jobs/processors/webhooks.processor'),
      import('../src/jobs/processors/push.processor'),
      import('../src/jobs/processors/weekly-report.processor'),
      import('../src/jobs/processors/reminder.processor'),
    ]);

  workers = [
    new Worker('email', processEmailJob, { connection: redisConnection }),
    new Worker('ai-analysis', processAiAnalysisJob, { connection: redisConnection }),
    new Worker('webhooks', processWebhookJob, { connection: redisConnection }),
    new Worker('push', processPushJob, { connection: redisConnection }),
    new Worker('weekly-report', processWeeklyReportJob, { connection: redisConnection }),
    new Worker('reminder', processReminderJob, { connection: redisConnection }),
  ];
});

afterAll(async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(queues.map((queue) => queue.close()));
  await redisConnection.quit();
});

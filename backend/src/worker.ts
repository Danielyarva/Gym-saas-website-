import { Worker } from 'bullmq';
import { redisConnection } from './jobs/connection';
import { emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue } from './jobs/queues';
import { processEmailJob } from './jobs/processors/email.processor';
import { processAiAnalysisJob } from './jobs/processors/ai-analysis.processor';
import { processWebhookJob } from './jobs/processors/webhooks.processor';
import { processPushJob } from './jobs/processors/push.processor';
import { processWeeklyReportJob } from './jobs/processors/weekly-report.processor';
import { processReminderJob } from './jobs/processors/reminder.processor';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

const queues = [emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue];

const workers = [
  new Worker('email', processEmailJob, { connection: redisConnection }),
  new Worker('ai-analysis', processAiAnalysisJob, { connection: redisConnection }),
  new Worker('webhooks', processWebhookJob, { connection: redisConnection }),
  new Worker('push', processPushJob, { connection: redisConnection }),
  new Worker('weekly-report', processWeeklyReportJob, { connection: redisConnection }),
  new Worker('reminder', processReminderJob, { connection: redisConnection }),
];

workers.forEach((worker) => {
  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, queue: worker.name }, 'Job failed');
  });
});

/**
 * PRD §19's "every week" report and the daily check-in reminder, finally
 * possible now that a job queue exists. `upsertJobScheduler` is BullMQ's
 * repeatable-job API (superseding `.add(..., { repeat })`) — upserting by a
 * fixed scheduler id means re-running the worker on every restart updates
 * the existing schedule rather than creating a duplicate.
 */
async function registerSchedules(): Promise<void> {
  await weeklyReportQueue.upsertJobScheduler('weekly-report-fan-out', { pattern: '0 0 * * 1' }, { name: 'fan-out' });
  await reminderQueue.upsertJobScheduler('reminder-sweep', { pattern: '0 18 * * *' }, { name: 'sweep' });
}

void registerSchedules();

logger.info('AI Coach OS background worker started');

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down worker gracefully`);
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(queues.map((queue) => queue.close()));
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

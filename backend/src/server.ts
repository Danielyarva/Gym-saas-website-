import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue } from './jobs/queues';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`AI Coach OS backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

// The API process is a BullMQ producer (every `queue.add(...)` call in the
// request path) even though job processing itself happens in worker.ts —
// its own Queue connections need closing on shutdown too.
const queues = [emailQueue, aiAnalysisQueue, webhooksQueue, pushQueue, weeklyReportQueue, reminderQueue];

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await Promise.all(queues.map((queue) => queue.close()));
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

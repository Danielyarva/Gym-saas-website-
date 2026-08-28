import { Queue, type QueueOptions } from 'bullmq';
import { redisConnection } from './connection';

// One Queue per PRD §28 bullet ("Notifications" -> pushQueue, "Subscription
// events" -> webhooksQueue). Job data is a plain internal contract between
// producer and processor, not user input, so it's typed with interfaces
// rather than re-validated with Zod at this boundary.

// Shared by every queue: a job that throws gets retried a few times with
// backoff before it's given up on (BullMQ's default is a single attempt,
// no retry at all) — completed/failed jobs are still capped so Redis
// doesn't grow unbounded. Two processors (ai-analysis, and the three email
// job types) currently catch their own errors internally and never throw,
// so retries don't apply to them by design — see their docstrings.
const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export interface AtRiskAlertEmailJob {
  to: string;
  clientFullName: string;
  clientUrl: string;
}

export interface NewMessageEmailJob {
  to: string;
  senderName: string;
  threadUrl: string;
}

export interface PaymentReceiptEmailJob {
  to: string;
  planLabel: string;
  amountInPaise: number;
  currency: string;
}

export type EmailJobData = AtRiskAlertEmailJob | NewMessageEmailJob | PaymentReceiptEmailJob;
export const emailQueue = new Queue<EmailJobData>('email', { connection: redisConnection, defaultJobOptions });

export interface AnalyzeCheckInJob {
  clientId: string;
  checkInId: string;
}
export const aiAnalysisQueue = new Queue<AnalyzeCheckInJob>('ai-analysis', { connection: redisConnection, defaultJobOptions });

export interface ProcessWebhookJob {
  rawBody: string; // base64-encoded raw request body
}
export const webhooksQueue = new Queue<ProcessWebhookJob>('webhooks', { connection: redisConnection, defaultJobOptions });

export interface SendPushJob {
  userId: string;
  title: string;
  body: string;
}
export const pushQueue = new Queue<SendPushJob>('push', { connection: redisConnection, defaultJobOptions });

export interface GenerateOneReportJob {
  clientId: string;
}
export type WeeklyReportJobData = GenerateOneReportJob | Record<string, never>;
export const weeklyReportQueue = new Queue<WeeklyReportJobData>('weekly-report', { connection: redisConnection, defaultJobOptions });

export const reminderQueue = new Queue('reminder', { connection: redisConnection, defaultJobOptions });

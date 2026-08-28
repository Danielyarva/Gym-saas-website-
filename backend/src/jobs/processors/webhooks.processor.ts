import type { Job } from 'bullmq';
import { subscriptionService } from '../../services/subscription.service';
import type { ProcessWebhookJob } from '../queues';

export async function processWebhookJob(job: Job<ProcessWebhookJob>): Promise<void> {
  const rawBody = Buffer.from(job.data.rawBody, 'base64');
  await subscriptionService.processWebhookEvent(rawBody);
}

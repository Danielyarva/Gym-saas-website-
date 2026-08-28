import type { Job } from 'bullmq';
import { pushService } from '../../push';
import type { SendPushJob } from '../queues';

export async function processPushJob(job: Job<SendPushJob>): Promise<void> {
  await pushService.sendToUser(job.data.userId, { title: job.data.title, body: job.data.body });
}

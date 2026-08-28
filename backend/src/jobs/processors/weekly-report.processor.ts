import type { Job } from 'bullmq';
import { weeklyReportService } from '../../services/weekly-report.service';
import type { GenerateOneReportJob, WeeklyReportJobData } from '../queues';

export async function processWeeklyReportJob(job: Job<WeeklyReportJobData>): Promise<void> {
  if (job.name === 'generate-one') {
    const { clientId } = job.data as GenerateOneReportJob;
    await weeklyReportService.generate(clientId, undefined);
    return;
  }
  if (job.name === 'fan-out') {
    await weeklyReportService.generateForAllActiveClients();
    return;
  }
  throw new Error(`Unknown weekly-report job: ${job.name}`);
}

import type { Job } from 'bullmq';
import { aiInsightService } from '../../services/ai-insight.service';
import type { AnalyzeCheckInJob } from '../queues';

export async function processAiAnalysisJob(job: Job<AnalyzeCheckInJob>): Promise<void> {
  await aiInsightService.analyzeCheckIn(job.data.clientId, job.data.checkInId);
}

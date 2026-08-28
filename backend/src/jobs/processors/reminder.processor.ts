import type { Job } from 'bullmq';
import { reminderService } from '../../services/reminder.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processReminderJob(_job: Job): Promise<void> {
  await reminderService.sendDailyCheckInReminders();
}

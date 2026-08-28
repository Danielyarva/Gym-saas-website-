import { clientRepository } from '../repositories/client.repository';
import { notificationService } from './notification.service';
import { todayDateOnly } from '../utils/date';

/**
 * Daily sweep (reminder.processor.ts, PRD §28's "Reminder jobs"). The first
 * real trigger for the SYSTEM notification type, mirroring how Phase 6
 * revived SUBSCRIPTION. Silently skips clients with no linked User account —
 * there's no one to notify yet.
 */
async function sendDailyCheckInReminders(): Promise<void> {
  const clients = await clientRepository.listActiveWithoutCheckInOnDate(todayDateOnly());

  await Promise.all(
    clients
      .filter((client): client is typeof client & { userId: string } => client.userId !== null)
      .map((client) => notificationService.notifySystem(client.userId, 'Check-in reminder', "Don't forget to check in today!")),
  );
}

export const reminderService = {
  sendDailyCheckInReminders,
};

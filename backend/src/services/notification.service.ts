import type { NotificationType } from '@prisma/client';
import { coachClientRepository } from '../repositories/client.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { emailService } from './email.service';
import { env } from '../config/env';

function notify(userId: string, type: NotificationType, title: string, body: string, clientId: string) {
  return notificationRepository.create({ userId, type, title, body, entityType: 'CLIENT', entityId: clientId });
}

/**
 * Every trigger below looks up the client's one coach relationship fresh —
 * cheap (one indexed query) and always current, unlike threading a coach
 * object through every call site. Silently no-ops if the relationship is
 * somehow missing (e.g. an archived/orphaned client) rather than throwing,
 * since a notification is never the reason a request should fail.
 */
async function notifyCheckIn(clientId: string): Promise<void> {
  const coachClient = await coachClientRepository.findByClientId(clientId);
  if (!coachClient) return;
  await notify(coachClient.coach.userId, 'CLIENT_CHECKIN', 'New check-in', `${coachClient.client.fullName} checked in today`, clientId);
}

async function notifyMissedWorkout(clientId: string): Promise<void> {
  const coachClient = await coachClientRepository.findByClientId(clientId);
  if (!coachClient) return;
  await notify(
    coachClient.coach.userId,
    'MISSED_WORKOUT',
    'Missed workout',
    `${coachClient.client.fullName} marked today's workout as not completed`,
    clientId,
  );
}

async function notifyAtRisk(clientId: string): Promise<void> {
  const coachClient = await coachClientRepository.findByClientId(clientId);
  if (!coachClient) return;
  await notify(
    coachClient.coach.userId,
    'CLIENT_AT_RISK',
    'Client at risk',
    `${coachClient.client.fullName}'s latest AI analysis flagged them as at risk`,
    clientId,
  );

  if (coachClient.coach.user?.email) {
    void emailService.sendAtRiskAlertEmail(coachClient.coach.user.email, coachClient.client.fullName, `${env.FRONTEND_URL}/clients/${clientId}/overview`);
  }
}

async function notifyWeeklyReport(clientId: string): Promise<void> {
  const coachClient = await coachClientRepository.findByClientId(clientId);
  if (!coachClient) return;
  await notify(coachClient.coach.userId, 'WEEKLY_REPORT', 'Weekly report ready', `This week's report for ${coachClient.client.fullName} is ready`, clientId);
}

/** Notifies whichever party did NOT send the message. */
async function notifyNewMessage(clientId: string, senderRole: 'COACH' | 'CLIENT'): Promise<void> {
  const coachClient = await coachClientRepository.findByClientId(clientId);
  if (!coachClient) return;

  const senderName = senderRole === 'COACH' ? 'Your coach' : coachClient.client.fullName;

  if (senderRole === 'COACH') {
    if (!coachClient.client.userId) return;
    await notify(coachClient.client.userId, 'NEW_MESSAGE', 'New message', `${senderName} sent you a message`, clientId);
    void emailService.sendNewMessageEmail(coachClient.client.email, senderName, `${env.FRONTEND_URL}/messages`);
  } else {
    await notify(coachClient.coach.userId, 'NEW_MESSAGE', 'New message', `${senderName} sent you a message`, clientId);
    if (coachClient.coach.user?.email) {
      void emailService.sendNewMessageEmail(coachClient.coach.user.email, senderName, `${env.FRONTEND_URL}/clients/${clientId}/messages`);
    }
  }
}

async function list(userId: string, page: number, pageSize: number) {
  const [notifications, total, unreadCount] = await notificationRepository.listForUser(userId, page, pageSize);
  return { notifications, total, unreadCount, page, pageSize };
}

async function markRead(id: string, userId: string): Promise<void> {
  await notificationRepository.markRead(id, userId);
}

async function markAllRead(userId: string): Promise<void> {
  await notificationRepository.markAllRead(userId);
}

export const notificationService = {
  notifyCheckIn,
  notifyMissedWorkout,
  notifyAtRisk,
  notifyWeeklyReport,
  notifyNewMessage,
  list,
  markRead,
  markAllRead,
};

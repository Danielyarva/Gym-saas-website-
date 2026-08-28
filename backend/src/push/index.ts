import webpush from 'web-push';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';

let vapidConfigured = false;

function isConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

function ensureVapidDetails(): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:admin@example.com', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

function getPublicKey(): string {
  return env.VAPID_PUBLIC_KEY;
}

interface PushPayload {
  title: string;
  body: string;
}

/**
 * Called from push.processor.ts, never directly from a request handler — a
 * push send has no request to respond to, so unlike ai/index.ts and
 * payments/index.ts there's no "not configured" error to throw; it's a
 * clean no-op, the same fallback shape as email.service.ts with no
 * EMAIL_API_KEY. Each subscription is sent to independently so one stale
 * endpoint never blocks delivery to a user's other devices; a 404/410
 * response means the browser dropped that subscription, so it's deleted
 * rather than retried again.
 */
async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isConfigured()) return;
  ensureVapidDetails();

  const subscriptions = await pushSubscriptionRepository.listForUser(userId);
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await pushSubscriptionRepository.deleteByEndpoint(userId, subscription.endpoint);
        } else {
          logger.error({ err, userId }, 'Failed to send push notification');
        }
      }
    }),
  );
}

export const pushService = {
  isConfigured,
  getPublicKey,
  sendToUser,
};

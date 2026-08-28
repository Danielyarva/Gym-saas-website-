import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';

async function subscribe(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void> {
  await pushSubscriptionRepository.create(userId, endpoint, p256dh, auth);
}

async function unsubscribe(userId: string, endpoint: string): Promise<void> {
  await pushSubscriptionRepository.deleteByEndpoint(userId, endpoint);
}

export const pushSubscriptionService = {
  subscribe,
  unsubscribe,
};

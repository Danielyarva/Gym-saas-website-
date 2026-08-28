import { apiRequest } from './api-client';

export interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const pushService = {
  getVapidPublicKey() {
    return apiRequest<{ publicKey: string }>('/api/push/vapid-public-key');
  },

  subscribe(subscription: PushSubscriptionKeys) {
    return apiRequest<null>('/api/push/subscribe', { method: 'POST', body: subscription });
  },

  unsubscribe(endpoint: string) {
    return apiRequest<null>('/api/push/unsubscribe', { method: 'POST', body: { endpoint } });
  },
};

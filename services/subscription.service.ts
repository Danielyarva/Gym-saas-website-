import { apiRequest } from './api-client';
import type { SubscriptionPlan, SubscriptionStatus, CheckoutOrder, PaymentListResult } from '@/types';

export const subscriptionService = {
  getStatus() {
    return apiRequest<SubscriptionStatus>('/api/subscriptions');
  },

  checkout(plan: SubscriptionPlan) {
    return apiRequest<CheckoutOrder>('/api/subscriptions/checkout', { method: 'POST', body: { plan } });
  },

  verifyPayment(orderId: string, paymentId: string, signature: string) {
    return apiRequest<SubscriptionStatus>('/api/subscriptions/verify', { method: 'POST', body: { orderId, paymentId, signature } });
  },

  downgrade() {
    return apiRequest<SubscriptionStatus>('/api/subscriptions/downgrade', { method: 'POST' });
  },

  listPayments(page = 1, pageSize = 20) {
    return apiRequest<PaymentListResult>(`/api/subscriptions/payments?page=${page}&pageSize=${pageSize}`);
  },
};

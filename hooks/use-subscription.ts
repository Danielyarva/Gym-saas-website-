import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import type { SubscriptionPlan } from '@/types';

const STATUS_KEY = ['subscription-status'] as const;

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => subscriptionService.getStatus(),
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (plan: SubscriptionPlan) => subscriptionService.checkout(plan),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) =>
      subscriptionService.verifyPayment(orderId, paymentId, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });
}

export function useDowngrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionService.downgrade(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });
}

export function usePayments(page = 1) {
  return useQuery({
    queryKey: ['subscription-payments', page] as const,
    queryFn: () => subscriptionService.listPayments(page),
  });
}

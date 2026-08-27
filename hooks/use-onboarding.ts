import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '@/services/onboarding.service';

const onboardingQueryKey = (clientId: string) => ['onboarding', clientId] as const;

export function useOnboarding(clientId: string) {
  return useQuery({
    queryKey: onboardingQueryKey(clientId),
    queryFn: () => onboardingService.get(clientId),
    enabled: Boolean(clientId),
  });
}

export function useSaveOnboardingStep(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepNumber, body }: { stepNumber: number; body: Record<string, unknown> }) => onboardingService.saveStep(clientId, stepNumber, body),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingQueryKey(clientId), data);
    },
  });
}

export function useCompleteOnboarding(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => onboardingService.complete(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey(clientId) });
    },
  });
}

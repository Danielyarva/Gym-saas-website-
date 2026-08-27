import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workoutService, type MarkExerciseInput } from '@/services/workout.service';
import { ApiError } from '@/services/api-client';

const todayKey = (clientId: string) => ['workout', 'today', clientId] as const;

export function useTodayWorkout(clientId: string) {
  return useQuery({
    queryKey: todayKey(clientId),
    queryFn: () => workoutService.getToday(clientId),
    enabled: Boolean(clientId),
    retry: (failureCount, error) => !(error instanceof ApiError && error.code === 'PLAN_NOT_ACTIVE') && failureCount < 2,
  });
}

export function useMarkExercise(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutExerciseId, input }: { workoutExerciseId: string; input: MarkExerciseInput }) =>
      workoutService.markExercise(clientId, workoutExerciseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todayKey(clientId) });
    },
  });
}

export function useCompleteWorkout(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => workoutService.complete(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todayKey(clientId) });
    },
  });
}

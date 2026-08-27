import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  workoutPlansService,
  type CreateWorkoutPlanInput,
  type UpdateWorkoutPlanInput,
  type WorkoutDayInput,
  type WorkoutExerciseInput,
} from '@/services/workout-plans.service';

const keys = {
  list: (clientId: string) => ['workout-plans', 'list', clientId] as const,
  detail: (clientId: string, planId: string) => ['workout-plans', 'detail', clientId, planId] as const,
};

export function useWorkoutPlans(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => workoutPlansService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useWorkoutPlan(clientId: string, planId: string) {
  return useQuery({
    queryKey: keys.detail(clientId, planId),
    queryFn: () => workoutPlansService.getById(clientId, planId),
    enabled: Boolean(clientId && planId),
  });
}

export function useCreateWorkoutPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkoutPlanInput) => workoutPlansService.create(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useUpdateWorkoutPlan(clientId: string, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorkoutPlanInput) => workoutPlansService.update(clientId, planId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.detail(clientId, planId), data);
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useDeleteWorkoutPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => workoutPlansService.remove(clientId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useDuplicateWorkoutPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => workoutPlansService.duplicate(clientId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

function useInvalidatePlanDetail(clientId: string, planId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: keys.detail(clientId, planId) });
}

export function useCreateWorkoutDay(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (input: WorkoutDayInput) => workoutPlansService.createDay(clientId, planId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkoutDay(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ dayId, input }: { dayId: string; input: Partial<WorkoutDayInput> }) => workoutPlansService.updateDay(clientId, planId, dayId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkoutDay(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (dayId: string) => workoutPlansService.deleteDay(clientId, planId, dayId),
    onSuccess: invalidate,
  });
}

export function useReorderWorkoutDays(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (orderedIds: string[]) => workoutPlansService.reorderDays(clientId, planId, orderedIds),
    onSuccess: invalidate,
  });
}

export function useCreateWorkoutExercise(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ dayId, input }: { dayId: string; input: WorkoutExerciseInput }) => workoutPlansService.createExercise(clientId, planId, dayId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkoutExercise(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ dayId, workoutExerciseId, input }: { dayId: string; workoutExerciseId: string; input: Partial<WorkoutExerciseInput> }) =>
      workoutPlansService.updateExercise(clientId, planId, dayId, workoutExerciseId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkoutExercise(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ dayId, workoutExerciseId }: { dayId: string; workoutExerciseId: string }) =>
      workoutPlansService.deleteExercise(clientId, planId, dayId, workoutExerciseId),
    onSuccess: invalidate,
  });
}

export function useReorderWorkoutExercises(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ dayId, orderedIds }: { dayId: string; orderedIds: string[] }) => workoutPlansService.reorderExercises(clientId, planId, dayId, orderedIds),
    onSuccess: invalidate,
  });
}

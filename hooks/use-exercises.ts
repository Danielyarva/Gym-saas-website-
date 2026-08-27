import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exercisesService, type ListExercisesParams, type ExerciseInput } from '@/services/exercises.service';

export const exercisesQueryKeys = {
  list: (params: ListExercisesParams) => ['exercises', 'list', params] as const,
};

export function useExercises(params: ListExercisesParams) {
  return useQuery({
    queryKey: exercisesQueryKeys.list(params),
    queryFn: () => exercisesService.list(params),
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseInput) => exercisesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

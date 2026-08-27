import { exerciseRepository, type ExerciseInput, type ListExercisesFilters } from '../repositories/exercise.repository';
import { AppError } from '../utils/app-error';

async function list(coachId: string, filters: ListExercisesFilters) {
  return exerciseRepository.list(coachId, filters);
}

async function create(coachId: string, input: ExerciseInput) {
  return exerciseRepository.create(coachId, input);
}

/** Global (coachId: null) exercises are read-only to coaches — only a coach's own custom exercise can be edited or removed. */
async function assertOwnedCustomExercise(coachId: string, exerciseId: string) {
  const exercise = await exerciseRepository.findById(exerciseId);
  if (!exercise || exercise.coachId !== coachId) {
    throw new AppError('NOT_FOUND', 'Exercise not found');
  }
  return exercise;
}

async function update(coachId: string, exerciseId: string, input: Partial<ExerciseInput>) {
  await assertOwnedCustomExercise(coachId, exerciseId);
  return exerciseRepository.update(exerciseId, input);
}

async function remove(coachId: string, exerciseId: string) {
  await assertOwnedCustomExercise(coachId, exerciseId);

  const referenceCount = await exerciseRepository.countWorkoutExerciseReferences(exerciseId);
  if (referenceCount > 0) {
    throw new AppError('VALIDATION_ERROR', 'This exercise is used in a workout plan and cannot be deleted');
  }

  await exerciseRepository.delete(exerciseId);
}

export const exerciseService = {
  list,
  create,
  update,
  remove,
};

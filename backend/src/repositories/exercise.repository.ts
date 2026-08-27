import type { Difficulty, EquipmentType, MuscleGroup, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface ListExercisesFilters {
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  difficulty?: Difficulty;
  search?: string;
}

export interface ExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export const exerciseRepository = {
  /** Global library (coachId: null) plus this coach's own custom exercises — never another coach's custom ones. */
  list(coachId: string, filters: ListExercisesFilters) {
    const where: Prisma.ExerciseWhereInput = {
      OR: [{ coachId: null }, { coachId }],
      ...(filters.muscleGroup ? { muscleGroup: filters.muscleGroup } : {}),
      ...(filters.equipment ? { equipment: filters.equipment } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: 'insensitive' } } : {}),
    };
    return prisma.exercise.findMany({ where, orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.exercise.findUnique({ where: { id } });
  },

  create(coachId: string, data: ExerciseInput) {
    return prisma.exercise.create({ data: { ...data, coachId } });
  },

  update(id: string, data: Partial<ExerciseInput>) {
    return prisma.exercise.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.exercise.delete({ where: { id } });
  },

  countWorkoutExerciseReferences(exerciseId: string) {
    return prisma.workoutExercise.count({ where: { exerciseId } });
  },
};

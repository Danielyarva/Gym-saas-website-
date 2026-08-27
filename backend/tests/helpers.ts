import { prisma } from '../src/config/prisma';

/**
 * Wipes every table a test could have written to, in FK-safe order — called
 * before each test file's suite so tests never see leftover rows from a
 * previous run. Global (coachId: null) seeded Exercise rows are left alone:
 * only WorkoutExercise rows are cleared here, which is what actually blocks
 * a Coach delete (Exercise<-WorkoutExercise is onDelete: Restrict); deleting
 * a Coach then cascades to that coach's own custom exercises automatically.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany();

  await prisma.exerciseLog.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.workoutDay.deleteMany();
  await prisma.workoutPlan.deleteMany();

  await prisma.nutritionFood.deleteMany();
  await prisma.nutritionMeal.deleteMany();
  await prisma.nutritionPlan.deleteMany();

  await prisma.dailyCheckIn.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.clientInviteToken.deleteMany();
  await prisma.clientOnboarding.deleteMany();
  await prisma.bodyMeasurement.deleteMany();
  await prisma.goal.deleteMany();

  await prisma.coachClient.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.client.deleteMany();

  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  await prisma.coach.deleteMany();
  await prisma.user.deleteMany();
}

export function extractCookie(setCookieHeader: string[] | undefined, name: string): string | undefined {
  const raw = setCookieHeader?.find((cookie) => cookie.startsWith(`${name}=`));
  return raw?.split(';')[0]?.split('=')[1];
}

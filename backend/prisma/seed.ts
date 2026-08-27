import 'dotenv/config';
import { PrismaClient, type MuscleGroup, type EquipmentType, type Difficulty } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the admin account.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seeded ADMIN account: ${admin.email}`);
}

interface GlobalExerciseSeed {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions: string;
}

// A small starter library, not an exhaustive database — enough to build and
// test workout plans against every muscle group. Coaches can add their own
// custom exercises on top (Exercise.coachId non-null) via the API.
const GLOBAL_EXERCISES: GlobalExerciseSeed[] = [
  { name: 'Barbell Bench Press', muscleGroup: 'CHEST', equipment: 'BARBELL', difficulty: 'INTERMEDIATE', instructions: 'Lie on a flat bench, lower the bar to mid-chest, press back up to full extension.' },
  { name: 'Push-Up', muscleGroup: 'CHEST', equipment: 'BODYWEIGHT', difficulty: 'BEGINNER', instructions: 'Hands shoulder-width apart, lower chest to the floor, press back up keeping the body straight.' },
  { name: 'Dumbbell Row', muscleGroup: 'BACK', equipment: 'DUMBBELL', difficulty: 'BEGINNER', instructions: 'Hinge at the hips, pull the dumbbell to your hip, squeeze the shoulder blade at the top.' },
  { name: 'Pull-Up', muscleGroup: 'BACK', equipment: 'BODYWEIGHT', difficulty: 'ADVANCED', instructions: 'Hang from a bar with an overhand grip, pull your chin above the bar, lower with control.' },
  { name: 'Lat Pulldown', muscleGroup: 'BACK', equipment: 'CABLE', difficulty: 'BEGINNER', instructions: 'Pull the bar down to upper chest, keep the torso upright, control the return.' },
  { name: 'Overhead Press', muscleGroup: 'SHOULDERS', equipment: 'BARBELL', difficulty: 'INTERMEDIATE', instructions: 'Press the bar from shoulder height to full overhead lockout, keep the core braced.' },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'SHOULDERS', equipment: 'DUMBBELL', difficulty: 'BEGINNER', instructions: 'Raise dumbbells out to the sides to shoulder height, control the descent.' },
  { name: 'Dumbbell Bicep Curl', muscleGroup: 'BICEPS', equipment: 'DUMBBELL', difficulty: 'BEGINNER', instructions: 'Curl the dumbbells to shoulder height keeping elbows fixed at your sides, lower slowly.' },
  { name: 'Cable Tricep Pushdown', muscleGroup: 'TRICEPS', equipment: 'CABLE', difficulty: 'BEGINNER', instructions: 'Push the bar down to full extension keeping elbows tucked, control the return.' },
  { name: 'Barbell Back Squat', muscleGroup: 'LEGS', equipment: 'BARBELL', difficulty: 'INTERMEDIATE', instructions: 'Bar on the upper back, squat until thighs are parallel to the floor, drive back up.' },
  { name: 'Bodyweight Squat', muscleGroup: 'LEGS', equipment: 'BODYWEIGHT', difficulty: 'BEGINNER', instructions: 'Feet shoulder-width apart, squat down keeping chest up, drive through the heels to stand.' },
  { name: 'Leg Press', muscleGroup: 'LEGS', equipment: 'MACHINE', difficulty: 'BEGINNER', instructions: 'Press the platform away until legs are extended, do not lock the knees out fully.' },
  { name: 'Barbell Hip Thrust', muscleGroup: 'GLUTES', equipment: 'BARBELL', difficulty: 'INTERMEDIATE', instructions: 'Upper back on a bench, drive hips up until torso is parallel to the floor, squeeze glutes at the top.' },
  { name: 'Glute Bridge', muscleGroup: 'GLUTES', equipment: 'BODYWEIGHT', difficulty: 'BEGINNER', instructions: 'Lie on your back, knees bent, drive hips up squeezing the glutes, lower with control.' },
  { name: 'Plank', muscleGroup: 'CORE', equipment: 'BODYWEIGHT', difficulty: 'BEGINNER', instructions: 'Hold a straight line from head to heels on forearms and toes, brace the core throughout.' },
  { name: 'Kettlebell Russian Twist', muscleGroup: 'CORE', equipment: 'KETTLEBELL', difficulty: 'INTERMEDIATE', instructions: 'Seated, lean back slightly, rotate the kettlebell side to side keeping the core engaged.' },
  { name: 'Jump Rope', muscleGroup: 'CARDIO', equipment: 'OTHER', difficulty: 'BEGINNER', instructions: 'Steady rhythmic jumps, land softly on the balls of the feet.' },
  { name: 'Kettlebell Swing', muscleGroup: 'CARDIO', equipment: 'KETTLEBELL', difficulty: 'INTERMEDIATE', instructions: 'Hinge at the hips and drive the kettlebell up to chest height using hip power, not the arms.' },
  { name: 'Resistance Band Pull-Apart', muscleGroup: 'BACK', equipment: 'BAND', difficulty: 'BEGINNER', instructions: 'Hold the band at shoulder height, pull it apart squeezing the shoulder blades together.' },
  { name: 'Burpee', muscleGroup: 'FULL_BODY', equipment: 'BODYWEIGHT', difficulty: 'ADVANCED', instructions: 'Drop to a push-up, jump feet back in, then jump up explosively with hands overhead.' },
];

async function seedExercises() {
  const existingCount = await prisma.exercise.count({ where: { coachId: null } });
  if (existingCount > 0) {
    console.log(`Global exercise library already seeded (${existingCount} exercises).`);
    return;
  }

  await prisma.exercise.createMany({
    data: GLOBAL_EXERCISES.map((exercise) => ({ ...exercise, coachId: null })),
  });

  console.log(`Seeded ${GLOBAL_EXERCISES.length} global exercises.`);
}

async function main() {
  await seedAdmin();
  await seedExercises();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

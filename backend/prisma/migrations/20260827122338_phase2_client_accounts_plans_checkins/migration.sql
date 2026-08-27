-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'MOBILITY', 'GENERAL_FITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TrainingExperience" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'BAND', 'OTHER');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "WorkoutPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkoutLogStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NutritionPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "AdherenceLevel" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('ONBOARDING', 'CHECK_IN', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_INVITED';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_INVITE_ACCEPTED';
ALTER TYPE "AuditAction" ADD VALUE 'ONBOARDING_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'WORKOUT_PLAN_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'NUTRITION_PLAN_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECK_IN_SUBMITTED';

-- CreateTable
CREATE TABLE "client_invite_tokens" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "invited_by_coach_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "type" "GoalType" NOT NULL,
    "target_value" DECIMAL(6,2),
    "target_unit" TEXT,
    "target_date" DATE,
    "notes" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight_kg" DECIMAL(5,2),
    "waist_cm" DECIMAL(5,2),
    "chest_cm" DECIMAL(5,2),
    "arms_cm" DECIMAL(5,2),
    "hips_cm" DECIMAL(5,2),
    "thighs_cm" DECIMAL(5,2),
    "source" "MeasurementSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_onboarding" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "training_experience" "TrainingExperience",
    "training_days_per_week" INTEGER,
    "equipment_list" TEXT[],
    "equipment_notes" TEXT,
    "dietary_preferences" TEXT[],
    "allergies" TEXT[],
    "meals_per_day_preference" INTEGER,
    "activity_level" "ActivityLevel",
    "occupation_type" TEXT,
    "stress_level" INTEGER,
    "typical_sleep_hours" DECIMAL(3,1),
    "sleep_quality" "SleepQuality",
    "injuries_or_limitations" TEXT,
    "cleared_for_exercise" BOOLEAN,
    "needs_medical_clearance" BOOLEAN NOT NULL DEFAULT false,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "coach_id" UUID,
    "name" TEXT NOT NULL,
    "muscle_group" "MuscleGroup" NOT NULL,
    "equipment" "EquipmentType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "instructions" TEXT,
    "video_url" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkoutPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" UUID NOT NULL,
    "workout_plan_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_rest_day" BOOLEAN NOT NULL DEFAULT false,
    "day_of_week" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" UUID NOT NULL,
    "workout_day_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "rest_seconds" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "workout_day_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "WorkoutLogStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" UUID NOT NULL,
    "workout_log_id" UUID NOT NULL,
    "workout_exercise_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "actual_sets" INTEGER,
    "actual_reps" TEXT,
    "actual_weight_kg" DECIMAL(6,2),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "NutritionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "daily_water_target_ml" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_meals" (
    "id" UUID NOT NULL,
    "nutrition_plan_id" UUID NOT NULL,
    "type" "MealType" NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_foods" (
    "id" UUID NOT NULL,
    "nutrition_meal_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein_g" DECIMAL(6,2) NOT NULL,
    "carbs_g" DECIMAL(6,2) NOT NULL,
    "fat_g" DECIMAL(6,2) NOT NULL,
    "fiber_g" DECIMAL(6,2) NOT NULL,
    "order" INTEGER NOT NULL,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "workout_completed" BOOLEAN,
    "steps" INTEGER,
    "sleep_hours" DECIMAL(3,1),
    "mood" "MoodLevel",
    "energy" "EnergyLevel",
    "nutrition_adherence" "AdherenceLevel",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_invite_tokens_token_hash_key" ON "client_invite_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "client_invite_tokens_client_id_idx" ON "client_invite_tokens"("client_id");

-- CreateIndex
CREATE INDEX "goals_client_id_status_idx" ON "goals"("client_id", "status");

-- CreateIndex
CREATE INDEX "goals_client_id_is_primary_idx" ON "goals"("client_id", "is_primary");

-- CreateIndex
CREATE INDEX "body_measurements_client_id_recorded_at_idx" ON "body_measurements"("client_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_onboarding_client_id_key" ON "client_onboarding"("client_id");

-- CreateIndex
CREATE INDEX "exercises_muscle_group_idx" ON "exercises"("muscle_group");

-- CreateIndex
CREATE INDEX "exercises_coach_id_idx" ON "exercises"("coach_id");

-- CreateIndex
CREATE INDEX "workout_plans_coach_id_client_id_idx" ON "workout_plans"("coach_id", "client_id");

-- CreateIndex
CREATE INDEX "workout_plans_client_id_status_idx" ON "workout_plans"("client_id", "status");

-- CreateIndex
CREATE INDEX "workout_days_workout_plan_id_order_idx" ON "workout_days"("workout_plan_id", "order");

-- CreateIndex
CREATE INDEX "workout_exercises_workout_day_id_order_idx" ON "workout_exercises"("workout_day_id", "order");

-- CreateIndex
CREATE INDEX "workout_logs_client_id_date_idx" ON "workout_logs"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "workout_logs_client_id_workout_day_id_date_key" ON "workout_logs"("client_id", "workout_day_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_logs_workout_log_id_workout_exercise_id_key" ON "exercise_logs"("workout_log_id", "workout_exercise_id");

-- CreateIndex
CREATE INDEX "nutrition_plans_coach_id_client_id_idx" ON "nutrition_plans"("coach_id", "client_id");

-- CreateIndex
CREATE INDEX "nutrition_plans_client_id_status_idx" ON "nutrition_plans"("client_id", "status");

-- CreateIndex
CREATE INDEX "nutrition_meals_nutrition_plan_id_order_idx" ON "nutrition_meals"("nutrition_plan_id", "order");

-- CreateIndex
CREATE INDEX "nutrition_foods_nutrition_meal_id_order_idx" ON "nutrition_foods"("nutrition_meal_id", "order");

-- CreateIndex
CREATE INDEX "daily_checkins_client_id_date_idx" ON "daily_checkins"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_client_id_date_key" ON "daily_checkins"("client_id", "date");

-- AddForeignKey
ALTER TABLE "client_invite_tokens" ADD CONSTRAINT "client_invite_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invite_tokens" ADD CONSTRAINT "client_invite_tokens_invited_by_coach_id_fkey" FOREIGN KEY ("invited_by_coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboarding" ADD CONSTRAINT "client_onboarding_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_workout_plan_id_fkey" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_meals" ADD CONSTRAINT "nutrition_meals_nutrition_plan_id_fkey" FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_foods" ADD CONSTRAINT "nutrition_foods_nutrition_meal_id_fkey" FOREIGN KEY ("nutrition_meal_id") REFERENCES "nutrition_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

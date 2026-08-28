-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AiRiskLevel" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'AI_CHAT_MESSAGE_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'AI_INSIGHT_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_WEEKLY_REPORT_GENERATED';

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "check_in_id" UUID,
    "risk_level" "AiRiskLevel" NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "insights" TEXT[],
    "recommended_actions" TEXT[],
    "reasoning" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "overall_progress_pct" DECIMAL(5,2),
    "weight_change_kg" DECIMAL(5,2),
    "workout_adherence_pct" INTEGER,
    "nutrition_adherence_pct" INTEGER,
    "avg_steps" INTEGER,
    "avg_sleep_hours" DECIMAL(3,1),
    "wins" TEXT[],
    "problems" TEXT[],
    "ai_summary" TEXT NOT NULL,
    "suggested_actions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "estimated_cost_usd" DECIMAL(8,4) NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_conversations_client_id_key" ON "ai_conversations"("client_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_insights_client_id_created_at_idx" ON "ai_insights"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_client_id_week_start_key" ON "weekly_reports"("client_id", "week_start");

-- CreateIndex
CREATE INDEX "ai_usage_logs_client_id_created_at_idx" ON "ai_usage_logs"("client_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "daily_checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

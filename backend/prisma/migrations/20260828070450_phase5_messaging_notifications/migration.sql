-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('COACH', 'CLIENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLIENT_CHECKIN', 'CLIENT_AT_RISK', 'MISSED_WORKOUT', 'WEEKLY_REPORT', 'NEW_MESSAGE', 'SUBSCRIPTION', 'SYSTEM');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_SENT';

-- AlterTable
ALTER TABLE "coach_clients" ADD COLUMN     "client_typing_until" TIMESTAMP(3),
ADD COLUMN     "coach_typing_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "sender_role" "MessageSenderRole" NOT NULL,
    "content" TEXT,
    "attachment_url" TEXT,
    "attachment_type" TEXT,
    "attachment_name" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_client_id_created_at_idx" ON "messages"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

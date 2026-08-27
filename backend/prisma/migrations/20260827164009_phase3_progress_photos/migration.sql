-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROGRESS_PHOTO_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'PROGRESS_PHOTO_DELETED';

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "taken_at" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "progress_photos_client_id_taken_at_idx" ON "progress_photos"("client_id", "taken_at");

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

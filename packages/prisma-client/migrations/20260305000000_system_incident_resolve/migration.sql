-- AlterTable
ALTER TABLE "system_incidents" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resolveComment" TEXT;

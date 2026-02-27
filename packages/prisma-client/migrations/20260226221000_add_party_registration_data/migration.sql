-- Add missing JSON field used by Prisma model Party.
ALTER TABLE "commerce_parties"
ADD COLUMN IF NOT EXISTS "registrationData" JSONB;

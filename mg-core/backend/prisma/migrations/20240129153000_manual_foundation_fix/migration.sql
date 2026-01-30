-- AlterEnum
BEGIN;
CREATE TYPE "foundation_status_new" AS ENUM ('NOT_STARTED', 'READING', 'READY_TO_ACCEPT', 'ACCEPTED');
ALTER TABLE "users" ALTER COLUMN "foundation_status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "foundation_status" TYPE "foundation_status_new" USING ("foundation_status"::text::"foundation_status_new");
ALTER TYPE "foundation_status" RENAME TO "foundation_status_old";
ALTER TYPE "foundation_status_new" RENAME TO "foundation_status";
DROP TYPE "foundation_status_old";
ALTER TABLE "users" ALTER COLUMN "foundation_status" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accepted_version" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "foundation_version" TEXT;

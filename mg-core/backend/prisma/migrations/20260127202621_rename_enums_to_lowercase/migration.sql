/*
  Warnings:

  - The `status` column on the `auth_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `employee_registration_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `current_step` column on the `employee_registration_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `foundation_status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `step` on the `registration_step_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "foundation_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "registration_step" AS ENUM ('PHOTO', 'FULL_NAME', 'BIRTH_DATE', 'REG_ADDRESS', 'RES_ADDRESS', 'PHONE', 'EMAIL', 'POSITION', 'LOCATION', 'PASSPORT_SCAN', 'DOCUMENTS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "auth_session_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "auth_sessions" DROP COLUMN "status",
ADD COLUMN     "status" "auth_session_status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "employee_registration_requests" DROP COLUMN "status",
ADD COLUMN     "status" "registration_status" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "current_step",
ADD COLUMN     "current_step" "registration_step" NOT NULL DEFAULT 'PHOTO';

-- AlterTable
ALTER TABLE "registration_step_history" DROP COLUMN "step",
ADD COLUMN     "step" "registration_step" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "foundation_status",
ADD COLUMN     "foundation_status" "foundation_status" NOT NULL DEFAULT 'NOT_STARTED';

-- DropEnum
DROP TYPE "AuthSessionStatus";

-- DropEnum
DROP TYPE "FoundationStatus";

-- DropEnum
DROP TYPE "RegistrationStatus";

-- DropEnum
DROP TYPE "RegistrationStep";

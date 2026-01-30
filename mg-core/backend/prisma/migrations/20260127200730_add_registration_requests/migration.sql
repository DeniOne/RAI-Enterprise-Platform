/*
  Warnings:

  - A unique constraint covering the columns `[reset_password_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FoundationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationStep" AS ENUM ('PHOTO', 'FULL_NAME', 'BIRTH_DATE', 'REG_ADDRESS', 'RES_ADDRESS', 'PHONE', 'EMAIL', 'POSITION', 'LOCATION', 'PASSPORT_SCAN', 'DOCUMENTS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuthSessionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "foundation_status" "FoundationStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "reset_password_token" TEXT,
ADD COLUMN     "reset_token_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AuthSessionStatus" NOT NULL DEFAULT 'PENDING',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_registration_requests" (
    "id" TEXT NOT NULL,
    "telegram_id" TEXT NOT NULL,
    "telegram_username" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "current_step" "RegistrationStep" NOT NULL DEFAULT 'PHOTO',
    "photo_url" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "middle_name" TEXT,
    "birth_date" DATE,
    "registration_address" TEXT,
    "residential_address" TEXT,
    "addresses_match" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT,
    "location_id" TEXT,
    "department_id" TEXT,
    "passport_scan_url" TEXT,
    "additional_documents" JSONB DEFAULT '[]',
    "invited_by" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "invitation_sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_step_history" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "step" "RegistrationStep" NOT NULL,
    "data" JSONB,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_step_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_registration_requests_telegram_id_key" ON "employee_registration_requests"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_registration_requests_email_key" ON "employee_registration_requests"("email");

-- CreateIndex
CREATE INDEX "registration_step_history_registration_id_idx" ON "registration_step_history"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_password_token_key" ON "users"("reset_password_token");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_step_history" ADD CONSTRAINT "registration_step_history_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "employee_registration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

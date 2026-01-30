/*
  Warnings:

  - You are about to drop the column `foundational_accepted_at` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `is_foundational_accepted` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `accepted_at` on the `foundation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `accepted_by` on the `foundation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `basis_courses` on the `foundation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `codex_version` on the `foundation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `constitution_version` on the `foundation_audit_logs` table. All the data in the column will be lost.
  - Added the required column `event_type` to the `foundation_audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoundationDecision" AS ENUM ('ACCEPTED', 'NOT_ACCEPTED', 'REVOKED');

-- DropIndex
DROP INDEX "foundation_audit_logs_accepted_at_idx";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "foundational_accepted_at",
DROP COLUMN "is_foundational_accepted";

-- AlterTable
ALTER TABLE "foundation_audit_logs" DROP COLUMN "accepted_at",
DROP COLUMN "accepted_by",
DROP COLUMN "basis_courses",
DROP COLUMN "codex_version",
DROP COLUMN "constitution_version",
ADD COLUMN     "event_type" TEXT NOT NULL,
ADD COLUMN     "foundation_version" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "foundation_acceptances" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "decision" "FoundationDecision" NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),

    CONSTRAINT "foundation_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foundation_acceptances_person_id_key" ON "foundation_acceptances"("person_id");

-- CreateIndex
CREATE INDEX "foundation_audit_logs_timestamp_idx" ON "foundation_audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "foundation_acceptances" ADD CONSTRAINT "foundation_acceptances_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

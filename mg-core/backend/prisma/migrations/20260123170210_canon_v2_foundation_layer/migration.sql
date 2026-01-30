/*
  Warnings:

  - You are about to drop the column `assignment_id` on the `training_results` table. All the data in the column will be lost.
  - You are about to drop the `trainer_assignments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `mentorship_period_id` to the `training_results` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('OPTIONAL', 'REQUIRED', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('PROBATION', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisciplineType" AS ENUM ('FOUNDATIONAL', 'APPLIED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'QUIZ_COMPLETED';
ALTER TYPE "EventType" ADD VALUE 'MENTORSHIP_COMPLETED';

-- DropForeignKey
ALTER TABLE "trainer_assignments" DROP CONSTRAINT "trainer_assignments_trainer_id_fkey";

-- DropForeignKey
ALTER TABLE "training_results" DROP CONSTRAINT "training_results_assignment_id_fkey";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "type" "DisciplineType" NOT NULL DEFAULT 'APPLIED';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "foundational_accepted_at" TIMESTAMP(3),
ADD COLUMN     "is_foundational_accepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "training_results" DROP COLUMN "assignment_id",
ADD COLUMN     "mentorship_period_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "trainer_assignments";

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "mode" "QuizMode" NOT NULL DEFAULT 'REQUIRED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pass_score" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "base_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "raw_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_options" TEXT[],
    "is_correct" BOOLEAN NOT NULL,
    "earned_points" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_accreditations" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "granted_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trainer_accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_periods" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "trainee_id" TEXT NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'PROBATION',
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_end_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "plan" JSONB,

    CONSTRAINT "mentorship_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_by" TEXT,
    "basis_courses" JSONB NOT NULL,
    "constitution_version" TEXT,
    "codex_version" TEXT,
    "metadata" JSONB,

    CONSTRAINT "foundation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_material_id_idx" ON "quizzes"("material_id");

-- CreateIndex
CREATE INDEX "foundation_audit_logs_user_id_idx" ON "foundation_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "foundation_audit_logs_accepted_at_idx" ON "foundation_audit_logs"("accepted_at");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_accreditations" ADD CONSTRAINT "trainer_accreditations_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_periods" ADD CONSTRAINT "mentorship_periods_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_mentorship_period_id_fkey" FOREIGN KEY ("mentorship_period_id") REFERENCES "mentorship_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "LeaderboardMetric" AS ENUM ('MC_BALANCE', 'GMC_BALANCE', 'COMPLETED_TASKS', 'STATUS_LEVEL');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('WEEK', 'MONTH', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "leaderboards" (
    "id" TEXT NOT NULL,
    "metric" "LeaderboardMetric" NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "top_users" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "requirements" JSONB,
    "reward_mc" INTEGER NOT NULL DEFAULT 0,
    "reward_gmc" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "duration_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "progress" JSONB,
    "status" "QuestStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboards_metric_period_key" ON "leaderboards"("metric", "period");

-- CreateIndex
CREATE INDEX "quest_progress_user_id_idx" ON "quest_progress"("user_id");

-- CreateIndex
CREATE INDEX "quest_progress_status_idx" ON "quest_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quest_progress_user_id_quest_id_key" ON "quest_progress"("user_id", "quest_id");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_gamification_statuses_user_id_idx" ON "user_gamification_statuses"("user_id");

-- CreateIndex
CREATE INDEX "user_gamification_statuses_achieved_at_idx" ON "user_gamification_statuses"("achieved_at");

-- AddForeignKey
ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

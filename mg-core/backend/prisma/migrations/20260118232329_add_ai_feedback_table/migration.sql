-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('HELPFUL', 'NOT_APPLICABLE', 'UNSURE');

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "comment" VARCHAR(500),
    "basedOnSnapshotId" TEXT,
    "aiVersion" TEXT,
    "ruleSetVersion" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_feedback_recommendationId_idx" ON "ai_feedback"("recommendationId");

-- CreateIndex
CREATE INDEX "ai_feedback_feedbackType_idx" ON "ai_feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "ai_feedback_timestamp_idx" ON "ai_feedback"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feedback_userId_recommendationId_key" ON "ai_feedback"("userId", "recommendationId");

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

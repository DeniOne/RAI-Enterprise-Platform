-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'PHOTOCOMPANY_RESULT';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "processed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_processed_at_idx" ON "events"("processed_at");

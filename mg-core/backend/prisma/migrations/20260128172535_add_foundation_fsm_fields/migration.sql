-- AlterTable
ALTER TABLE "users" ADD COLUMN     "foundation_current_block_id" TEXT,
ADD COLUMN     "foundation_progress" INTEGER NOT NULL DEFAULT 0;

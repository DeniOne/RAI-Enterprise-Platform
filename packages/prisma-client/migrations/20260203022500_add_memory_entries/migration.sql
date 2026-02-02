-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "companyId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

-- Associate vectors dimension check
ALTER TABLE "memory_entries" ADD CONSTRAINT "check_vector_dims" CHECK (vector_dims(embedding) = 1536);

-- CreateIndex
CREATE INDEX "memory_entries_companyId_memoryType_idx" ON "memory_entries"("companyId", "memoryType");

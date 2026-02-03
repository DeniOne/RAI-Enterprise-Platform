/*
  Warnings:

  - Added the required column `companyId` to the `technology_cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "technology_card_operations" ADD COLUMN     "stageId" TEXT;

-- AlterTable
ALTER TABLE "technology_cards" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "technology_card_resources" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_card_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "technology_card_resources_operationId_idx" ON "technology_card_resources"("operationId");

-- CreateIndex
CREATE INDEX "technology_card_operations_stageId_idx" ON "technology_card_operations"("stageId");

-- CreateIndex
CREATE INDEX "technology_cards_companyId_idx" ON "technology_cards"("companyId");

-- AddForeignKey
ALTER TABLE "technology_cards" ADD CONSTRAINT "technology_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_card_resources" ADD CONSTRAINT "technology_card_resources_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "technology_card_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "rai_autonomy_overrides" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clearedAt" TIMESTAMP(3),
    "clearedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_autonomy_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rai_autonomy_overrides_companyId_isActive_createdAt_idx"
ON "rai_autonomy_overrides"("companyId", "isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "rai_autonomy_overrides"
ADD CONSTRAINT "rai_autonomy_overrides_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

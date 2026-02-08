-- Vision AI Baseline (Sprint 2)

CREATE TYPE "VisionObservationSource" AS ENUM ('SATELLITE', 'DRONE', 'PHOTO');
CREATE TYPE "VisionObservationModality" AS ENUM ('RGB', 'MULTISPECTRAL');

CREATE TABLE "vision_observations" (
    "id" TEXT NOT NULL,
    "source" "VisionObservationSource" NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "modality" "VisionObservationModality" NOT NULL,
    "rawFeatures" JSONB,
    "metadata" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vision_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vision_observations_companyId_idx" ON "vision_observations"("companyId");
CREATE INDEX "vision_observations_assetId_idx" ON "vision_observations"("assetId");
CREATE INDEX "vision_observations_timestamp_idx" ON "vision_observations"("timestamp");
CREATE INDEX "vision_observations_source_idx" ON "vision_observations"("source");
CREATE INDEX "vision_observations_modality_idx" ON "vision_observations"("modality");

ALTER TABLE "vision_observations" ADD CONSTRAINT "vision_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
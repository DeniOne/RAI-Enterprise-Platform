-- Satellite Ingestion (Sprint 2)

CREATE TYPE "SatelliteIndexType" AS ENUM ('NDVI', 'NDRE');
CREATE TYPE "SatelliteSource" AS ENUM ('SENTINEL2', 'LANDSAT8', 'LANDSAT9');

CREATE TABLE "satellite_observations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "indexType" "SatelliteIndexType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "source" "SatelliteSource" NOT NULL,
    "resolution" DOUBLE PRECISION NOT NULL,
    "cloudCoverage" DOUBLE PRECISION NOT NULL,
    "tileId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "satellite_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "satellite_observations_companyId_idx" ON "satellite_observations"("companyId");
CREATE INDEX "satellite_observations_assetId_idx" ON "satellite_observations"("assetId");
CREATE INDEX "satellite_observations_timestamp_idx" ON "satellite_observations"("timestamp");
CREATE INDEX "satellite_observations_indexType_idx" ON "satellite_observations"("indexType");
CREATE INDEX "satellite_observations_source_idx" ON "satellite_observations"("source");

ALTER TABLE "satellite_observations" ADD CONSTRAINT "satellite_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
// Satellite Ingestion (Sprint 2)
export enum SatelliteIndexType {
  NDVI = "NDVI",
  NDRE = "NDRE",
}

export enum SatelliteSource {
  SENTINEL2 = "SENTINEL2",
  LANDSAT8 = "LANDSAT8",
  LANDSAT9 = "LANDSAT9",
}

export interface SatelliteObservationInputDto {
  id: string;
  assetId: string;
  companyId: string;
  timestamp: string;
  indexType: SatelliteIndexType;
  value: number;
  source: SatelliteSource;
  resolution: number;
  cloudCoverage: number;
  tileId?: string;
  confidence: number;
}

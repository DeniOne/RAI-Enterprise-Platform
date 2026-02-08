// Vision AI Baseline (Sprint 2)
export enum VisionObservationSource {
  SATELLITE = "SATELLITE",
  DRONE = "DRONE",
  PHOTO = "PHOTO",
}

export enum VisionObservationModality {
  RGB = "RGB",
  MULTISPECTRAL = "MULTISPECTRAL",
}

export interface VisionObservationRawFeatures {
  ndvi?: number;
  ndre?: number;
  texture?: Record<string, number>;
}

export interface VisionObservationMetadata {
  sensor?: string;
  resolution?: string;
  cloudCover?: number;
}

export interface VisionObservationInputDto {
  id: string;
  source: VisionObservationSource;
  assetId: string;
  timestamp: string;
  modality: VisionObservationModality;
  rawFeatures?: VisionObservationRawFeatures;
  metadata?: VisionObservationMetadata;
  confidence: number;
}

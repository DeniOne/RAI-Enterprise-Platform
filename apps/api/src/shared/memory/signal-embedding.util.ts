const EMBEDDING_DIM = 1536;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function buildSatelliteShadowEmbedding(input: {
  value: number;
  confidence: number;
  cloudCoverage: number;
  resolution: number;
  indexType: string;
  source: string;
}): number[] {
  const seed = [
    clamp01(input.value),
    clamp01(input.confidence),
    clamp01(input.cloudCoverage),
    clamp01(1 / Math.max(1, input.resolution)),
    input.indexType === "NDVI" ? 1 : 0,
    input.indexType === "NDRE" ? 1 : 0,
    input.source === "SENTINEL2" ? 1 : 0,
    input.source === "LANDSAT8" ? 1 : 0,
    input.source === "LANDSAT9" ? 1 : 0,
  ];

  const embedding: number[] = [];
  while (embedding.length < EMBEDDING_DIM) {
    embedding.push(seed[embedding.length % seed.length]);
  }
  return embedding;
}

export function buildVisionShadowEmbedding(input: {
  confidence: number;
  modality: string;
  source: string;
  ndvi?: number;
  ndre?: number;
  cloudCover?: number;
}): number[] {
  const seed = [
    clamp01(input.confidence),
    clamp01(input.ndvi ?? 0),
    clamp01(input.ndre ?? 0),
    clamp01(input.cloudCover ?? 0),
    input.modality === "RGB" ? 1 : 0,
    input.modality === "MULTISPECTRAL" ? 1 : 0,
    input.source === "PHOTO" ? 1 : 0,
    input.source === "DRONE" ? 1 : 0,
    input.source === "SATELLITE" ? 1 : 0,
  ];

  const embedding: number[] = [];
  while (embedding.length < EMBEDDING_DIM) {
    embedding.push(seed[embedding.length % seed.length]);
  }
  return embedding;
}

export function buildOperationShadowEmbedding(input: {
  confidenceSeed?: number;
  hasPhoto: boolean;
  hasVoice: boolean;
  hasTelemetry: boolean;
  intent: string;
  type: string;
}): number[] {
  const seed = [
    clamp01(input.confidenceSeed ?? 0.5),
    input.hasPhoto ? 1 : 0,
    input.hasVoice ? 1 : 0,
    input.hasTelemetry ? 1 : 0,
    input.intent === "INCIDENT" ? 1 : 0,
    input.intent === "CONFIRMATION" ? 1 : 0,
    input.intent === "DELAY" ? 1 : 0,
    input.type === "PHOTO" ? 1 : 0,
    input.type === "VOICE_NOTE" ? 1 : 0,
  ];

  const embedding: number[] = [];
  while (embedding.length < EMBEDDING_DIM) {
    embedding.push(seed[embedding.length % seed.length]);
  }
  return embedding;
}

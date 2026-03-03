export interface MemoryInteractionDto {
  content: string;
  companyId: string;
  userId?: string;
  sessionId?: string;
  attrs: {
    schemaKey: string;
    provenance: string;
    confidence: number;
    [key: string]: any;
  };
}

export interface MemoryEpisodeDto {
  content: string;
  companyId: string;
  userId?: string;
  attrs: {
    schemaKey: string;
    provenance: string;
    confidence: number;
    [key: string]: any;
  };
}

export interface MemoryProfileDto {
  content: string;
  companyId: string;
  userId?: string;
  attrs: {
    schemaKey: string;
    provenance: string;
    confidence: number;
    [key: string]: any;
  };
}

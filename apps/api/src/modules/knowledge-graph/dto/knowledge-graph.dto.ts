// Knowledge Graph (Sprint 2)
﻿export enum KnowledgeNodeType {
  CONCEPT = "CONCEPT",
  ENTITY = "ENTITY",
  METRIC = "METRIC",
  DOCUMENT = "DOCUMENT",
}

export enum KnowledgeNodeSource {
  MANUAL = "MANUAL",
  INGESTION = "INGESTION",
  AI = "AI",
}

export enum KnowledgeEdgeRelation {
  IMPLEMENTS = "IMPLEMENTS",
  DEPENDS_ON = "DEPENDS_ON",
  MEASURED_BY = "MEASURED_BY",
  MEASURES = "MEASURES",
  REFERENCES = "REFERENCES",
}

export enum KnowledgeEdgeSource {
  MANUAL = "MANUAL",
  INGESTION = "INGESTION",
  AI = "AI",
}

export interface KnowledgeNodeDto {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  source: KnowledgeNodeSource;
}

export interface KnowledgeEdgeDto {
  fromNodeId: string;
  toNodeId: string;
  relation: KnowledgeEdgeRelation;
  confidence: number;
  source: KnowledgeEdgeSource;
}

export interface KnowledgeGraphIngestionDto {
  nodes: KnowledgeNodeDto[];
  edges: KnowledgeEdgeDto[];
}

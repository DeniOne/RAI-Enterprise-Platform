import { ExplainabilityTimelineNodeKind } from "./explainability-timeline.dto";

/**
 * DTO для Explainability Explorer (Forensics): обогащённый таймлайн трейса с evidence и алертами.
 */

export interface TraceForensicsSummaryDto {
  traceId: string;
  companyId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  modelId: string;
  promptVersion: string;
  toolsVersion: string;
  policyId: string;
  bsScorePct: number | null;
  evidenceCoveragePct: number | null;
  invalidClaimsPct: number | null;
  createdAt: string;
}

export interface EvidenceRefDto {
  claim: string;
  sourceType: string;
  sourceId: string;
  confidenceScore: number;
}

export interface TraceForensicsEntryDto {
  id: string;
  traceId: string;
  companyId: string;
  toolNames: string[];
  model: string;
  intentMethod: string | null;
  phase: string;
  kind?: ExplainabilityTimelineNodeKind;
  label?: string;
  durationMs?: number;
  tokensUsed: number;
  createdAt: string;
  evidenceRefs: EvidenceRefDto[];
}

export interface TraceForensicsAlertDto {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  createdAt: string;
}

export interface TraceForensicsMemoryLaneItemDto {
  kind: string;
  label: string;
  confidence: number;
}

export interface TraceForensicsMemoryLaneDroppedItemDto {
  kind: string;
  label: string;
  reason: string;
}

export interface TraceForensicsMemoryLaneDto {
  recalled: TraceForensicsMemoryLaneItemDto[];
  used: TraceForensicsMemoryLaneItemDto[];
  dropped: TraceForensicsMemoryLaneDroppedItemDto[];
  escalationReason?: string;
}

export interface TraceForensicsResponseDto {
  traceId: string;
  companyId: string;
  summary: TraceForensicsSummaryDto | null;
  timeline: TraceForensicsEntryDto[];
  qualityAlerts: TraceForensicsAlertDto[];
  memoryLane?: TraceForensicsMemoryLaneDto | null;
}

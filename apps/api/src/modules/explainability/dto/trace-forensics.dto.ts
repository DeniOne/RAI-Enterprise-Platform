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
  bsScorePct: number;
  evidenceCoveragePct: number;
  invalidClaimsPct: number;
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

export interface TraceForensicsResponseDto {
  traceId: string;
  companyId: string;
  summary: TraceForensicsSummaryDto | null;
  timeline: TraceForensicsEntryDto[];
  qualityAlerts: TraceForensicsAlertDto[];
}

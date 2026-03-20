import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { z } from "zod";
import {
  RouteDecision,
  SemanticIntent,
} from "../../../shared/rai-chat/semantic-routing.types";

export class RoutingDivergenceQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(168)
  windowHours?: number;

  @IsOptional()
  @IsString()
  slice?: string;

  @IsOptional()
  @IsString()
  decisionType?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === true || value === "true" ? true : value === false || value === "false" ? false : undefined,
  )
  @IsBoolean()
  onlyMismatches?: boolean;
}

export interface RoutingDivergenceClusterDto {
  key: string;
  label: string;
  count: number;
  mismatchKinds: string[];
  sampleTraceId: string | null;
  sampleQuery: string | null;
}

export interface RoutingDecisionBreakdownDto {
  decisionType: string;
  count: number;
}

export interface RoutingCollisionMatrixItemDto {
  legacyRouteKey: string;
  semanticRouteKey: string;
  count: number;
}

export interface RoutingMismatchKindCountDto {
  kind: string;
  count: number;
}

export interface RoutingFailureClusterDto {
  key: string;
  targetRole: string;
  decisionType: string;
  mismatchKinds: string[];
  count: number;
  semanticPrimaryCount: number;
  caseMemoryReadiness: "observe" | "needs_more_evidence" | "ready_for_case_memory";
  lastSeenAt: string;
  sampleTraceId: string | null;
  sampleQuery: string | null;
}

export interface RoutingCaseMemoryCandidateDto {
  key: string;
  sliceId: string | null;
  targetRole: string;
  decisionType: string;
  mismatchKinds: string[];
  routerVersion: string;
  promptVersion: string;
  toolsetVersion: string;
  traceCount: number;
  semanticPrimaryCount: number;
  caseMemoryReadiness: "observe" | "needs_more_evidence" | "ready_for_case_memory";
  firstSeenAt: string;
  lastSeenAt: string;
  ttlExpiresAt: string;
  sampleTraceId: string | null;
  sampleQuery: string | null;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  captureStatus: "not_captured" | "captured" | "active";
  capturedAt: string | null;
  captureAuditLogId: string | null;
  activatedAt: string | null;
  activationAuditLogId: string | null;
}

export interface RoutingAgentDrilldownDto {
  targetRole: string;
  totalEvents: number;
  mismatchedEvents: number;
  divergenceRatePct: number;
  semanticPrimaryCount: number;
  decisionBreakdown: RoutingDecisionBreakdownDto[];
  topMismatchKinds: RoutingMismatchKindCountDto[];
  sampleTraceId: string | null;
  sampleQuery: string | null;
}

export interface RoutingMismatchSampleDto {
  traceId: string;
  createdAt: string;
  summary: string;
  sampleQuery: string | null;
  targetRole: string;
  decisionType: string;
  promotedPrimary: boolean;
}

export interface RoutingDivergenceResponseDto {
  companyId: string;
  windowHours: number;
  totalEvents: number;
  mismatchedEvents: number;
  divergenceRatePct: number;
  semanticPrimaryCount: number;
  topClusters: RoutingDivergenceClusterDto[];
  decisionBreakdown: RoutingDecisionBreakdownDto[];
  collisionMatrix: RoutingCollisionMatrixItemDto[];
  agentBreakdown: RoutingAgentDrilldownDto[];
  failureClusters: RoutingFailureClusterDto[];
  caseMemoryCandidates: RoutingCaseMemoryCandidateDto[];
  recentMismatches: RoutingMismatchSampleDto[];
}

export const CaptureRoutingCaseMemoryCandidateDtoSchema = z.object({
  key: z.string().trim().min(1),
  windowHours: z.number().int().min(1).max(168).optional(),
  slice: z.string().trim().min(1).optional(),
  targetRole: z.string().trim().min(1).optional(),
  note: z.string().trim().min(1).max(500).optional(),
});

export type CaptureRoutingCaseMemoryCandidateDto = z.infer<
  typeof CaptureRoutingCaseMemoryCandidateDtoSchema
>;

export interface RoutingCaseMemoryCandidateCaptureResponseDto {
  status: "captured" | "already_captured";
  candidateKey: string;
  auditLogId: string;
  capturedAt: string;
}

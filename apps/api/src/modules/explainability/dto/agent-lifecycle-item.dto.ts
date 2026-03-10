export type AgentLifecycleStateDto =
  | "FUTURE_ROLE"
  | "PROMOTION_CANDIDATE"
  | "CANARY"
  | "CANONICAL_ACTIVE"
  | "FROZEN"
  | "ROLLED_BACK"
  | "RETIRED";

export interface AgentLifecycleItemDto {
  role: string;
  agentName: string;
  ownerDomain: string;
  class: "canonical" | "future_role";
  lifecycleState: AgentLifecycleStateDto;
  runtimeActive: boolean;
  tenantAccessMode: "INHERITED" | "OVERRIDE" | "DENIED" | "UNKNOWN";
  effectiveConfigId: string | null;
  candidateVersion: string | null;
  latestChangeRequestId: string | null;
  changeRequestStatus: string | null;
  canaryStatus: string | null;
  rollbackStatus: string | null;
  productionDecision: string | null;
  currentVersion: string | null;
  stableVersion: string | null;
  previousStableVersion: string | null;
  versionDelta: "MATCHES_STABLE" | "AHEAD_OF_STABLE" | "ROLLED_BACK_TO_STABLE" | "UNKNOWN";
  promotedAt: string | null;
  rolledBackAt: string | null;
  updatedAt: string | null;
  lifecycleOverride: {
    state: "FROZEN" | "RETIRED";
    reason: string;
    createdAt: string;
    createdByUserId: string | null;
  } | null;
  lineage: Array<{
    changeRequestId: string;
    targetVersion: string;
    status: string;
    canaryStatus: string;
    rollbackStatus: string;
    createdAt: string;
    promotedAt: string | null;
    rolledBackAt: string | null;
  }>;
  notes: string[];
}

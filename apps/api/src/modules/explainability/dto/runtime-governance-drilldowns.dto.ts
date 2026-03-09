export interface RuntimeGovernanceDrilldownsDto {
  flags: {
    apiEnabled: boolean;
    uiEnabled: boolean;
    enforcementEnabled: boolean;
    autoQuarantineEnabled: boolean;
  };
  fallbackHistory: Array<{
    agentRole: string;
    fallbackReason: string;
    count: number;
    lastSeenAt: string;
  }>;
  qualityDriftHistory: Array<{
    agentRole: string | null;
    traceId: string | null;
    recentAvgBsPct: number | null;
    baselineAvgBsPct: number | null;
    recommendationType: string | null;
    createdAt: string;
  }>;
  budgetHotspots: Array<{
    toolName: string;
    agentRole: string | null;
    deniedCount: number;
    degradedCount: number;
    lastSeenAt: string;
  }>;
  queueSaturationTimeline: Array<{
    observedAt: string;
    pressureState: "IDLE" | "STABLE" | "PRESSURED" | "SATURATED";
    totalBacklog: number;
    hottestQueue: string | null;
  }>;
  correlation: Array<{
    createdAt: string;
    traceId: string | null;
    agentRole: string | null;
    fallbackReason: string | null;
    recommendationType: string | null;
    incidentType: string | null;
    severity: string | null;
  }>;
}

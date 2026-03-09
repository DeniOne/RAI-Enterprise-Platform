import { QueuePressureSummary } from "../../rai-chat/performance/queue-metrics.service";
import { GovernanceRecommendationRecord } from "../../rai-chat/runtime-governance/runtime-governance-policy.types";

export interface RuntimeGovernanceSummaryDto {
  companyId: string;
  queuePressure: QueuePressureSummary;
  topFallbackReasons: Array<{
    fallbackReason: string;
    count: number;
  }>;
  recentIncidents: Array<{
    id: string;
    incidentType: string;
    severity: string;
    traceId: string | null;
    createdAt: string;
  }>;
  activeRecommendations: GovernanceRecommendationRecord[];
  quality: {
    avgBsScorePct: number | null;
    avgEvidenceCoveragePct: number | null;
    qualityAlertCount: number;
  };
  autonomy: {
    level: string;
    avgBsScorePct: number;
    knownTraceCount: number;
    driver: string | null;
    activeQualityAlert: boolean;
  };
  hottestAgents: Array<{
    agentRole: string;
    fallbackRatePct: number | null;
    avgBsScorePct: number | null;
    incidentCount: number;
  }>;
}

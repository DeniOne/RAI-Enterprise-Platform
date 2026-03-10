import { AgentLifecycleStateDto } from "./agent-lifecycle-item.dto";

export interface AgentLifecycleSummaryDto {
  companyId: string;
  templateCatalogCount: number;
  totalTrackedRoles: number;
  stateCounts: Record<AgentLifecycleStateDto, number>;
  activeCanaries: Array<{
    role: string;
    targetVersion: string;
    changeRequestId: string;
  }>;
  degradedCanaries: Array<{
    role: string;
    targetVersion: string;
    changeRequestId: string;
  }>;
  promotionCandidates: Array<{
    role: string;
    targetVersion: string;
    status: string;
  }>;
  rolledBackRoles: Array<{
    role: string;
    targetVersion: string;
    rolledBackAt: string | null;
  }>;
}

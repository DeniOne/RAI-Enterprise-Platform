import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  AgentRegistryService,
  EffectiveAgentRegistryEntry,
  isAgentRuntimeRole,
} from "../rai-chat/agent-registry.service";
import { AgentManagementService } from "./agent-management.service";
import {
  AgentLifecycleItemDto,
  AgentLifecycleStateDto,
} from "./dto/agent-lifecycle-item.dto";
import { AgentLifecycleHistoryItemDto } from "./dto/agent-lifecycle-history.dto";
import { AgentLifecycleSummaryDto } from "./dto/agent-lifecycle-summary.dto";

type LatestChange = {
  id: string;
  role: string;
  targetVersion: string;
  status: string;
  canaryStatus: string;
  rollbackStatus: string;
  productionDecision: string;
  promotedAt: Date | null;
  rolledBackAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ChangeByRole = LatestChange;
type ActiveLifecycleOverride = {
  role: string;
  state: "FROZEN" | "RETIRED";
  reason: string;
  createdAt: Date;
  createdByUserId: string | null;
};

@Injectable()
export class AgentLifecycleReadModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentRegistry: AgentRegistryService,
    private readonly agentManagement: AgentManagementService,
  ) {}

  async getSummary(companyId: string): Promise<AgentLifecycleSummaryDto> {
    const [items, templates] = await Promise.all([
      this.getAgents(companyId),
      Promise.resolve(this.agentManagement.getFutureAgentTemplates()),
    ]);

    const changes = items.filter((item) => item.latestChangeRequestId !== null);

    return {
      companyId,
      templateCatalogCount: templates.length,
      totalTrackedRoles: items.length,
      stateCounts: {
        FUTURE_ROLE: items.filter((item) => item.lifecycleState === "FUTURE_ROLE").length,
        PROMOTION_CANDIDATE: items.filter((item) => item.lifecycleState === "PROMOTION_CANDIDATE")
          .length,
        CANARY: items.filter((item) => item.lifecycleState === "CANARY").length,
        CANONICAL_ACTIVE: items.filter((item) => item.lifecycleState === "CANONICAL_ACTIVE").length,
        FROZEN: items.filter((item) => item.lifecycleState === "FROZEN").length,
        ROLLED_BACK: items.filter((item) => item.lifecycleState === "ROLLED_BACK").length,
        RETIRED: items.filter((item) => item.lifecycleState === "RETIRED").length,
      },
      activeCanaries: changes
        .filter((item) => item.canaryStatus === "ACTIVE")
        .map((item) => ({
          role: item.role,
          targetVersion: item.candidateVersion ?? "unknown",
          changeRequestId: item.latestChangeRequestId as string,
        })),
      degradedCanaries: changes
        .filter((item) => item.canaryStatus === "DEGRADED")
        .map((item) => ({
          role: item.role,
          targetVersion: item.candidateVersion ?? "unknown",
          changeRequestId: item.latestChangeRequestId as string,
        })),
      promotionCandidates: changes
        .filter((item) =>
          item.changeRequestStatus === "READY_FOR_CANARY" ||
          item.changeRequestStatus === "APPROVED_FOR_PRODUCTION" ||
          item.changeRequestStatus === "CANARY_ACTIVE",
        )
        .map((item) => ({
          role: item.role,
          targetVersion: item.candidateVersion ?? "unknown",
          status: item.changeRequestStatus as string,
        })),
      rolledBackRoles: changes
        .filter((item) => item.rollbackStatus === "EXECUTED")
        .map((item) => ({
          role: item.role,
          targetVersion: item.candidateVersion ?? "unknown",
          rolledBackAt: item.rolledBackAt,
        })),
    };
  }

  async getAgents(companyId: string): Promise<AgentLifecycleItemDto[]> {
    const [registry, changes, lifecycleOverrides] = await Promise.all([
      this.agentRegistry.getRegistry(companyId),
      this.prisma.agentConfigChangeRequest.findMany({
        where: { companyId },
        select: {
          id: true,
          role: true,
          targetVersion: true,
          status: true,
          canaryStatus: true,
          rollbackStatus: true,
          productionDecision: true,
          promotedAt: true,
          rolledBackAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }),
      this.getActiveLifecycleOverrides(companyId),
    ]);

    const latestChangeByRole = new Map<string, LatestChange>();
    const lifecycleOverrideByRole = new Map<string, ActiveLifecycleOverride>(
      lifecycleOverrides.map((item) => [item.role, item]),
    );
    const changeHistoryByRole = new Map<string, ChangeByRole[]>();
    for (const change of changes) {
      if (!latestChangeByRole.has(change.role)) {
        latestChangeByRole.set(change.role, change);
      }
      const current = changeHistoryByRole.get(change.role) ?? [];
      current.push(change);
      changeHistoryByRole.set(change.role, current);
    }

    const registryByRole = new Map(registry.map((entry) => [entry.definition.role, entry]));
    const roleSet = new Set<string>([
      ...registry.map((entry) => entry.definition.role),
      ...latestChangeByRole.keys(),
      ...lifecycleOverrideByRole.keys(),
    ]);

    const items = [...roleSet].map((role) => {
      const entry = registryByRole.get(role);
      const latestChange = latestChangeByRole.get(role);
      return this.toLifecycleItem(
        role,
        entry,
        latestChange,
        lifecycleOverrideByRole.get(role),
        changeHistoryByRole.get(role) ?? [],
      );
    });

    return items.sort((left, right) => {
      const leftRank = lifecycleSeverityRank(left.lifecycleState);
      const rightRank = lifecycleSeverityRank(right.lifecycleState);
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.role.localeCompare(right.role);
    });
  }

  async getHistory(
    companyId: string,
    limit = 20,
  ): Promise<AgentLifecycleHistoryItemDto[]> {
    const delegate = (
      this.prisma as PrismaService & {
        agentLifecycleOverride?: {
          findMany: (args: unknown) => Promise<
            Array<{
              role: string;
              state: string;
              reason: string;
              isActive: boolean;
              createdAt: Date;
              updatedAt: Date;
              clearedAt: Date | null;
              createdByUserId: string | null;
              clearedByUserId: string | null;
            }>
          >;
        };
      }
    ).agentLifecycleOverride;

    if (!delegate?.findMany) {
      return [];
    }

    const rows = await delegate.findMany({
      where: { companyId },
      select: {
        role: true,
        state: true,
        reason: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        clearedAt: true,
        createdByUserId: true,
        clearedByUserId: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    });

    return rows
      .filter(
        (
          item,
        ): item is {
          role: string;
          state: "FROZEN" | "RETIRED";
          reason: string;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
          clearedAt: Date | null;
          createdByUserId: string | null;
          clearedByUserId: string | null;
        } => item.state === "FROZEN" || item.state === "RETIRED",
      )
      .map((item) => ({
        role: item.role,
        state: item.state,
        reason: item.reason,
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        clearedAt: item.clearedAt?.toISOString() ?? null,
        createdByUserId: item.createdByUserId,
        clearedByUserId: item.clearedByUserId,
      }));
  }

  private toLifecycleItem(
    role: string,
    entry: EffectiveAgentRegistryEntry | undefined,
    latestChange: LatestChange | undefined,
    lifecycleOverride: ActiveLifecycleOverride | undefined,
    history: ChangeByRole[],
  ): AgentLifecycleItemDto {
    const lifecycleState = inferLifecycleState(entry, latestChange, lifecycleOverride, role);
    const notes: string[] = [];
    const promotedHistory = history.filter((item) => item.status === "PROMOTED");
    const latestPromoted = promotedHistory[0];
    const previousPromoted = promotedHistory[1];
    const currentVersion =
      latestPromoted?.targetVersion ?? entry?.runtime.configId ?? null;
    const candidateVersion = latestChange?.targetVersion ?? null;
    const stableVersion = latestPromoted?.targetVersion ?? entry?.runtime.configId ?? null;
    const previousStableVersion =
      previousPromoted?.targetVersion ??
      (latestChange?.rollbackStatus === "EXECUTED" ? entry?.runtime.configId ?? null : null);

    if (lifecycleOverride) {
      notes.push("manual_lifecycle_override");
      notes.push(
        lifecycleOverride.state === "RETIRED"
          ? "lifecycle_retired"
          : "lifecycle_frozen",
      );
    }
    if (latestChange?.canaryStatus === "DEGRADED") {
      notes.push("canary_degraded");
    }
    if (latestChange?.rollbackStatus === "EXECUTED") {
      notes.push("rollback_executed");
    }
    if (entry && (!entry.runtime.isActive || !entry.tenantAccess.isActive)) {
      notes.push("derived_from_inactive_runtime_or_access");
    }
    if (!isAgentRuntimeRole(role)) {
      notes.push("future_role_surface");
    }

    return {
      role,
      agentName: entry?.definition.name ?? role,
      ownerDomain: entry?.definition.ownerDomain ?? "pending",
      class: isAgentRuntimeRole(role) ? "canonical" : "future_role",
      lifecycleState,
      runtimeActive: entry?.runtime.isActive ?? false,
      tenantAccessMode: entry?.tenantAccess.mode ?? "UNKNOWN",
      effectiveConfigId: entry?.runtime.configId ?? null,
      candidateVersion,
      latestChangeRequestId: latestChange?.id ?? null,
      changeRequestStatus: latestChange?.status ?? null,
      canaryStatus: latestChange?.canaryStatus ?? null,
      rollbackStatus: latestChange?.rollbackStatus ?? null,
      productionDecision: latestChange?.productionDecision ?? null,
      currentVersion,
      stableVersion,
      previousStableVersion,
      versionDelta: deriveVersionDelta(
        currentVersion,
        stableVersion,
        candidateVersion,
        latestChange?.rollbackStatus ?? null,
      ),
      promotedAt: latestChange?.promotedAt?.toISOString() ?? null,
      rolledBackAt: latestChange?.rolledBackAt?.toISOString() ?? null,
      updatedAt: latestChange?.updatedAt?.toISOString() ?? null,
      lifecycleOverride: lifecycleOverride
        ? {
            state: lifecycleOverride.state,
            reason: lifecycleOverride.reason,
            createdAt: lifecycleOverride.createdAt.toISOString(),
            createdByUserId: lifecycleOverride.createdByUserId,
          }
        : null,
      lineage: history.slice(0, 4).map((item) => ({
        changeRequestId: item.id,
        targetVersion: item.targetVersion,
        status: item.status,
        canaryStatus: item.canaryStatus,
        rollbackStatus: item.rollbackStatus,
        createdAt: item.createdAt.toISOString(),
        promotedAt: item.promotedAt?.toISOString() ?? null,
        rolledBackAt: item.rolledBackAt?.toISOString() ?? null,
      })),
      notes,
    };
  }

  private async getActiveLifecycleOverrides(
    companyId: string,
  ): Promise<ActiveLifecycleOverride[]> {
    const delegate = (
      this.prisma as PrismaService & {
        agentLifecycleOverride?: {
          findMany: (args: unknown) => Promise<
            Array<{
              role: string;
              state: string;
              reason: string;
              createdAt: Date;
              createdByUserId: string | null;
            }>
          >;
        };
      }
    ).agentLifecycleOverride;

    if (!delegate?.findMany) {
      return [];
    }

    const rows = await delegate.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: {
        role: true,
        state: true,
        reason: true,
        createdAt: true,
        createdByUserId: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return (Array.isArray(rows) ? rows : []).filter(
      (item): item is ActiveLifecycleOverride =>
        item.state === "FROZEN" || item.state === "RETIRED",
    );
  }
}

function deriveVersionDelta(
  currentVersion: string | null,
  stableVersion: string | null,
  candidateVersion: string | null,
  rollbackStatus: string | null,
): AgentLifecycleItemDto["versionDelta"] {
  if (rollbackStatus === "EXECUTED") {
    return "ROLLED_BACK_TO_STABLE";
  }
  if (!stableVersion && !candidateVersion && !currentVersion) {
    return "UNKNOWN";
  }
  if (candidateVersion && stableVersion && candidateVersion !== stableVersion) {
    return "AHEAD_OF_STABLE";
  }
  if (currentVersion && stableVersion && currentVersion === stableVersion) {
    return "MATCHES_STABLE";
  }
  return "UNKNOWN";
}

function inferLifecycleState(
  entry: EffectiveAgentRegistryEntry | undefined,
  latestChange: LatestChange | undefined,
  lifecycleOverride: ActiveLifecycleOverride | undefined,
  role: string,
): AgentLifecycleStateDto {
  if (lifecycleOverride?.state === "RETIRED") {
    return "RETIRED";
  }

  if (lifecycleOverride?.state === "FROZEN") {
    return "FROZEN";
  }

  if (latestChange?.rollbackStatus === "EXECUTED" || latestChange?.status === "ROLLED_BACK") {
    return "ROLLED_BACK";
  }

  if (latestChange?.canaryStatus === "ACTIVE" || latestChange?.status === "CANARY_ACTIVE") {
    return "CANARY";
  }

  if (
    latestChange?.status === "READY_FOR_CANARY" ||
    latestChange?.status === "APPROVED_FOR_PRODUCTION"
  ) {
    return "PROMOTION_CANDIDATE";
  }

  if (entry && (!entry.runtime.isActive || !entry.tenantAccess.isActive)) {
    return "FROZEN";
  }

  if (!isAgentRuntimeRole(role)) {
    return "FUTURE_ROLE";
  }

  return "CANONICAL_ACTIVE";
}

function lifecycleSeverityRank(state: AgentLifecycleStateDto): number {
  switch (state) {
    case "CANARY":
      return 0;
    case "PROMOTION_CANDIDATE":
      return 1;
    case "ROLLED_BACK":
      return 2;
    case "FROZEN":
      return 3;
    case "FUTURE_ROLE":
      return 4;
    case "RETIRED":
      return 5;
    case "CANONICAL_ACTIVE":
      return 6;
    default:
      return 99;
  }
}

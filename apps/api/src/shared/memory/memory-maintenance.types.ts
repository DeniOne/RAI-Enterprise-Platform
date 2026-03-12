import { MemoryLifecyclePauseState } from './memory-lifecycle-control.util';

export enum MemoryMaintenanceAction {
  CONSOLIDATION = 'consolidation',
  PRUNING = 'pruning',
  ENGRAM_FORMATION = 'engram_formation',
  ENGRAM_PRUNING = 'engram_pruning',
}

export enum MemoryMaintenancePlaybookId {
  CONSOLIDATION_ONLY = 'consolidation_only',
  PRUNING_ONLY = 'pruning_only',
  ENGRAM_FORMATION_ONLY = 'engram_formation_only',
  ENGRAM_PRUNING_ONLY = 'engram_pruning_only',
  S_TIER_BACKLOG_RECOVERY = 's_tier_backlog_recovery',
  ENGRAM_LIFECYCLE_RECOVERY = 'engram_lifecycle_recovery',
  FULL_MEMORY_LIFECYCLE_RECOVERY = 'full_memory_lifecycle_recovery',
}

export type MemoryMaintenanceRunScope = 'tenant_manual' | 'system_auto';

export interface MemoryMaintenancePlaybook {
  id: MemoryMaintenancePlaybookId;
  label: string;
  description: string;
  actions: MemoryMaintenanceAction[];
  defaultMaxRuns: number;
  maxAllowedRuns: number;
  autoEligible: boolean;
}

export const memoryMaintenancePlaybooks: MemoryMaintenancePlaybook[] = [
  {
    id: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
    label: 'Consolidation Only',
    description: 'Drain unconsolidated S-tier backlog without touching pruning or engram lifecycle.',
    actions: [MemoryMaintenanceAction.CONSOLIDATION],
    defaultMaxRuns: 3,
    maxAllowedRuns: 6,
    autoEligible: true,
  },
  {
    id: MemoryMaintenancePlaybookId.PRUNING_ONLY,
    label: 'Pruning Only',
    description: 'Clean old consolidated S-tier interactions without running other lifecycle paths.',
    actions: [MemoryMaintenanceAction.PRUNING],
    defaultMaxRuns: 3,
    maxAllowedRuns: 6,
    autoEligible: true,
  },
  {
    id: MemoryMaintenancePlaybookId.ENGRAM_FORMATION_ONLY,
    label: 'Engram Formation Only',
    description: 'Catch up pending L4 engram formation without running pruning.',
    actions: [MemoryMaintenanceAction.ENGRAM_FORMATION],
    defaultMaxRuns: 3,
    maxAllowedRuns: 6,
    autoEligible: true,
  },
  {
    id: MemoryMaintenancePlaybookId.ENGRAM_PRUNING_ONLY,
    label: 'Engram Pruning Only',
    description: 'Deactivate stale or weak engrams without triggering formation.',
    actions: [MemoryMaintenanceAction.ENGRAM_PRUNING],
    defaultMaxRuns: 3,
    maxAllowedRuns: 6,
    autoEligible: true,
  },
  {
    id: MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
    label: 'S-Tier Backlog Recovery',
    description: 'Run consolidation and pruning together for S-tier memory backlog recovery.',
    actions: [
      MemoryMaintenanceAction.CONSOLIDATION,
      MemoryMaintenanceAction.PRUNING,
    ],
    defaultMaxRuns: 3,
    maxAllowedRuns: 5,
    autoEligible: false,
  },
  {
    id: MemoryMaintenancePlaybookId.ENGRAM_LIFECYCLE_RECOVERY,
    label: 'Engram Lifecycle Recovery',
    description: 'Run formation and pruning together for L4 lifecycle recovery.',
    actions: [
      MemoryMaintenanceAction.ENGRAM_FORMATION,
      MemoryMaintenanceAction.ENGRAM_PRUNING,
    ],
    defaultMaxRuns: 3,
    maxAllowedRuns: 5,
    autoEligible: false,
  },
  {
    id: MemoryMaintenancePlaybookId.FULL_MEMORY_LIFECYCLE_RECOVERY,
    label: 'Full Memory Lifecycle Recovery',
    description: 'Run all lifecycle actions in one bounded maintenance window.',
    actions: [
      MemoryMaintenanceAction.CONSOLIDATION,
      MemoryMaintenanceAction.PRUNING,
      MemoryMaintenanceAction.ENGRAM_FORMATION,
      MemoryMaintenanceAction.ENGRAM_PRUNING,
    ],
    defaultMaxRuns: 2,
    maxAllowedRuns: 4,
    autoEligible: false,
  },
];

export const defaultMemoryMaintenanceActions: MemoryMaintenanceAction[] = [
  MemoryMaintenanceAction.CONSOLIDATION,
  MemoryMaintenanceAction.PRUNING,
  MemoryMaintenanceAction.ENGRAM_FORMATION,
  MemoryMaintenanceAction.ENGRAM_PRUNING,
];

export interface MemoryLifecycleSnapshot {
  companyId: string | null;
  unconsolidatedCount: number;
  oldestUnconsolidatedAgeSeconds: number;
  prunableConsolidatedCount: number;
  oldestPrunableConsolidatedAgeSeconds: number;
  activeEngramCount: number;
  latestEngramFormationAgeSeconds: number;
  engramFormationCandidateCount: number;
  oldestEngramFormationCandidateAgeSeconds: number;
  prunableActiveEngramCount: number;
  engramFormationBudgetUsageRatio: number;
  engramPruningBudgetUsageRatio: number;
  retentionDays: number;
  engramPruningMinWeight: number;
  engramPruningMaxInactiveDays: number;
  pauseWindows: {
    consolidation: MemoryLifecyclePauseState;
    pruning: MemoryLifecyclePauseState;
    engramFormation: MemoryLifecyclePauseState;
    engramPruning: MemoryLifecyclePauseState;
  };
}

export interface MemoryLifecycleThresholds {
  oldestUnconsolidatedAgeSeconds: number;
  prunableConsolidatedInteractions: number;
  latestEngramFormationAgeSeconds: number;
  prunableActiveEngrams: number;
}

export interface MemoryMaintenanceActionResult {
  action: MemoryMaintenanceAction;
  runs: number;
  drained: boolean;
  stats: Record<string, number>;
}

export interface MemoryMaintenanceRunInput {
  companyId: string;
  actorUserId?: string;
  playbookId?: MemoryMaintenancePlaybookId;
  actions?: MemoryMaintenanceAction[];
  maxRuns?: number;
  reason?: string;
  scope?: MemoryMaintenanceRunScope;
}

export interface MemoryMaintenanceRunSummary {
  companyId: string;
  actorUserId: string | null;
  playbookId: MemoryMaintenancePlaybookId | null;
  actions: MemoryMaintenanceAction[];
  maxRuns: number;
  scope: MemoryMaintenanceRunScope;
  reason: string | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  results: MemoryMaintenanceActionResult[];
  totals: {
    totalRuns: number;
    consolidationEpisodesCreated: number;
    consolidationInteractionsProcessed: number;
    consolidatedInteractionsDeleted: number;
    engramsFormed: number;
    engramFormationSkipped: number;
    engramsPruned: number;
  };
}

export interface MemoryMaintenanceRecommendation {
  playbookId: MemoryMaintenancePlaybookId;
  actions: MemoryMaintenanceAction[];
  priority: number;
  reasons: string[];
  autoEligible: boolean;
}

export interface MemoryMaintenanceRecentRun {
  id: string;
  createdAt: string;
  status: 'COMPLETED' | 'FAILED';
  scope: MemoryMaintenanceRunScope | null;
  playbookId: MemoryMaintenancePlaybookId | null;
  userId: string | null;
  reason: string | null;
  actions: MemoryMaintenanceAction[];
  totals: MemoryMaintenanceRunSummary['totals'] | null;
}

export interface MemoryLifecycleAutomationConfig {
  enabled: boolean;
  cron: string;
  maxCompaniesPerRun: number;
  maxPlaybooksPerCompany: number;
  cooldownMinutes: number;
}

export interface MemoryMaintenanceControlPlaneState {
  generatedAt: string;
  snapshot: MemoryLifecycleSnapshot;
  thresholds: MemoryLifecycleThresholds;
  playbooks: MemoryMaintenancePlaybook[];
  recommendations: MemoryMaintenanceRecommendation[];
  automation: MemoryLifecycleAutomationConfig & {
    lastAutoRunAt: string | null;
    lastAutoRunPlaybookId: MemoryMaintenancePlaybookId | null;
  };
  recentRuns: MemoryMaintenanceRecentRun[];
}

export function getMemoryMaintenancePlaybook(
  id: MemoryMaintenancePlaybookId,
): MemoryMaintenancePlaybook | undefined {
  return memoryMaintenancePlaybooks.find((playbook) => playbook.id === id);
}

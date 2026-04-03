'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  type AgentLifecycleHistoryItemDto,
  type AgentLifecycleItemDto,
  type AgentLifecycleSummaryDto,
  type AutonomyStatusDto,
  type MemoryHealthDto,
  type PendingActionDto,
  type RuntimeGovernanceAgentDto,
  type RuntimeGovernanceDrilldownsDto,
  type RuntimeGovernanceSummaryDto,
  type TruthfulnessDashboardDto,
} from '@/lib/api';
import { webFeatureFlags } from '@/lib/feature-flags';
import { formatAgentRoleLabel, formatGovernanceKeyLabel, formatLatencyLabel, formatRuntimeLayerLabel, formatToolLabel } from '@/lib/ui-language';
import { Monitor, ShieldCheck, Zap, Activity, DollarSign, TerminalSquare, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const THRESHOLD_LATENCY_P95_MS = 5000;
const THRESHOLD_SUCCESS_RATE_PCT = 95;
const CONTROL_TOWER_REQUEST_TIMEOUT_MS = 8000;
const MEMORY_FABRIC_ALLOWED_ROLES = new Set(['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER']);
const ROUTING_DIVERGENCE_SLICE = 'agro.techmaps.list-open-create';

interface PerformanceData {
  successRatePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  byAgent: Array<{ agentRole: string; avgLatencyMs: number; p95LatencyMs: number; errorCount: number }>;
}

interface CostData {
  companyId: string;
  tenantCost: { totalCostUsd: number; byModel: Array<{ modelId: string; costUsd: number }> };
  topByCost: Array<{ traceId: string; costUsd: number; durationMs: number; modelId: string }>;
  topByDuration: Array<{ traceId: string; costUsd: number; durationMs: number }>;
}

interface QueuePressureData {
  companyId: string;
  pressureState: 'IDLE' | 'STABLE' | 'PRESSURED' | 'SATURATED' | null;
  signalFresh: boolean;
  totalBacklog: number | null;
  hottestQueue: string | null;
  observedQueues: Array<{
    queueName: string;
    lastSize: number;
    avgSize: number;
    peakSize: number;
    samples: number;
    lastObservedAt: string | null;
  }>;
}

interface RoutingDivergenceData {
  companyId: string;
  windowHours: number;
  totalEvents: number;
  mismatchedEvents: number;
  divergenceRatePct: number;
  semanticPrimaryCount: number;
  caseMemoryCandidates: Array<{
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
    caseMemoryReadiness: 'observe' | 'needs_more_evidence' | 'ready_for_case_memory';
    firstSeenAt: string;
    lastSeenAt: string;
    ttlExpiresAt: string;
    sampleTraceId: string | null;
    sampleQuery: string | null;
    captureStatus: 'not_captured' | 'captured' | 'active';
    capturedAt: string | null;
    captureAuditLogId: string | null;
    activatedAt: string | null;
    activationAuditLogId: string | null;
  }>;
  failureClusters: Array<{
    key: string;
    targetRole: string;
    decisionType: string;
    mismatchKinds: string[];
    count: number;
    semanticPrimaryCount: number;
    caseMemoryReadiness: 'observe' | 'needs_more_evidence' | 'ready_for_case_memory';
    lastSeenAt: string;
    sampleTraceId: string | null;
    sampleQuery: string | null;
  }>;
  agentBreakdown: Array<{
    targetRole: string;
    totalEvents: number;
    mismatchedEvents: number;
    divergenceRatePct: number;
    semanticPrimaryCount: number;
    decisionBreakdown: Array<{
      decisionType: string;
      count: number;
    }>;
    topMismatchKinds: Array<{
      kind: string;
      count: number;
    }>;
    sampleTraceId: string | null;
    sampleQuery: string | null;
  }>;
  topClusters: Array<{
    key: string;
    label: string;
    count: number;
    mismatchKinds: string[];
    sampleTraceId: string | null;
    sampleQuery: string | null;
  }>;
  decisionBreakdown: Array<{
    decisionType: string;
    count: number;
  }>;
  collisionMatrix: Array<{
    legacyRouteKey: string;
    semanticRouteKey: string;
    count: number;
  }>;
  recentMismatches: Array<{
    traceId: string;
    createdAt: string;
    summary: string;
    sampleQuery: string | null;
    targetRole: string;
    decisionType: string;
    promotedPrimary: boolean;
  }>;
}

function formatCaseMemoryReadiness(readiness: RoutingDivergenceData['failureClusters'][number]['caseMemoryReadiness']): string {
  if (readiness === 'ready_for_case_memory') {
    return 'готово к памяти кейсов';
  }
  if (readiness === 'needs_more_evidence') {
    return 'нужно больше сигналов';
  }
  return 'наблюдение';
}

function caseMemoryReadinessTone(readiness: RoutingDivergenceData['failureClusters'][number]['caseMemoryReadiness']): 'success' | 'warning' | 'neutral' {
  if (readiness === 'ready_for_case_memory') {
    return 'success';
  }
  if (readiness === 'needs_more_evidence') {
    return 'warning';
  }
  return 'neutral';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`control_tower_${label}_timeout`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function safeRequest<T>(
  label: string,
  request: Promise<T>,
  fallback: T,
  timeoutMs: number = CONTROL_TOWER_REQUEST_TIMEOUT_MS,
  onError?: (error: unknown) => void,
): Promise<T> {
  try {
    return await withTimeout(request, timeoutMs, label);
  } catch (error) {
    console.warn(`[ControlTower] ${label} unavailable`, error);
    onError?.(error);
    return fallback;
  }
}

export default function ControlTowerPage() {
  const memoryEnabled = webFeatureFlags.controlTowerMemory;
  const [canViewMemoryFabric, setCanViewMemoryFabric] = useState(false);
  const [dashboard, setDashboard] = useState<TruthfulnessDashboardDto | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [cost, setCost] = useState<CostData | null>(null);
  const [queuePressure, setQueuePressure] = useState<QueuePressureData | null>(null);
  const [routingDivergence, setRoutingDivergence] = useState<RoutingDivergenceData | null>(null);
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealthDto | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyStatusDto | null>(null);
  const [runtimeGovernanceSummary, setRuntimeGovernanceSummary] = useState<RuntimeGovernanceSummaryDto | null>(null);
  const [runtimeGovernanceAgents, setRuntimeGovernanceAgents] = useState<RuntimeGovernanceAgentDto[]>([]);
  const [runtimeGovernanceDrilldowns, setRuntimeGovernanceDrilldowns] = useState<RuntimeGovernanceDrilldownsDto | null>(null);
  const [lifecycleSummary, setLifecycleSummary] = useState<AgentLifecycleSummaryDto | null>(null);
  const [lifecycleAgents, setLifecycleAgents] = useState<AgentLifecycleItemDto[]>([]);
  const [lifecycleHistory, setLifecycleHistory] = useState<AgentLifecycleHistoryItemDto[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActionDto[]>([]);
  const [governanceActionLoading, setGovernanceActionLoading] = useState<string | null>(null);
  const [lifecycleActionLoading, setLifecycleActionLoading] = useState<string | null>(null);
  const [pendingActionLoading, setPendingActionLoading] = useState<string | null>(null);
  const [caseMemoryCaptureLoading, setCaseMemoryCaptureLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [autonomyDialog, setAutonomyDialog] = useState<{ level: 'TOOL_FIRST' | 'QUARANTINE' } | null>(null);
  const [autonomyReason, setAutonomyReason] = useState('');
  const [canaryDialog, setCanaryDialog] = useState<{ changeId: string } | null>(null);
  const [canaryBaseline, setCanaryBaseline] = useState('0.05');
  const [canaryCurrent, setCanaryCurrent] = useState('0.05');
  const [canarySampleSize, setCanarySampleSize] = useState('100');
  const [rollbackDialog, setRollbackDialog] = useState<{ changeId: string } | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [lifecycleDialog, setLifecycleDialog] = useState<{ role: string; state: 'FROZEN' | 'RETIRED' } | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState('');

  const loadRoutingDivergence = useCallback(() => (
    safeRequest<RoutingDivergenceData | null>(
      'routing_divergence',
      api.explainability.routingDivergence({
        windowHours: 24,
        slice: ROUTING_DIVERGENCE_SLICE,
      }).then((res) => res.data),
      null,
    )
  ), []);

  const reloadRoutingDivergence = useCallback(async () => {
    const data = await loadRoutingDivergence();
    setRoutingDivergence(data);
    return data;
  }, [loadRoutingDivergence]);

  const handleCaptureCaseMemoryCandidate = useCallback(async (key: string, targetRole: string) => {
    setCaseMemoryCaptureLoading(key);
    setActionError(null);
    try {
      await api.explainability.captureRoutingCaseMemoryCandidate({
        key,
        windowHours: 24,
        slice: ROUTING_DIVERGENCE_SLICE,
        targetRole,
      });
      await reloadRoutingDivergence();
    } catch (captureError) {
      console.warn('[ControlTower] routing_case_memory_capture_failed', captureError);
      setActionError('Не удалось зафиксировать кандидат в память кейсов. Обновите панель и проверьте доступ к explainability API.');
    } finally {
      setCaseMemoryCaptureLoading(null);
    }
  }, [reloadRoutingDivergence]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meData = await safeRequest<{ role?: string } | null>(
          'users_me',
          api.users.me().then((res) => res.data),
          null,
        );
        const roleRaw = meData?.role;
        const normalizedRole = typeof roleRaw === 'string' ? roleRaw.toUpperCase() : '';
        const allowMemoryFabric =
          memoryEnabled && MEMORY_FABRIC_ALLOWED_ROLES.has(normalizedRole);
        if (cancelled) return;
        setCanViewMemoryFabric(allowMemoryFabric);

        const memoryHealthPromise = allowMemoryFabric
          ? safeRequest<MemoryHealthDto | null>(
            'memory_health',
            api.memory.health().then((res) => res.data),
            null,
          )
          : Promise.resolve(null);

        const [dashboardData, performanceData, costData, queuePressureData, routingDivergenceData, autonomyData, runtimeGovernanceSummaryData, runtimeGovernanceAgentsData, runtimeGovernanceDrilldownsData, lifecycleSummaryData, lifecycleAgentsData, lifecycleHistoryData, memoryData, pendingActionsData] = await Promise.all([
          safeRequest<TruthfulnessDashboardDto | null>(
            'dashboard',
            api.explainability.dashboard({ hours: 24 }).then((res) => res.data),
            null,
          ),
          safeRequest<PerformanceData | null>(
            'performance',
            api.explainability.performance({ timeWindowMs: 3600000 }).then((res) => res.data),
            null,
          ),
          safeRequest<CostData | null>(
            'cost_hotspots',
            api.explainability.costHotspots({ timeWindowMs: 86400000, limit: 10 }).then((res) => res.data),
            null,
          ),
          safeRequest<QueuePressureData | null>(
            'queue_pressure',
            api.explainability.queuePressure({ timeWindowMs: 3600000 }).then((res) => res.data),
            null,
          ),
          loadRoutingDivergence(),
          safeRequest<AutonomyStatusDto | null>(
            'autonomy_status',
            api.autonomy.status().then((res) => res.data),
            null,
          ),
          safeRequest<RuntimeGovernanceSummaryDto | null>(
            'runtime_governance_summary',
            api.explainability.runtimeGovernanceSummary({ timeWindowMs: 3600000 }).then((res) => res.data),
            null,
          ),
          safeRequest<RuntimeGovernanceAgentDto[]>(
            'runtime_governance_agents',
            api.explainability.runtimeGovernanceAgents({ timeWindowMs: 3600000 }).then((res) => res.data),
            [],
          ),
          safeRequest<RuntimeGovernanceDrilldownsDto | null>(
            'runtime_governance_drilldowns',
            api.explainability.runtimeGovernanceDrilldowns({ timeWindowMs: 3600000 }).then((res) => res.data),
            null,
          ),
          safeRequest<AgentLifecycleSummaryDto | null>(
            'lifecycle_summary',
            api.explainability.lifecycleSummary().then((res) => res.data),
            null,
          ),
          safeRequest<AgentLifecycleItemDto[]>(
            'lifecycle_agents',
            api.explainability.lifecycleAgents().then((res) => res.data),
            [],
          ),
          safeRequest<AgentLifecycleHistoryItemDto[]>(
            'lifecycle_history',
            api.explainability.lifecycleHistory({ limit: 12 }).then((res) => res.data),
            [],
          ),
          memoryHealthPromise,
          safeRequest<PendingActionDto[]>(
            'pending_actions',
            api.pendingActions.list({ limit: 12 }).then((res) => res.data),
            [],
            CONTROL_TOWER_REQUEST_TIMEOUT_MS,
            () => setActionError('Источник очереди ручной проверки временно недоступен. Обновите страницу и проверьте доступ к API.'),
          ),
        ]);
        if (cancelled) return;
        setDashboard(dashboardData);
        setPerformance(performanceData);
        setCost(costData);
        setQueuePressure(queuePressureData);
        setRoutingDivergence(routingDivergenceData);
        setMemoryHealth(memoryData);
        setAutonomy(autonomyData);
        setRuntimeGovernanceSummary(runtimeGovernanceSummaryData);
        setRuntimeGovernanceAgents(runtimeGovernanceAgentsData);
        setRuntimeGovernanceDrilldowns(runtimeGovernanceDrilldownsData);
        setLifecycleSummary(lifecycleSummaryData);
        setLifecycleAgents(lifecycleAgentsData);
        setLifecycleHistory(lifecycleHistoryData);
        setPendingActions(pendingActionsData);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? 'Сбой получения телеметрии');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadRoutingDivergence, memoryEnabled]);

  async function reloadRuntimeGovernance() {
    const [autonomyRes, summaryRes, agentsRes, drilldownsRes] = await Promise.all([
      api.autonomy.status(),
      api.explainability.runtimeGovernanceSummary({ timeWindowMs: 3600000 }),
      api.explainability.runtimeGovernanceAgents({ timeWindowMs: 3600000 }),
      api.explainability.runtimeGovernanceDrilldowns({ timeWindowMs: 3600000 }),
    ]);
    setAutonomy(autonomyRes.data);
    setRuntimeGovernanceSummary(summaryRes.data);
    setRuntimeGovernanceAgents(agentsRes.data);
    setRuntimeGovernanceDrilldowns(drilldownsRes.data);
  }

  async function reloadLifecycleBoard() {
    const [summaryRes, agentsRes, historyRes] = await Promise.all([
      api.explainability.lifecycleSummary(),
      api.explainability.lifecycleAgents(),
      api.explainability.lifecycleHistory({ limit: 12 }),
    ]);
    setLifecycleSummary(summaryRes.data);
    setLifecycleAgents(agentsRes.data);
    setLifecycleHistory(historyRes.data);
  }

  async function reloadLifecycleAndGovernance() {
    await Promise.all([reloadLifecycleBoard(), reloadRuntimeGovernance()]);
  }

  async function reloadPendingActions() {
    const pendingActionsRes = await api.pendingActions.list({ limit: 12 });
    setPendingActions(pendingActionsRes.data);
  }

  async function handleApproveFirstPendingAction(id: string) {
    try {
      setActionError(null);
      setPendingActionLoading(`approve-first:${id}`);
      await api.pendingActions.approveFirst(id);
      await reloadPendingActions();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось выполнить первое подтверждение');
    } finally {
      setPendingActionLoading(null);
    }
  }

  async function handleApproveFinalPendingAction(id: string) {
    try {
      setActionError(null);
      setPendingActionLoading(`approve-final:${id}`);
      await api.pendingActions.approveFinal(id);
      await reloadPendingActions();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось выполнить финальное подтверждение');
    } finally {
      setPendingActionLoading(null);
    }
  }

  async function handleExecuteApprovedPendingAction(id: string) {
    try {
      setActionError(null);
      setPendingActionLoading(`execute:${id}`);
      await api.pendingActions.execute(id);
      await reloadPendingActions();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось исполнить подтвержденное действие');
    } finally {
      setPendingActionLoading(null);
    }
  }

  async function handleRejectPendingAction(id: string, reason?: string) {
    try {
      setActionError(null);
      setPendingActionLoading(`reject:${id}`);
      await api.pendingActions.reject(id, reason?.trim() || undefined);
      await reloadPendingActions();
      setRejectDialog(null);
      setRejectReason('');
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось отклонить действие в очереди');
    } finally {
      setPendingActionLoading(null);
    }
  }

  async function handleSetAutonomyOverride(level: 'TOOL_FIRST' | 'QUARANTINE', reason: string) {
    if (reason.trim().length < 3) return;
    try {
      setActionError(null);
      setGovernanceActionLoading(level);
      await api.autonomy.setOverride({ level, reason: reason.trim() });
      await reloadRuntimeGovernance();
      setAutonomyDialog(null);
      setAutonomyReason('');
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось применить переопределение');
    } finally {
      setGovernanceActionLoading(null);
    }
  }

  async function handleClearAutonomyOverride() {
    try {
      setActionError(null);
      setGovernanceActionLoading('CLEAR');
      await api.autonomy.clearOverride();
      await reloadRuntimeGovernance();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось снять переопределение');
    } finally {
      setGovernanceActionLoading(null);
    }
  }

  async function handleStartCanary(changeId: string) {
    try {
      setActionError(null);
      setLifecycleActionLoading(`start:${changeId}`);
      await api.agents.startCanary(changeId);
      await reloadLifecycleAndGovernance();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось запустить канареечный релиз');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  async function handleReviewCanary(changeId: string, baseline: string, canary: string, sampleSize: string) {
    const baselineValue = Number(baseline);
    const canaryValue = Number(canary);
    const sampleSizeValue = Number(sampleSize);
    if (
      !Number.isFinite(baselineValue) ||
      !Number.isFinite(canaryValue) ||
      !Number.isFinite(sampleSizeValue) ||
      baselineValue < 0 ||
      canaryValue < 0 ||
      baselineValue > 1 ||
      canaryValue > 1 ||
      sampleSizeValue < 0
    ) {
      return;
    }

    try {
      setActionError(null);
      setLifecycleActionLoading(`review:${changeId}`);
      await api.agents.reviewCanary(changeId, {
        baselineRejectionRate: baselineValue,
        canaryRejectionRate: canaryValue,
        sampleSize: Math.trunc(sampleSizeValue),
      });
      await reloadLifecycleAndGovernance();
      setCanaryDialog(null);
      setCanaryBaseline('0.05');
      setCanaryCurrent('0.05');
      setCanarySampleSize('100');
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось завершить проверку канареечного релиза');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  async function handlePromoteChange(changeId: string) {
    try {
      setActionError(null);
      setLifecycleActionLoading(`promote:${changeId}`);
      await api.agents.promoteChange(changeId);
      await reloadLifecycleAndGovernance();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось выполнить продвижение в продакшен');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  async function handleRollbackChange(changeId: string, reason: string) {
    if (reason.trim().length < 3) return;
    try {
      setActionError(null);
      setLifecycleActionLoading(`rollback:${changeId}`);
      await api.agents.rollbackChange(changeId, reason.trim());
      await reloadLifecycleAndGovernance();
      setRollbackDialog(null);
      setRollbackReason('');
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось выполнить откат');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  async function handleSetLifecycleOverride(role: string, state: 'FROZEN' | 'RETIRED', reason: string) {
    if (reason.trim().length < 3) return;
    try {
      setActionError(null);
      setLifecycleActionLoading(`${state.toLowerCase()}:${role}`);
      await api.explainability.setLifecycleOverride({
        role,
        state,
        reason: reason.trim(),
      });
      await reloadLifecycleBoard();
      setLifecycleDialog(null);
      setLifecycleReason('');
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось применить переопределение жизненного цикла');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  async function handleClearLifecycleOverride(role: string) {
    try {
      setActionError(null);
      setLifecycleActionLoading(`clear-lifecycle:${role}`);
      await api.explainability.clearLifecycleOverride({ role });
      await reloadLifecycleBoard();
    } catch (e) {
      setActionError((e as Error).message ?? 'Не удалось снять переопределение жизненного цикла');
    } finally {
      setLifecycleActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-[#030213] rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-sm">Инициализация центрального пульта...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 font-sans">
        <div className="max-w-2xl mx-auto bg-white border border-black/10 rounded-2xl p-8 flex items-start gap-6">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#030213]">Институциональный сбой связи</h1>
            <p className="mt-2 text-[#717182] leading-relaxed text-sm">
              <span className="font-mono text-red-600">ERR_CONNECTION:</span> {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-[#030213] text-white text-sm font-medium rounded-lg hover:bg-[#030213]/90 transition-colors"
            >
              Переподключиться
            </button>
          </div>
        </div>
      </div>
    );
  }

  const latencyOk = performance ? performance.p95LatencyMs <= THRESHOLD_LATENCY_P95_MS : true;
  const successRateOk = performance ? performance.successRatePct >= THRESHOLD_SUCCESS_RATE_PCT : true;
  const retirementArchive = lifecycleHistory.filter((item) => item.state === 'RETIRED');
  const activeRetirements = retirementArchive.filter((item) => item.isActive);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header — Белая Канва */}
      <div className="bg-white border-b border-black/10 px-10 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-black/5">
                <Monitor size={16} className="text-[#030213]" />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">Контроль и надёжность</span>
            </div>
            <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Центральный пульт</h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-[#4a4a5a]">SLO</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-[#4a4a5a]">Стоимость</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-[#4a4a5a]">Аномалии</span>
            </div>
          </div>
          <div>
            <Link
              href="/control-tower/agents"
              className="px-6 py-2.5 bg-[#030213] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <TerminalSquare size={16} />
              Реестр агентов
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10">
        {actionError && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
            >
              Закрыть
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SLO & Надежность */}
          <UnitCard title="SLO и производительность" icon={<Activity size={20} />} subtitle="Инфраструктура">
            <div className="space-y-1">
              {performance ? (
                <>
                  <DataRow label="Задержка R95" value={formatLatencyLabel(performance.p95LatencyMs)} status={latencyOk ? 'success' : 'error'} />
                  <DataRow label="Средний отклик" value={formatLatencyLabel(performance.avgLatencyMs)} />
                  <DataRow label="Успешность (SLO)" value={`${performance.successRatePct.toFixed(1)}%`} status={successRateOk ? 'success' : 'error'} />
                  <DataRow
                    label="Давление очередей"
                    value={formatQueuePressureState(queuePressure?.pressureState)}
                    status={queuePressureStatus(queuePressure)}
                  />
                  <DataRow
                    label="Глубина очереди"
                    value={queuePressure?.totalBacklog === null || queuePressure?.totalBacklog === undefined ? 'ожидание' : `${queuePressure.totalBacklog}`}
                    status={queuePressureStatus(queuePressure)}
                  />
                  <DataRow
                    label="Сигнал очередей"
                    value={queuePressure ? (queuePressure.signalFresh ? 'свежий' : 'устаревший') : 'ожидание'}
                    status={queuePressure?.signalFresh ? 'success' : 'warning'}
                  />

                  {performance.byAgent.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Нагрузка по ролям</p>
                      <div className="space-y-0.5">
                        {performance.byAgent.slice(0, 4).map(a => (
                          <div key={a.agentRole} className="flex items-center justify-between py-1.5">
                            <span className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(a.agentRole)}</span>
                            <span className="text-[13px] font-mono text-[#717182]">{formatLatencyLabel(a.avgLatencyMs)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {queuePressure && queuePressure.observedQueues.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Контур очередей</p>
                      <div className="space-y-0.5">
                        {queuePressure.observedQueues.slice(0, 3).map(queue => (
                          <div key={queue.queueName} className="flex items-center justify-between py-1.5">
                            <span className="text-[12px] font-medium text-[#030213]">{queue.queueName}</span>
                            <span className="text-[12px] font-mono text-[#717182]">посл. {queue.lastSize} / пик {queue.peakSize}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : <NoData />}
            </div>
          </UnitCard>

          {canViewMemoryFabric ? (
            <UnitCard title="Контур памяти" icon={<Zap size={20} />} subtitle="Когнитивные слои">
              <div className="space-y-1">
                {memoryHealth ? (
                  <>
                    <DataRow
                      label="Статус памяти"
                      value={formatGovernanceKeyLabel(memoryHealth.status)}
                      status={memoryHealth.degraded ? 'warning' : 'success'}
                    />
                    <DataRow
                      label="Эпизоды"
                      value={memoryHealth.episodeCount === null ? 'н/д' : `${memoryHealth.episodeCount}`}
                    />
                    <DataRow
                      label="Энграммы"
                      value={memoryHealth.engramCount === null ? 'н/д' : `${memoryHealth.engramCount}`}
                    />
                    <DataRow
                      label="Индекс доверия"
                      value={memoryHealth.trustScore === null ? 'н/д' : `${(memoryHealth.trustScore * 100).toFixed(1)}%`}
                      status={
                        memoryHealth.trustScore === null
                          ? 'warning'
                          : memoryHealth.trustScore >= 0.85
                            ? 'success'
                            : memoryHealth.trustScore >= 0.7
                              ? 'warning'
                              : 'error'
                      }
                    />
                    <DataRow
                      label="Свежесть консолидации"
                      value={
                        memoryHealth.consolidationFreshness === null
                          ? 'н/д'
                          : `${memoryHealth.consolidationFreshness} мин`
                      }
                    />
                    <DataRow
                      label="Статус очистки"
                      value={formatGovernanceKeyLabel(memoryHealth.pruningStatus)}
                      status={memoryHealth.pruningStatus === 'nominal' ? 'success' : 'warning'}
                    />
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Слои</p>
                      <div className="space-y-2">
                        {Object.entries(memoryHealth.layers ?? {}).map(([name, value]) => (
                          <div key={name} className="flex items-start justify-between gap-4 text-[12px]">
                            <span className="font-medium text-[#030213]">{formatRuntimeLayerLabel(name)}</span>
                            <span className="text-right font-mono text-[#717182]">{typeof value === 'string' ? formatGovernanceKeyLabel(value) : 'Служебные показатели доступны'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : <NoData />}
              </div>
            </UnitCard>
          ) : null}

          {/* Качество и Валидация */}
          <UnitCard
            title="Качество и валидация"
            icon={<ShieldCheck size={20} />}
            subtitle="Целостность модели"
            hint="Метрики строятся по данным арендатора. Если доказательства или обратная связь не накоплены, показывается статус «ожидание». Режим автономности зависит от окна BS% и активных сигналов качества."
          >
            <div className="space-y-1">
              {dashboard ? (
                <>
                  <DataRow
                    label="Риск галлюцинаций (BS%)"
                    value={formatPctOrPending(dashboard.avgBsScore)}
                    status={
                      dashboard.avgBsScore === null
                        ? 'warning'
                        : dashboard.avgBsScore <= 15 ? 'success' : dashboard.avgBsScore <= 40 ? 'warning' : 'error'
                    }
                  />
                  <DataRow
                    label="P95 BS%"
                    value={formatPctOrPending(dashboard.p95BsScore)}
                  />
                  <DataRow
                    label="Доказательная база"
                    value={formatPctOrPending(dashboard.avgEvidenceCoverage)}
                    status={
                      dashboard.avgEvidenceCoverage === null
                        ? 'warning'
                        : dashboard.avgEvidenceCoverage >= 85 ? 'success' : 'warning'
                    }
                  />
                  <DataRow
                    label="Доля принятия рекомендаций"
                    value={formatPctOrPending(dashboard.acceptanceRate)}
                    status={
                      dashboard.acceptanceRate === null
                        ? 'warning'
                        : dashboard.acceptanceRate >= 70
                          ? 'success'
                          : dashboard.acceptanceRate >= 40
                            ? 'warning'
                            : 'error'
                    }
                  />
                  <DataRow
                    label="Доля корректировок"
                    value={formatPctOrPending(dashboard.correctionRate)}
                    status={
                      dashboard.correctionRate === null
                        ? 'warning'
                        : dashboard.correctionRate <= 15
                          ? 'success'
                          : dashboard.correctionRate <= 35
                            ? 'warning'
                            : 'error'
                    }
                  />
                  <DataRow
                    label="Режим автономности"
                    value={autonomy ? formatAutonomyLevel(autonomy.level) : 'ожидание'}
                    status={
                      autonomy?.level === 'AUTONOMOUS'
                        ? 'success'
                        : autonomy?.level === 'TOOL_FIRST'
                          ? 'warning'
                          : autonomy?.level === 'QUARANTINE'
                            ? 'error'
                            : 'warning'
                    }
                  />

                  <div className="mt-6 pt-5 border-t border-black/5">
                    <DataRow label="Готовые трассы качества" value={`${dashboard.qualityKnownTraceCount}`} status="success" />
                    <DataRow
                      label="Трассы в ожидании"
                      value={`${dashboard.qualityPendingTraceCount}`}
                      status={dashboard.qualityPendingTraceCount > 0 ? 'warning' : 'success'}
                    />
                    {autonomy && (
                      <DataRow
                        label="Фактор автономности"
                        value={autonomy.activeQualityAlert ? 'Сигнал качества требует внимания' : 'Автономный режим в норме'}
                        status={autonomy.activeQualityAlert ? 'warning' : 'success'}
                      />
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-black/5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">
                      Контур доверия веток
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <DataStat
                        label="Подтверждено"
                        value={`${dashboard.branchTrust.verifiedBranchCount}`}
                        status="success"
                      />
                      <DataStat
                        label="Частично"
                        value={`${dashboard.branchTrust.partialBranchCount}`}
                        status={dashboard.branchTrust.partialBranchCount > 0 ? 'warning' : 'neutral'}
                      />
                      <DataStat
                        label="Неподтв."
                        value={`${dashboard.branchTrust.unverifiedBranchCount}`}
                        status={dashboard.branchTrust.unverifiedBranchCount > 0 ? 'warning' : 'neutral'}
                      />
                      <DataStat
                        label="Конфликт"
                        value={`${dashboard.branchTrust.conflictedBranchCount}`}
                        status={dashboard.branchTrust.conflictedBranchCount > 0 ? 'error' : 'neutral'}
                      />
                      <DataStat
                        label="Отклонено"
                        value={`${dashboard.branchTrust.rejectedBranchCount}`}
                        status={dashboard.branchTrust.rejectedBranchCount > 0 ? 'error' : 'neutral'}
                      />
                      <DataStat
                        label="Перепроверка"
                        value={`${dashboard.branchTrust.crossCheckTraceCount}`}
                        status={dashboard.branchTrust.crossCheckTraceCount > 0 ? 'warning' : 'success'}
                      />
                    </div>

                    <div className="mt-4 space-y-0.5">
                      <DataRow
                        label="Трейсы с метриками доверия"
                        value={`${dashboard.branchTrust.knownTraceCount}`}
                        status={dashboard.branchTrust.knownTraceCount > 0 ? 'success' : 'warning'}
                      />
                      <DataRow
                        label="Ожидание метрик доверия"
                        value={`${dashboard.branchTrust.pendingTraceCount}`}
                        status={dashboard.branchTrust.pendingTraceCount > 0 ? 'warning' : 'success'}
                      />
                      <DataRow
                        label="Соблюдение бюджета"
                        value={formatPctOrPending(dashboard.branchTrust.withinBudgetRate)}
                        status={trustBudgetStatus(dashboard.branchTrust.withinBudgetRate)}
                      />
                      <DataRow
                        label="Выходы за бюджет"
                        value={`${dashboard.branchTrust.overBudgetTraceCount}`}
                        status={dashboard.branchTrust.overBudgetTraceCount > 0 ? 'error' : 'success'}
                      />
                      <DataRow
                        label="Средняя задержка шлюза доверия"
                        value={formatMsOrPending(dashboard.branchTrust.avgLatencyMs)}
                      />
                      <DataRow
                        label="P95 шлюза доверия"
                        value={formatMsOrPending(dashboard.branchTrust.p95LatencyMs)}
                      />
                    </div>
                  </div>
                </>
              ) : <NoData />}
            </div>
          </UnitCard>

          {/* Стоимость и Хотспоты */}
          <UnitCard title="Стоимость и LLM" icon={<DollarSign size={20} />} subtitle="Экономика затрат">
            <div className="space-y-1">
              {cost ? (
                <>
                  <div className="p-5 bg-slate-50 border border-black/5 rounded-xl mb-6">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[#717182] block mb-1">Общие затраты (24ч)</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-medium text-[#030213] tracking-tight font-mono">${cost.tenantCost.totalCostUsd.toFixed(2)}</span>
                      <span className="text-[11px] font-medium text-[#717182]">USD</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Хотспоты моделей</p>
                    {cost.tenantCost.byModel.slice(0, 3).map(m => (
                      <div key={m.modelId} className="flex items-center justify-between py-1.5">
                        <span className="text-[12px] font-medium text-[#030213] truncate mr-4">Модель ИИ</span>
                        <span className="text-[12px] font-mono text-[#717182]">${m.costUsd.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-black/5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Топ сессий (стоимость)</p>
                    <div className="space-y-1">
                      {cost.topByCost.slice(0, 3).map(task => (
                        <div key={task.traceId} className="flex items-center justify-between py-1.5">
                          <Link
                            href={`/control-tower/trace/${task.traceId}`}
                            className="text-[12px] font-mono text-blue-600 hover:underline"
                          >
                            Открыть трассу
                          </Link>
                          <span className="text-[12px] font-mono font-medium text-[#030213]">${task.costUsd.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : <NoData />}
            </div>
          </UnitCard>

        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={20} className="text-[#030213]" />
            <h2 className="text-xl font-medium text-[#030213] tracking-tight">
              Очередь ручной проверки
            </h2>
            <InfoHint hint="Здесь фиксируются действия, которые остановлены политикой риска или автономности и требуют ручного решения." />
          </div>
          <div className="rounded-3xl border border-black/10 bg-white shadow-sm shadow-black/[0.03] overflow-hidden">
            <div className="px-6 py-5 border-b border-black/5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">Ожидающие действия</p>
              </div>
              <div className="text-[12px] text-[#717182]">
                Открыто: <span className="font-mono text-[#030213]">{pendingActions.filter((item) => item.status === 'PENDING' || item.status === 'APPROVED_FIRST').length}</span>
              </div>
            </div>
            {pendingActions.length === 0 ? (
              <div className="px-6 py-8 text-[13px] text-[#717182]">Очередь пуста.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Инструмент</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Трасса</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Риск</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Статус</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Нагрузка</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Истекает</th>
                      <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[#717182]">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingActions.map((item) => (
                      <tr key={item.id} className="border-t border-black/[0.04] align-top">
                        <td className="px-6 py-4">
                          <div className="text-[13px] font-medium text-[#030213]">{formatToolLabel(item.toolName)}</div>
                          <div className="text-[11px] text-[#717182]">Внутренний идентификатор скрыт</div>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/control-tower/trace/${item.traceId}`} className="text-[12px] font-mono text-blue-600 hover:underline">
                            Открыть трассу
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={pendingActionRiskLevel(item.riskLevel)} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                            item.status === 'APPROVED_FINAL'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'APPROVED_FIRST'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : item.status === 'REJECTED' || item.status === 'EXPIRED'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200',
                          )}>
                            {formatGovernanceKeyLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[260px] text-[11px] leading-relaxed text-[#717182] font-mono break-all">
                            {formatControlTowerText(item.payloadPreview)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[12px] text-[#030213]">{new Date(item.expiresAt).toLocaleString('ru-RU')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleApproveFirstPendingAction(item.id)}
                                disabled={pendingActionLoading !== null}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingActionLoading === `approve-first:${item.id}` ? 'Подтверждение...' : 'Подтвердить 1/2'}
                              </button>
                            )}
                            {item.status === 'APPROVED_FIRST' && (
                              <button
                                type="button"
                                onClick={() => handleApproveFinalPendingAction(item.id)}
                                disabled={pendingActionLoading !== null}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingActionLoading === `approve-final:${item.id}` ? 'Финализация...' : 'Подтвердить финально'}
                              </button>
                            )}
                            {item.status === 'APPROVED_FINAL' && (
                              <button
                                type="button"
                                onClick={() => handleExecuteApprovedPendingAction(item.id)}
                                disabled={pendingActionLoading !== null}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingActionLoading === `execute:${item.id}` ? 'Исполнение...' : 'Исполнить'}
                              </button>
                            )}
                            {(item.status === 'PENDING' || item.status === 'APPROVED_FIRST') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectDialog({ id: item.id });
                                  setRejectReason('');
                                }}
                                disabled={pendingActionLoading !== null}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingActionLoading === `reject:${item.id}` ? 'Отклонение...' : 'Отклонить'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {lifecycleSummary && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <TerminalSquare size={20} className="text-[#030213]" />
              <h2 className="text-xl font-medium text-[#030213] tracking-tight">Панель жизненного цикла агентов</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <UnitCard title="Сводка жизненного цикла" icon={<TerminalSquare size={20} />} subtitle="Стадии флота">
                <div className="space-y-1">
                  <DataRow label="Отслеживаемые роли" value={`${lifecycleSummary.totalTrackedRoles}`} status="success" />
                  <DataRow label="Каталог шаблонов" value={`${lifecycleSummary.templateCatalogCount}`} status="success" />
                  <DataRow label="Будущие роли" value={`${lifecycleSummary.stateCounts.FUTURE_ROLE}`} status={lifecycleSummary.stateCounts.FUTURE_ROLE > 0 ? 'warning' : 'success'} />
                  <DataRow label="Кандидаты на продвижение" value={`${lifecycleSummary.stateCounts.PROMOTION_CANDIDATE}`} status={lifecycleSummary.stateCounts.PROMOTION_CANDIDATE > 0 ? 'warning' : 'success'} />
                  <DataRow label="Активные канареечные релизы" value={`${lifecycleSummary.stateCounts.CANARY}`} status={lifecycleSummary.stateCounts.CANARY > 0 ? 'warning' : 'success'} />
                  <DataRow label="Откаты" value={`${lifecycleSummary.stateCounts.ROLLED_BACK}`} status={lifecycleSummary.stateCounts.ROLLED_BACK > 0 ? 'error' : 'success'} />
                </div>
              </UnitCard>

              <UnitCard title="Контур канареечного релиза" icon={<Activity size={20} />} subtitle="Путь продвижения">
                <div className="space-y-0.5">
                  {lifecycleSummary.activeCanaries.length > 0 ? (
                    lifecycleSummary.activeCanaries.slice(0, 5).map((item) => (
                      <div key={item.changeRequestId} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <div>
                          <p className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(item.role)}</p>
                          <p className="text-[11px] text-[#717182]">{item.targetVersion}</p>
                        </div>
                        <span className="text-[11px] font-mono text-amber-600">активен</span>
                      </div>
                    ))
                  ) : (
                    <NoData />
                  )}

                  {lifecycleSummary.degradedCanaries.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Деградировавшие канарейки</p>
                      <div className="space-y-2">
                        {lifecycleSummary.degradedCanaries.slice(0, 4).map((item) => (
                          <div key={item.changeRequestId} className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                            <p className="text-[12px] font-medium text-[#030213]">{formatAgentRoleLabel(item.role)}</p>
                            <p className="mt-1 text-[11px] text-[#717182]">{item.targetVersion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </UnitCard>

              <UnitCard title="Откат и заморозка" icon={<ShieldCheck size={20} />} subtitle="Риски жизненного цикла">
                <div className="space-y-1">
                  <DataRow label="Заморожено" value={`${lifecycleSummary.stateCounts.FROZEN}`} status={lifecycleSummary.stateCounts.FROZEN > 0 ? 'warning' : 'success'} />
                  <DataRow label="Канонически активно" value={`${lifecycleSummary.stateCounts.CANONICAL_ACTIVE}`} status="success" />
                  <DataRow label="Выведено" value={`${lifecycleSummary.stateCounts.RETIRED}`} status="success" />
                </div>

                <div className="mt-6 pt-5 border-t border-black/5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">История откатов</p>
                  {lifecycleSummary.rolledBackRoles.length > 0 ? (
                    <div className="space-y-2">
                      {lifecycleSummary.rolledBackRoles.slice(0, 4).map((item) => (
                        <div key={`${item.role}:${item.targetVersion}`} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-3">
                          <p className="text-[12px] font-medium text-[#030213]">{formatAgentRoleLabel(item.role)}</p>
                          <p className="mt-1 text-[11px] text-[#717182]">
                            {item.targetVersion} • {item.rolledBackAt ? new Date(item.rolledBackAt).toLocaleString('ru') : 'время ожидается'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoData />
                  )}
                </div>
              </UnitCard>

              <UnitCard title="Архив вывода" icon={<ShieldCheck size={20} />} subtitle="Вывод версий">
                <div className="space-y-1">
                  <DataRow label="События вывода" value={`${retirementArchive.length}`} status={retirementArchive.length > 0 ? 'warning' : 'success'} />
                  <DataRow label="Активные выводы" value={`${activeRetirements.length}`} status={activeRetirements.length > 0 ? 'warning' : 'success'} />
                  <DataRow label="Сигнал архива" value={retirementArchive.length > 0 ? 'зафиксирован' : 'пусто'} status={retirementArchive.length > 0 ? 'success' : 'warning'} />
                </div>

                <div className="mt-6 pt-5 border-t border-black/5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Выведенные роли</p>
                  {retirementArchive.length > 0 ? (
                    <div className="space-y-2">
                      {retirementArchive.slice(0, 4).map((item) => (
                        <div key={`${item.role}:${item.createdAt}:retired`} className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-medium text-[#030213]">{formatAgentRoleLabel(item.role)}</p>
                            <span className={clsx(
                              'inline-flex px-2 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                              item.isActive
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-white text-slate-700 border-slate-200',
                            )}>
                              {item.isActive ? 'выведен' : 'снят'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#717182] leading-relaxed">{formatControlTowerText(item.reason)}</p>
                          <p className="mt-2 text-[11px] text-[#717182] font-mono">
                            {new Date(item.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoData />
                  )}
                </div>
              </UnitCard>
            </div>

            <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-1">История жизненного цикла</p>
                    <h3 className="text-lg font-medium text-[#030213] tracking-tight">История заморозки / вывода / снятия</h3>
                  </div>
                  <div className="text-[12px] text-[#717182]">
                    {lifecycleHistory.length} событий
                  </div>
                </div>
              </div>

              {lifecycleHistory.length > 0 ? (
                <div className="divide-y divide-black/5">
                  {lifecycleHistory.map((item) => (
                    <div key={`${item.role}:${item.createdAt}:${item.state}`} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(item.role)}</span>
                          <span className={clsx(
                            'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                            item.state === 'RETIRED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200',
                          )}>
                            {item.state === 'RETIRED' ? 'выведен' : 'заморожен'}
                          </span>
                          <span className={clsx(
                            'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200',
                          )}>
                            {item.isActive ? 'активен' : 'снят'}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] text-[#717182] leading-relaxed">
                          {formatControlTowerText(item.reason)}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#717182] font-mono lg:text-right">
                        <div>{new Date(item.createdAt).toLocaleString('ru-RU')}</div>
                        <div>{item.clearedAt ? `снят ${new Date(item.clearedAt).toLocaleString('ru-RU')}` : 'не снят'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-6">
                  <NoData />
                </div>
              )}
            </div>

            <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-1">Таблица жизненного цикла</p>
                    <h3 className="text-lg font-medium text-[#030213] tracking-tight">Стадии эволюции флота агентов</h3>
                  </div>
                  <div className="text-[12px] text-[#717182]">
                    {lifecycleAgents.length} ролей
                  </div>
                </div>
              </div>

              {lifecycleAgents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5 bg-white">
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Роль</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Домен</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Класс</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Стадия</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Текущая / Кандидат</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Изменение</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Канарейка / Откат</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Исполнение</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Примечания</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {lifecycleAgents.map((agent) => (
                        <tr key={agent.role} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(agent.role)}</div>
                            <div className="text-[11px] text-[#717182]">{formatAgentRoleLabel(agent.agentName)}</div>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-[#030213]">{formatAgentRoleLabel(agent.ownerDomain)}</td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                              agent.class === 'canonical'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200',
                            )}>
                              {agent.class === 'canonical' ? 'канонический' : 'будущий'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                              lifecycleBadgeClass(agent.lifecycleState),
                            )}>
                              {formatLifecycleState(agent.lifecycleState)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-mono text-[#030213]">{agent.currentVersion ?? 'ожидание'}</div>
                            <div className="text-[11px] text-[#717182]">стабильная {agent.stableVersion ?? 'ожидание'}</div>
                            <div className="text-[11px] text-[#717182]">кандидат {agent.candidateVersion ?? 'ожидание'}</div>
                            {agent.previousStableVersion && (
                              <div className="text-[10px] text-[#9a9aa5]">пред. {agent.previousStableVersion}</div>
                            )}
                            <div className="mt-2">
                              <span className={clsx(
                                'inline-flex px-2 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                                agent.versionDelta === 'AHEAD_OF_STABLE'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : agent.versionDelta === 'ROLLED_BACK_TO_STABLE'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : agent.versionDelta === 'MATCHES_STABLE'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200',
                              )}>
                                {formatGovernanceKeyLabel(agent.versionDelta)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[11px] text-[#717182]">{agent.changeRequestStatus ? formatGovernanceKeyLabel(agent.changeRequestStatus) : 'без изменений'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-mono text-[#030213]">{agent.canaryStatus ? formatGovernanceKeyLabel(agent.canaryStatus) : 'ожидание'}</div>
                            <div className="text-[11px] text-[#717182]">{agent.rollbackStatus ? formatGovernanceKeyLabel(agent.rollbackStatus) : 'ожидание'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-mono text-[#030213]">{agent.runtimeActive ? 'активно' : 'неактивно'}</div>
                            <div className="text-[11px] text-[#717182]">{formatTenantAccessMode(agent.tenantAccessMode)}</div>
                          </td>
                          <td className="px-6 py-4">
                            {agent.notes.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {agent.notes.slice(0, 2).map((note) => (
                                  <span key={note} className="inline-flex px-2 py-1 rounded bg-slate-100 text-[10px] font-medium uppercase tracking-widest text-[#717182]">
                                    {formatGovernanceKeyLabel(note)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#717182]">нет заметок</span>
                            )}
                            {agent.lifecycleOverride && (
                              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <div className="text-[10px] font-medium uppercase tracking-widest text-amber-700">
                                  {agent.lifecycleOverride.state === 'RETIRED' ? 'переопределение вывода' : 'переопределение заморозки'}
                                </div>
                                <div className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                                  {agent.lifecycleOverride.reason}
                                </div>
                              </div>
                            )}
                            {agent.lineage.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {agent.lineage.slice(0, 2).map((item) => (
                                  <div key={item.changeRequestId} className="text-[10px] text-[#717182] font-mono">
                                    {item.targetVersion} • {formatGovernanceKeyLabel(item.status)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {agent.lifecycleOverride ? (
                                <button
                                  type="button"
                                  onClick={() => handleClearLifecycleOverride(agent.role)}
                                  disabled={lifecycleActionLoading !== null}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {lifecycleActionLoading === `clear-lifecycle:${agent.role}` ? 'Снятие...' : 'Снять состояние цикла'}
                                </button>
                              ) : (
                                <>
                                  {agent.lifecycleState !== 'RETIRED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLifecycleDialog({ role: agent.role, state: 'FROZEN' });
                                        setLifecycleReason('');
                                      }}
                                      disabled={lifecycleActionLoading !== null}
                                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {lifecycleActionLoading === `frozen:${agent.role}` ? 'Заморозка...' : 'Заморозить'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLifecycleDialog({ role: agent.role, state: 'RETIRED' });
                                      setLifecycleReason('');
                                    }}
                                    disabled={lifecycleActionLoading !== null}
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {lifecycleActionLoading === `retired:${agent.role}` ? 'Вывод...' : 'Вывести'}
                                  </button>
                                </>
                              )}
                              {agent.latestChangeRequestId ? (
                                <>
                                {agent.changeRequestStatus === 'READY_FOR_CANARY' && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartCanary(agent.latestChangeRequestId as string)}
                                    disabled={lifecycleActionLoading !== null}
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {lifecycleActionLoading === `start:${agent.latestChangeRequestId}` ? 'Запуск...' : 'Запустить канарейку'}
                                  </button>
                                )}
                                {agent.canaryStatus === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCanaryDialog({ changeId: agent.latestChangeRequestId as string });
                                      setCanaryBaseline('0.05');
                                      setCanaryCurrent('0.05');
                                      setCanarySampleSize('100');
                                    }}
                                    disabled={lifecycleActionLoading !== null}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {lifecycleActionLoading === `review:${agent.latestChangeRequestId}` ? 'Проверка...' : 'Проверить канарейку'}
                                  </button>
                                )}
                                {agent.changeRequestStatus === 'APPROVED_FOR_PRODUCTION' && (
                                  <button
                                    type="button"
                                    onClick={() => handlePromoteChange(agent.latestChangeRequestId as string)}
                                    disabled={lifecycleActionLoading !== null}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {lifecycleActionLoading === `promote:${agent.latestChangeRequestId}` ? 'Продвижение...' : 'Продвинуть'}
                                  </button>
                                )}
                                {(agent.changeRequestStatus === 'PROMOTED' || agent.changeRequestStatus === 'APPROVED_FOR_PRODUCTION') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRollbackDialog({ changeId: agent.latestChangeRequestId as string });
                                      setRollbackReason('');
                                    }}
                                    disabled={lifecycleActionLoading !== null}
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {lifecycleActionLoading === `rollback:${agent.latestChangeRequestId}` ? 'Откат...' : 'Откатить'}
                                  </button>
                                )}
                                </>
                              ) : null}
                              {!agent.latestChangeRequestId && !agent.lifecycleOverride && (
                                <span className="text-[12px] text-[#717182]">действия недоступны</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-6">
                  <NoData />
                </div>
              )}
            </div>
          </div>
        )}

        {(routingDivergence || (runtimeGovernanceSummary && runtimeGovernanceSummary.flags.uiEnabled)) && (
          <div className="mt-12">
            {runtimeGovernanceSummary && runtimeGovernanceSummary.flags.uiEnabled && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck size={20} className="text-[#030213]" />
                  <h2 className="text-xl font-medium text-[#030213] tracking-tight">Управление исполнением</h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <UnitCard
                title="Сигналы управления"
                icon={<ShieldCheck size={20} />}
                subtitle="Контроль исполнения"
              >
                <div className="space-y-1">
                  <DataRow
                    label="Активные рекомендации"
                    value={`${runtimeGovernanceSummary.activeRecommendations.length}`}
                    status={runtimeGovernanceSummary.activeRecommendations.length > 0 ? 'warning' : 'success'}
                  />
                  <DataRow
                    label="Сигналы качества"
                    value={`${runtimeGovernanceSummary.quality.qualityAlertCount}`}
                    status={runtimeGovernanceSummary.quality.qualityAlertCount > 0 ? 'warning' : 'success'}
                  />
                  <DataRow
                    label="Давление очередей"
                    value={formatQueuePressureState(runtimeGovernanceSummary.queuePressure.pressureState)}
                    status={queuePressureStatus(runtimeGovernanceSummary.queuePressure)}
                  />
                  <DataRow
                    label="Автономность"
                    value={formatAutonomyLevel(runtimeGovernanceSummary.autonomy.level as AutonomyStatusDto['level'])}
                    status={
                      runtimeGovernanceSummary.autonomy.level === 'AUTONOMOUS'
                        ? 'success'
                        : runtimeGovernanceSummary.autonomy.level === 'QUARANTINE'
                          ? 'error'
                          : 'warning'
                    }
                  />
                  <DataRow
                    label="Средний BS%"
                    value={formatPctOrPending(runtimeGovernanceSummary.quality.avgBsScorePct)}
                    status={
                      runtimeGovernanceSummary.quality.avgBsScorePct === null
                        ? 'warning'
                        : runtimeGovernanceSummary.quality.avgBsScorePct <= 15
                          ? 'success'
                          : runtimeGovernanceSummary.quality.avgBsScorePct <= 35
                            ? 'warning'
                            : 'error'
                    }
                  />
                  <DataRow
                    label="Авто-карантин"
                    value={runtimeGovernanceSummary.flags.autoQuarantineEnabled ? 'включен' : 'выключен'}
                    status={runtimeGovernanceSummary.flags.autoQuarantineEnabled ? 'warning' : 'success'}
                  />
                </div>
                <div className="mt-6 pt-5 border-t border-black/5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Ручное переопределение автономности</p>
                  {runtimeGovernanceSummary.autonomy.manualOverride ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[12px] font-medium text-[#030213]">
                        Активно переопределение: {formatAutonomyLevel(runtimeGovernanceSummary.autonomy.manualOverride.level as AutonomyStatusDto['level'])}
                      </p>
                      <p className="mt-2 text-[12px] text-[#717182] leading-relaxed">
                        Причина: {runtimeGovernanceSummary.autonomy.manualOverride.reason}
                      </p>
                      <p className="mt-2 text-[11px] text-[#717182]">
                        {new Date(runtimeGovernanceSummary.autonomy.manualOverride.createdAt).toLocaleString('ru')}
                      </p>
                    </div>
                  ) : (
                    <p className="mb-4 text-[12px] text-[#717182]">Ручное переопределение отсутствует.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAutonomyDialog({ level: 'TOOL_FIRST' });
                        setAutonomyReason('');
                      }}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'TOOL_FIRST' ? 'Применение...' : 'Режим "сначала инструменты"'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAutonomyDialog({ level: 'QUARANTINE' });
                        setAutonomyReason('');
                      }}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'QUARANTINE' ? 'Применение...' : 'Включить карантин'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAutonomyOverride}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.autonomy.manualOverride || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'CLEAR' ? 'Снятие...' : 'Снять переопределение'}
                    </button>
                  </div>
                </div>
              </UnitCard>

              <UnitCard
                title="Контур резервирования"
                icon={<Zap size={20} />}
                subtitle="Маршрутизация и восстановление"
              >
                <div className="space-y-0.5">
                  {runtimeGovernanceSummary.topFallbackReasons.length > 0 ? (
                    runtimeGovernanceSummary.topFallbackReasons.slice(0, 5).map((item) => (
                      <div key={item.fallbackReason} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <span className="text-[13px] text-[#030213] font-medium">{formatGovernanceKeyLabel(item.fallbackReason)}</span>
                        <span className="text-[13px] font-mono text-[#717182]">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <NoData />
                  )}

                  {runtimeGovernanceSummary.recentIncidents.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Последние инциденты</p>
                      <div className="space-y-2">
                        {runtimeGovernanceSummary.recentIncidents.slice(0, 3).map((incident) => (
                          <div key={incident.id} className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-[#030213] truncate">{formatGovernanceKeyLabel(incident.incidentType)}</p>
                              <p className="text-[11px] text-[#717182] truncate">
                                Трасса скрыта • {new Date(incident.createdAt).toLocaleString('ru')}
                              </p>
                            </div>
                            <RiskBadge level={severityToRiskLevel(incident.severity)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </UnitCard>

              <UnitCard
                title="Наиболее проблемные агенты"
                icon={<Activity size={20} />}
                subtitle="Рейтинг надёжности"
              >
                <div className="space-y-0.5">
                  {runtimeGovernanceSummary.hottestAgents.length > 0 ? (
                    runtimeGovernanceSummary.hottestAgents.map((agent) => (
                      <div key={agent.agentRole} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <div>
                          <p className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(agent.agentRole)}</p>
                          <p className="text-[11px] text-[#717182]">
                            резерв {formatPctOrPending(agent.fallbackRatePct)} • BS {formatPctOrPending(agent.avgBsScorePct)}
                          </p>
                        </div>
                        <span className="text-[12px] font-mono text-[#717182]">{agent.incidentCount} инц.</span>
                      </div>
                    ))
                  ) : (
                    <NoData />
                  )}
                </div>
              </UnitCard>
                </div>
              </>
            )}

            <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-1">Расхождения роутинга</p>
                    <h3 className="text-lg font-medium text-[#030213] tracking-tight">Текущие расхождения наследованной и семантической маршрутизации</h3>
                  </div>
                  <div className="text-[12px] text-[#717182]">
                    {routingDivergence ? `${routingDivergence.totalEvents} событий / ${routingDivergence.windowHours} ч` : 'нет данных'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 px-6 py-6 border-b border-black/5">
                <DataStat
                  label="Расхождение"
                  value={routingDivergence ? `${routingDivergence.divergenceRatePct.toFixed(1)}%` : '—'}
                  status={
                    !routingDivergence
                      ? 'neutral'
                      : routingDivergence.divergenceRatePct <= 10
                        ? 'success'
                        : routingDivergence.divergenceRatePct <= 30
                          ? 'warning'
                          : 'error'
                  }
                />
                <DataStat
                  label="Сбоев"
                  value={routingDivergence ? `${routingDivergence.mismatchedEvents}` : '—'}
                  status={!routingDivergence || routingDivergence.mismatchedEvents === 0 ? 'success' : 'warning'}
                />
                <DataStat
                  label="Основной путь"
                  value={routingDivergence ? `${routingDivergence.semanticPrimaryCount}` : '—'}
                  status={routingDivergence && routingDivergence.semanticPrimaryCount > 0 ? 'success' : 'neutral'}
                />
                <DataStat
                  label="Самый шумный агент"
                  value={routingDivergence?.agentBreakdown[0]?.targetRole ?? '—'}
                  status={routingDivergence?.agentBreakdown.length ? 'warning' : 'neutral'}
                />
                <DataStat
                  label="Главный кластер"
                  value={routingDivergence?.topClusters[0]?.label ?? '—'}
                  status={routingDivergence?.topClusters.length ? 'warning' : 'neutral'}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-6 py-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Где шумит сильнее всего</p>
                  <div className="space-y-3">
                    {routingDivergence?.agentBreakdown.length ? routingDivergence.agentBreakdown.slice(0, 5).map((agent) => (
                      <div key={agent.targetRole} className="rounded-xl border border-black/5 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#030213] truncate">{agent.targetRole}</p>
                            <p className="text-[11px] text-[#717182] truncate">
                              сбоев {agent.mismatchedEvents}/{agent.totalEvents} • основной путь {agent.semanticPrimaryCount}
                            </p>
                          </div>
                          <span className="text-[13px] font-mono text-[#030213]">{agent.divergenceRatePct.toFixed(1)}%</span>
                        </div>
                        <p className="mt-2 text-[11px] text-[#717182]">
                          {agent.decisionBreakdown[0]
                            ? `${agent.decisionBreakdown[0].decisionType} • ${agent.decisionBreakdown[0].count}`
                            : 'нет разбивки по решениям'}
                        </p>
                        <p className="mt-1 text-[11px] text-[#717182]">
                          {agent.topMismatchKinds.length
                            ? agent.topMismatchKinds.map((item) => `${item.kind} (${item.count})`).join(', ')
                            : 'совпадение'}
                        </p>
                        {agent.sampleTraceId && (
                          <div className="mt-2 text-[11px] text-[#717182]">
                            <Link href={`/control-tower/trace/${agent.sampleTraceId}`} className="text-blue-600 hover:underline">
                              Открыть пример трассы
                            </Link>
                            {agent.sampleQuery ? ` • ${agent.sampleQuery}` : ''}
                          </div>
                        )}
                      </div>
                    )) : <NoData />}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Кластеры расхождений</p>
                  <div className="space-y-3">
                    {routingDivergence?.topClusters.length ? routingDivergence.topClusters.slice(0, 5).map((cluster) => (
                      <div key={cluster.key} className="rounded-xl border border-black/5 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#030213] truncate">{cluster.label}</p>
                            <p className="text-[11px] text-[#717182] truncate">
                              {cluster.mismatchKinds.length ? cluster.mismatchKinds.join(', ') : 'match'}
                              
                            </p>
                          </div>
                          <span className="text-[13px] font-mono text-[#030213]">{cluster.count}</span>
                        </div>
                        {cluster.sampleTraceId && (
                          <div className="mt-2 text-[11px] text-[#717182]">
                            <Link href={`/control-tower/trace/${cluster.sampleTraceId}`} className="text-blue-600 hover:underline">
                              Открыть пример трассы
                            </Link>
                            {cluster.sampleQuery ? ` • ${cluster.sampleQuery}` : ''}
                          </div>
                        )}
                      </div>
                    )) : <NoData />}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Последние конфликтные трассы</p>
                  <div className="space-y-3">
                    {routingDivergence?.recentMismatches.length ? routingDivergence.recentMismatches.slice(0, 5).map((item) => (
                      <div key={`${item.traceId}:${item.createdAt}`} className="rounded-xl border border-black/5 bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <Link href={`/control-tower/trace/${item.traceId}`} className="text-[13px] font-medium text-blue-600 hover:underline">
                              {item.traceId}
                            </Link>
                            <p className="text-[11px] text-[#717182]">
                              {new Date(item.createdAt).toLocaleString('ru')} • {formatAgentRoleLabel(item.targetRole)} • {formatControlTowerText(item.summary)}
                            </p>
                          </div>
                          <span className={clsx(
                            'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide',
                            item.promotedPrimary ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                          )}>
                            {item.promotedPrimary ? 'основной' : 'теневой'}
                          </span>
                        </div>
                        {item.sampleQuery && (
                          <p className="mt-2 text-[12px] text-[#030213] leading-relaxed">{item.sampleQuery}</p>
                        )}
                      </div>
                    )) : <NoData />}
                  </div>
                </div>
              </div>

              <div className="border-t border-black/5 px-6 py-6">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Повторяющиеся кластеры сбоев</p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {routingDivergence?.failureClusters.length ? routingDivergence.failureClusters.slice(0, 6).map((cluster) => (
                    <div key={cluster.key} className="rounded-xl border border-black/5 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#030213] truncate">{cluster.targetRole}</p>
                          <p className="text-[11px] text-[#717182] truncate">
                            {cluster.decisionType} • {cluster.mismatchKinds.join(', ')}
                          </p>
                        </div>
                        <span className={clsx(
                          'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide',
                          caseMemoryReadinessTone(cluster.caseMemoryReadiness) === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : caseMemoryReadinessTone(cluster.caseMemoryReadiness) === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700',
                        )}>
                          {formatCaseMemoryReadiness(cluster.caseMemoryReadiness)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-[#717182]">
                        <span>повторов {cluster.count}</span>
                        <span>primary {cluster.semanticPrimaryCount}</span>
                        <span>{new Date(cluster.lastSeenAt).toLocaleString('ru')}</span>
                      </div>
                      {cluster.sampleTraceId && (
                        <div className="mt-2 text-[11px] text-[#717182]">
                          <Link href={`/control-tower/trace/${cluster.sampleTraceId}`} className="text-blue-600 hover:underline">
                            Открыть пример трассы
                          </Link>
                          {cluster.sampleQuery ? ` • ${cluster.sampleQuery}` : ''}
                        </div>
                      )}
                    </div>
                  )) : <NoData />}
                </div>
              </div>

              <div className="border-t border-black/5 px-6 py-6">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Кандидаты в память кейсов</p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {routingDivergence?.caseMemoryCandidates.length ? routingDivergence.caseMemoryCandidates.slice(0, 6).map((candidate) => (
                    <div key={candidate.key} className="rounded-xl border border-black/5 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#030213] truncate">{formatAgentRoleLabel(candidate.targetRole)}</p>
                          <p className="text-[11px] text-[#717182] truncate">
                            {candidate.decisionType} • {candidate.mismatchKinds.join(', ')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={clsx(
                            'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide',
                            caseMemoryReadinessTone(candidate.caseMemoryReadiness) === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : caseMemoryReadinessTone(candidate.caseMemoryReadiness) === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-700',
                          )}>
                            {formatCaseMemoryReadiness(candidate.caseMemoryReadiness)}
                          </span>
                          <span className={clsx(
                            'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide',
                            candidate.captureStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : candidate.captureStatus === 'captured'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600',
                          )}>
                            {candidate.captureStatus === 'active'
                              ? 'активен в маршрутизации'
                              : candidate.captureStatus === 'captured'
                                ? 'зафиксирован'
                                : 'не зафиксирован'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[#717182]">
                        <span>версия router {candidate.routerVersion}</span>
                        <span>версия prompt {candidate.promptVersion}</span>
                        <span>версия toolset {candidate.toolsetVersion}</span>
                        <span>повторов {candidate.traceCount}</span>
                        <span>TTL до {new Date(candidate.ttlExpiresAt).toLocaleString('ru')}</span>
                        <span>последний сигнал {new Date(candidate.lastSeenAt).toLocaleString('ru')}</span>
                        {candidate.capturedAt && <span>зафиксирован {new Date(candidate.capturedAt).toLocaleString('ru')}</span>}
                        {candidate.captureAuditLogId && <span>лог {candidate.captureAuditLogId}</span>}
                        {candidate.activatedAt && <span>активирован {new Date(candidate.activatedAt).toLocaleString('ru')}</span>}
                        {candidate.activationAuditLogId && <span>лог активации {candidate.activationAuditLogId}</span>}
                      </div>
                      {candidate.sampleTraceId && (
                        <div className="mt-2 text-[11px] text-[#717182]">
                          <Link href={`/control-tower/trace/${candidate.sampleTraceId}`} className="text-blue-600 hover:underline">
                            Открыть пример трассы
                          </Link>
                          {candidate.sampleQuery ? ` • ${candidate.sampleQuery}` : ''}
                        </div>
                      )}
                      {candidate.caseMemoryReadiness === 'ready_for_case_memory' && candidate.captureStatus === 'not_captured' && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleCaptureCaseMemoryCandidate(candidate.key, candidate.targetRole)}
                            disabled={caseMemoryCaptureLoading === candidate.key}
                            className={clsx(
                              'rounded-lg border px-3 py-2 text-[12px] font-medium transition',
                              caseMemoryCaptureLoading === candidate.key
                                ? 'cursor-wait border-slate-200 bg-slate-100 text-slate-500'
                                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                            )}
                          >
                            {caseMemoryCaptureLoading === candidate.key ? 'фиксируем...' : 'зафиксировать'}
                          </button>
                        </div>
                      )}
                    </div>
                  )) : <NoData />}
                </div>
              </div>
            </div>

            {runtimeGovernanceSummary && runtimeGovernanceSummary.flags.uiEnabled && (
              <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-1">Таблица надёжности агентов</p>
                    <h3 className="text-lg font-medium text-[#030213] tracking-tight">Нездоровые роли ранжированы первыми</h3>
                  </div>
                  <div className="text-[12px] text-[#717182]">
                    {runtimeGovernanceAgents.length} ролей в контуре
                  </div>
                </div>
              </div>

              {runtimeGovernanceAgents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5 bg-white">
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Роль</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Успех</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Резерв</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Отказ по бюджету</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Сбой инструмента</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">P95 задержка</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">BS / Доказательства</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Рекомендация</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {runtimeGovernanceAgents.map((agent) => (
                        <tr key={agent.agentRole} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(agent.agentRole)}</div>
                            <div className="text-[11px] text-[#717182]">{agent.executionCount} запусков • {agent.incidentCount} инцидентов</div>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.successRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-amber-600">{formatPctOrPending(agent.fallbackRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.budgetDeniedRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.toolFailureRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">
                            {formatLatencyLabel(agent.p95LatencyMs)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.avgBsScorePct)}</div>
                            <div className="text-[11px] text-[#717182]">{formatPctOrPending(agent.avgEvidenceCoveragePct)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              'inline-flex px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border',
                              recommendationBadgeClass(agent.lastRecommendation),
                            )}>
                              {formatGovernanceKeyLabel(agent.lastRecommendation ?? 'NONE')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-6">
                  <NoData />
                </div>
              )}
              </div>
            )}

            {runtimeGovernanceDrilldowns && (
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <UnitCard
                  title="История резервирования"
                  icon={<Zap size={20} />}
                  subtitle="Детализация"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.fallbackHistory.length > 0 ? (
                      runtimeGovernanceDrilldowns.fallbackHistory.slice(0, 8).map((item) => (
                        <div key={`${item.agentRole}:${item.fallbackReason}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{formatAgentRoleLabel(item.agentRole)}</p>
                            <p className="text-[11px] text-[#717182]">{formatGovernanceKeyLabel(item.fallbackReason)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-mono text-[#030213]">{item.count}</p>
                            <p className="text-[11px] text-[#717182]">{new Date(item.lastSeenAt).toLocaleString('ru')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}
                  </div>
                </UnitCard>

                <UnitCard
                  title="Горячие точки бюджета"
                  icon={<DollarSign size={20} />}
                  subtitle="Детализация"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.budgetHotspots.length > 0 ? (
                      runtimeGovernanceDrilldowns.budgetHotspots.slice(0, 8).map((item) => (
                        <div key={`${item.agentRole ?? 'unknown'}:${item.toolName}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{formatToolLabel(item.toolName)}</p>
                            <p className="text-[11px] text-[#717182]">{formatAgentRoleLabel(item.agentRole ?? 'неизвестно')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-mono text-[#030213]">отказ {item.deniedCount} / деградация {item.degradedCount}</p>
                            <p className="text-[11px] text-[#717182]">{new Date(item.lastSeenAt).toLocaleString('ru')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}
                  </div>
                </UnitCard>

                <UnitCard
                  title="История дрейфа качества"
                  icon={<ShieldCheck size={20} />}
                  subtitle="Детализация"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.qualityDriftHistory.length > 0 ? (
                      runtimeGovernanceDrilldowns.qualityDriftHistory.slice(0, 8).map((item, index) => (
                        <div key={`${item.traceId ?? 'trace'}:${index}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#030213] truncate">{formatAgentRoleLabel(item.agentRole ?? 'неизвестно')}</p>
                            <p className="text-[11px] text-[#717182] truncate">
                              Трасса скрыта • рек. {formatGovernanceKeyLabel(item.recommendationType ?? 'NONE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-mono text-[#030213]">{formatPctOrPending(item.recentAvgBsPct)}</p>
                            <p className="text-[11px] text-[#717182]">база {formatPctOrPending(item.baselineAvgBsPct)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}
                  </div>
                </UnitCard>

                <UnitCard
                  title="Очереди и корреляция"
                  icon={<Activity size={20} />}
                  subtitle="Детализация"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.queueSaturationTimeline.length > 0 ? (
                      runtimeGovernanceDrilldowns.queueSaturationTimeline.slice(0, 4).map((item) => (
                        <div key={item.observedAt} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{formatQueuePressureState(item.pressureState)}</p>
                            <p className="text-[11px] text-[#717182]">{item.hottestQueue ?? 'исполнение'} • {new Date(item.observedAt).toLocaleString('ru')}</p>
                          </div>
                          <p className="text-[13px] font-mono text-[#030213]">{item.totalBacklog}</p>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}

                    {runtimeGovernanceDrilldowns.correlation.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-black/5">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Корреляция</p>
                        <div className="space-y-2">
                          {runtimeGovernanceDrilldowns.correlation.slice(0, 4).map((item, index) => (
                            <div key={`${item.traceId ?? 'trace'}:${index}`} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-3">
                              <p className="text-[12px] font-medium text-[#030213]">
                                {formatAgentRoleLabel(item.agentRole ?? 'неизвестно')} • {formatGovernanceKeyLabel(item.fallbackReason ?? 'NONE')}
                              </p>
                              <p className="mt-1 text-[11px] text-[#717182]">
                                рек. {formatGovernanceKeyLabel(item.recommendationType ?? 'NONE')} • инцидент {item.incidentType ?? 'нет'}
                              </p>
                              <p className="mt-1 text-[11px] text-[#717182]">
                                Трасса скрыта • {new Date(item.createdAt).toLocaleString('ru')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </UnitCard>
              </div>
            )}
          </div>
        )}

        {/* C-Pattern: Табличный вывод инцидентов / аномалий */}
        {dashboard && dashboard.worstTraces.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={20} className="text-[#030213]" />
              <h2 className="text-xl font-medium text-[#030213] tracking-tight">Критические аномалии (R3/R4)</h2>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Событие / идентификатор трассы</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">BS%</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Доказательная база</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182] text-right">Статус риска</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {dashboard.worstTraces.map(trace => {
                    const bsScore = trace.bsScorePct ?? null;
                    const evidenceCoverage = trace.evidenceCoveragePct ?? null;
                    const isR4 = bsScore !== null && bsScore > 60;
                    return (
                      <tr key={trace.traceId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/control-tower/trace/${trace.traceId}`} className="text-[13px] font-mono text-blue-600 hover:underline block">
                            Открыть трассу
                          </Link>
                          <span className="text-[11px] text-[#717182] mt-1 block">
                            {new Date(trace.createdAt).toLocaleString('ru')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx("text-[13px] font-mono font-medium", isR4 ? 'text-red-600' : 'text-amber-600')}>
                            {bsScore === null ? 'ожидание' : `${bsScore.toFixed(0)}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-mono text-[#030213]">
                            {evidenceCoverage === null ? 'ожидание' : `${evidenceCoverage.toFixed(0)}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <RiskBadge level={bsScore === null ? 'R2' : isR4 ? 'R4' : 'R3'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dashboard && dashboard.criticalPath.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={20} className="text-[#030213]" />
              <h2 className="text-xl font-medium text-[#030213] tracking-tight">Видимость критического пути</h2>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Трасса</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Узкое место</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Длительность фазы</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Длительность трассы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {dashboard.criticalPath.map((item) => (
                    <tr key={`${item.traceId}:${item.phase}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/control-tower/trace/${item.traceId}`} className="text-[13px] font-mono text-blue-600 hover:underline block">
                          Открыть трассу
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#030213]">{formatToolLabel(item.phase)}</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatLatencyLabel(item.durationMs)}</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#717182]">
                        {formatLatencyLabel(item.totalDurationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rejectDialog && (
          <ActionDialog
            title="Отклонить действие"
            description="Укажите причину отклонения (опционально)."
            onClose={() => setRejectDialog(null)}
            onConfirm={() => void handleRejectPendingAction(rejectDialog.id, rejectReason)}
            confirmLabel={pendingActionLoading === `reject:${rejectDialog.id}` ? 'Отклонение...' : 'Отклонить'}
            confirmDisabled={pendingActionLoading !== null}
          >
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="min-h-[84px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
              placeholder="Причина (опционально)"
            />
          </ActionDialog>
        )}

        {autonomyDialog && (
          <ActionDialog
            title={autonomyDialog.level === 'QUARANTINE' ? 'Включить ручной карантин' : 'Режим «сначала инструменты»'}
            description="Укажите причину, чтобы зафиксировать управленческое решение."
            onClose={() => setAutonomyDialog(null)}
            onConfirm={() => void handleSetAutonomyOverride(autonomyDialog.level, autonomyReason)}
            confirmLabel={governanceActionLoading === autonomyDialog.level ? 'Применение...' : 'Применить'}
            confirmDisabled={governanceActionLoading !== null || autonomyReason.trim().length < 3}
          >
            <textarea
              value={autonomyReason}
              onChange={(event) => setAutonomyReason(event.target.value)}
              className="min-h-[84px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
              placeholder="Причина (минимум 3 символа)"
            />
          </ActionDialog>
        )}

        {canaryDialog && (
          <ActionDialog
            title="Проверить канареечный релиз"
            description="Укажите параметры сравнения базовой и канареечной выборки."
            onClose={() => setCanaryDialog(null)}
            onConfirm={() => void handleReviewCanary(canaryDialog.changeId, canaryBaseline, canaryCurrent, canarySampleSize)}
            confirmLabel={lifecycleActionLoading === `review:${canaryDialog.changeId}` ? 'Проверка...' : 'Запустить проверку'}
            confirmDisabled={lifecycleActionLoading !== null}
          >
            <div className="grid grid-cols-1 gap-3">
              <label className="text-[12px] text-[#717182]">
                Базовая доля отклонений (0..1)
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={canaryBaseline}
                  onChange={(event) => setCanaryBaseline(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
                />
              </label>
              <label className="text-[12px] text-[#717182]">
                Канареечная доля отклонений (0..1)
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={canaryCurrent}
                  onChange={(event) => setCanaryCurrent(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
                />
              </label>
              <label className="text-[12px] text-[#717182]">
                Размер выборки
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={canarySampleSize}
                  onChange={(event) => setCanarySampleSize(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
                />
              </label>
            </div>
          </ActionDialog>
        )}

        {rollbackDialog && (
          <ActionDialog
            title="Откатить изменение"
            description="Укажите причину отката для аудита и трассировки."
            onClose={() => setRollbackDialog(null)}
            onConfirm={() => void handleRollbackChange(rollbackDialog.changeId, rollbackReason)}
            confirmLabel={lifecycleActionLoading === `rollback:${rollbackDialog.changeId}` ? 'Откат...' : 'Откатить'}
            confirmDisabled={lifecycleActionLoading !== null || rollbackReason.trim().length < 3}
          >
            <textarea
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
              className="min-h-[84px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
              placeholder="Причина отката (минимум 3 символа)"
            />
          </ActionDialog>
        )}

        {lifecycleDialog && (
          <ActionDialog
            title={lifecycleDialog.state === 'RETIRED' ? 'Вывести роль из цикла' : 'Заморозить роль'}
            description={`Роль: ${lifecycleDialog.role}. Укажите причину изменения состояния.`}
            onClose={() => setLifecycleDialog(null)}
            onConfirm={() => void handleSetLifecycleOverride(lifecycleDialog.role, lifecycleDialog.state, lifecycleReason)}
            confirmLabel={lifecycleActionLoading === `${lifecycleDialog.state.toLowerCase()}:${lifecycleDialog.role}` ? 'Применение...' : 'Применить'}
            confirmDisabled={lifecycleActionLoading !== null || lifecycleReason.trim().length < 3}
          >
            <textarea
              value={lifecycleReason}
              onChange={(event) => setLifecycleReason(event.target.value)}
              className="min-h-[84px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
              placeholder="Причина (минимум 3 символа)"
            />
          </ActionDialog>
        )}
      </div>
    </div>
  );
}

// Утилитные компоненты центрального пульта

function UnitCard({
  title,
  icon,
  subtitle,
  children,
  hint,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-black/10 rounded-3xl p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#717182] block mb-1">{subtitle}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-[#030213] tracking-tight">{title}</h3>
            {hint ? <InfoHint hint={hint} /> : null}
          </div>
        </div>
        <div className="text-[#030213]/40">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value, status }: { label: string; value: string; status?: 'success' | 'warning' | 'error' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/[0.03] last:border-0">
      <span className="text-[13px] text-[#717182]">{label}</span>
      <span className={clsx(
        "text-[13px] font-mono font-medium",
        status === 'success' ? 'text-emerald-600' :
          status === 'warning' ? 'text-amber-600' :
            status === 'error' ? 'text-red-600' :
              'text-[#030213]'
      )}>
        {value}
      </span>
    </div>
  );
}

function DataStat({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{label}</p>
      <p
        className={clsx(
          'mt-2 text-[20px] font-medium tracking-tight',
          status === 'success'
            ? 'text-emerald-700'
            : status === 'warning'
              ? 'text-amber-700'
              : status === 'error'
                ? 'text-red-700'
                : 'text-[#030213]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InfoHint({ hint }: { hint: string }) {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/15 bg-white text-[10px] font-medium text-[#717182] cursor-help"
      title={hint}
      aria-label={hint}
    >
      i
    </span>
  );
}

function ActionDialog({
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-2xl">
        <h3 className="text-[16px] font-medium text-[#030213]">{title}</h3>
        <p className="mt-1 text-[13px] text-[#717182]">{description}</p>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="rounded-lg bg-[#030213] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPctOrPending(value: number | null) {
  return value === null ? 'ожидание' : `${value.toFixed(1)}%`;
}

function formatMsOrPending(value: number | null) {
  return formatLatencyLabel(value);
}

function formatControlTowerText(value?: string | null) {
  if (!value) {
    return 'Служебные детали скрыты';
  }

  const normalized = value.toLowerCase();

  if (
    value.includes('{') ||
    value.includes('}') ||
    value.includes('"') ||
    value.includes('TRC-') ||
    value.includes('TX-') ||
    value.includes('tr_') ||
    normalized.includes('partytype') ||
    normalized.includes('jurisdiction') ||
    normalized.includes('legal_entity') ||
    normalized.includes('inn')
  ) {
    return 'Служебные детали скрыты';
  }

  return value;
}

function trustBudgetStatus(
  value: number | null,
): 'success' | 'warning' | 'error' {
  if (value === null) {
    return 'warning';
  }
  if (value >= 95) {
    return 'success';
  }
  if (value >= 80) {
    return 'warning';
  }
  return 'error';
}

function formatAutonomyLevel(level: AutonomyStatusDto['level']) {
  switch (level) {
    case 'AUTONOMOUS':
      return 'автономный';
    case 'TOOL_FIRST':
      return 'сначала инструменты';
    case 'QUARANTINE':
      return 'карантин';
    default:
      return 'ожидание';
  }
}

function formatQueuePressureState(state: QueuePressureData['pressureState'] | undefined) {
  switch (state) {
    case 'IDLE':
      return 'нет нагрузки';
    case 'STABLE':
      return 'стабильно';
    case 'PRESSURED':
      return 'под нагрузкой';
    case 'SATURATED':
      return 'перегружено';
    default:
      return 'ожидание';
  }
}

function queuePressureStatus(
  queuePressure:
    | Pick<QueuePressureData, 'pressureState' | 'signalFresh'>
    | null,
): 'success' | 'warning' | 'error' {
  if (!queuePressure || !queuePressure.signalFresh || queuePressure.pressureState === null) {
    return 'warning';
  }
  if (queuePressure.pressureState === 'SATURATED') {
    return 'error';
  }
  if (queuePressure.pressureState === 'PRESSURED') {
    return 'warning';
  }
  return 'success';
}


function formatLifecycleState(state: AgentLifecycleItemDto['lifecycleState']) {
  switch (state) {
    case 'CANARY':
      return 'канарейка';
    case 'PROMOTION_CANDIDATE':
      return 'кандидат на продвижение';
    case 'FROZEN':
      return 'заморожен';
    case 'ROLLED_BACK':
      return 'откачен';
    case 'FUTURE_ROLE':
      return 'будущая роль';
    case 'RETIRED':
      return 'выведен';
    case 'CANONICAL_ACTIVE':
      return 'активен';
    default:
      return 'ожидание';
  }
}

function formatTenantAccessMode(mode: string | null | undefined) {
  const normalized = (mode ?? '').toUpperCase();
  if (normalized === 'INHERITED') return 'наследуется';
  if (normalized === 'OVERRIDE') return 'переопределено';
  if (normalized === 'DENIED') return 'запрещено';
  return mode ? mode.toLowerCase().replaceAll('_', ' ') : 'ожидание';
}

function lifecycleBadgeClass(state: AgentLifecycleItemDto['lifecycleState']) {
  switch (state) {
    case 'CANARY':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PROMOTION_CANDIDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'FROZEN':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'ROLLED_BACK':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'FUTURE_ROLE':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'RETIRED':
      return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    case 'CANONICAL_ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

function severityToRiskLevel(severity: string): 'R1' | 'R2' | 'R3' | 'R4' | 'Success' {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'R4';
    case 'HIGH':
      return 'R3';
    case 'MEDIUM':
      return 'R2';
    case 'LOW':
      return 'R1';
    default:
      return 'R2';
  }
}

function recommendationBadgeClass(recommendation: string | null) {
  switch (recommendation) {
    case 'QUARANTINE_RECOMMENDED':
    case 'ROLLBACK_RECOMMENDED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'REVIEW_REQUIRED':
    case 'CONCURRENCY_TUNING_RECOMMENDED':
    case 'BUDGET_TUNING_RECOMMENDED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

function RiskBadge({ level }: { level: 'R1' | 'R2' | 'R3' | 'R4' | 'Success' }) {
  const styles = {
    'R4': 'bg-red-50 text-red-700 border-red-200',
    'R3': 'bg-amber-50 text-amber-700 border-amber-200',
    'R2': 'bg-amber-50 text-amber-600 border-amber-200',
    'R1': 'bg-blue-50 text-blue-700 border-blue-200',
    'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={clsx("px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-widest border", styles[level])}>
      {level === 'Success' ? 'Проверено' : level}
    </span>
  );
}

function pendingActionRiskLevel(level: string): 'R1' | 'R2' | 'R3' | 'R4' | 'Success' {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return 'R4';
    case 'WRITE':
      return 'R3';
    case 'READ':
      return 'R1';
    default:
      return 'R2';
  }
}

function NoData() {
  return <p className="text-[13px] text-[#717182] italic py-4">Данные отсутствуют</p>;
}

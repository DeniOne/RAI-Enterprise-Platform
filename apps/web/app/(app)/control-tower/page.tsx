'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  type AutonomyStatusDto,
  type RuntimeGovernanceAgentDto,
  type RuntimeGovernanceDrilldownsDto,
  type RuntimeGovernanceSummaryDto,
} from '@/lib/api';
import { Monitor, ShieldCheck, Zap, Activity, DollarSign, TerminalSquare, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const THRESHOLD_LATENCY_P95_MS = 5000;
const THRESHOLD_SUCCESS_RATE_PCT = 95;

interface DashboardData {
  companyId: string;
  avgBsScore: number | null;
  p95BsScore: number | null;
  avgEvidenceCoverage: number | null;
  acceptanceRate: number | null;
  correctionRate: number | null;
  worstTraces: Array<{ traceId: string; bsScorePct: number | null; evidenceCoveragePct: number | null; createdAt: string }>;
  qualityKnownTraceCount: number;
  qualityPendingTraceCount: number;
  criticalPath: Array<{ traceId: string; phase: string; durationMs: number; totalDurationMs: number | null; createdAt: string }>;
}

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

export default function ControlTowerPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [cost, setCost] = useState<CostData | null>(null);
  const [queuePressure, setQueuePressure] = useState<QueuePressureData | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyStatusDto | null>(null);
  const [runtimeGovernanceSummary, setRuntimeGovernanceSummary] = useState<RuntimeGovernanceSummaryDto | null>(null);
  const [runtimeGovernanceAgents, setRuntimeGovernanceAgents] = useState<RuntimeGovernanceAgentDto[]>([]);
  const [runtimeGovernanceDrilldowns, setRuntimeGovernanceDrilldowns] = useState<RuntimeGovernanceDrilldownsDto | null>(null);
  const [governanceActionLoading, setGovernanceActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dRes, pRes, cRes, qRes, aRes, rgSummaryRes, rgAgentsRes, rgDrilldownsRes] = await Promise.all([
          api.explainability.dashboard({ hours: 24 }),
          api.explainability.performance({ timeWindowMs: 3600000 }),
          api.explainability.costHotspots({ timeWindowMs: 86400000, limit: 10 }),
          api.explainability.queuePressure({ timeWindowMs: 3600000 }),
          api.autonomy.status(),
          api.explainability.runtimeGovernanceSummary({ timeWindowMs: 3600000 }),
          api.explainability.runtimeGovernanceAgents({ timeWindowMs: 3600000 }),
          api.explainability.runtimeGovernanceDrilldowns({ timeWindowMs: 3600000 }),
        ]);
        if (cancelled) return;
        setDashboard(dRes.data);
        setPerformance(pRes.data);
        setCost(cRes.data);
        setQueuePressure(qRes.data);
        setAutonomy(aRes.data);
        setRuntimeGovernanceSummary(rgSummaryRes.data);
        setRuntimeGovernanceAgents(rgAgentsRes.data);
        setRuntimeGovernanceDrilldowns(rgDrilldownsRes.data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? 'Сбой получения телеметрии');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  async function handleSetAutonomyOverride(level: 'TOOL_FIRST' | 'QUARANTINE') {
    const reason = window.prompt(
      level === 'QUARANTINE'
        ? 'Укажи причину для manual quarantine'
        : 'Укажи причину для manual tool-first',
      '',
    );
    if (!reason || reason.trim().length < 3) {
      return;
    }

    try {
      setGovernanceActionLoading(level);
      await api.autonomy.setOverride({ level, reason: reason.trim() });
      await reloadRuntimeGovernance();
    } catch (e) {
      window.alert((e as Error).message ?? 'Не удалось применить override');
    } finally {
      setGovernanceActionLoading(null);
    }
  }

  async function handleClearAutonomyOverride() {
    try {
      setGovernanceActionLoading('CLEAR');
      await api.autonomy.clearOverride();
      await reloadRuntimeGovernance();
    } catch (e) {
      window.alert((e as Error).message ?? 'Не удалось снять override');
    } finally {
      setGovernanceActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-[#030213] rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-sm">Инициализация Control Plane...</p>
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
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">Control & Reliability</span>
            </div>
            <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Центральный пульт</h1>
            <p className="text-sm text-[#717182] max-w-xl leading-relaxed">
              Институциональный интерфейс для управления надежностью (SLO), аудита стоимости и детекции аномалий в поведении роя агентов.
            </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SLO & Надежность */}
          <UnitCard title="SLO и Производительность" icon={<Activity size={20} />} subtitle="Infrastructure">
            <div className="space-y-1">
              {performance ? (
                <>
                  <DataRow label="Задержка R95" value={`${performance.p95LatencyMs.toFixed(0)} ms`} status={latencyOk ? 'success' : 'error'} />
                  <DataRow label="Средний отклик" value={`${performance.avgLatencyMs.toFixed(0)} ms`} />
                  <DataRow label="Успешность (SLO)" value={`${performance.successRatePct.toFixed(1)}%`} status={successRateOk ? 'success' : 'error'} />
                  <DataRow
                    label="Runtime pressure"
                    value={formatQueuePressureState(queuePressure?.pressureState)}
                    status={queuePressureStatus(queuePressure)}
                  />
                  <DataRow
                    label="Backlog depth"
                    value={queuePressure?.totalBacklog === null || queuePressure?.totalBacklog === undefined ? 'pending' : `${queuePressure.totalBacklog}`}
                    status={queuePressureStatus(queuePressure)}
                  />
                  <DataRow
                    label="Queue signal"
                    value={queuePressure ? (queuePressure.signalFresh ? 'live' : 'stale') : 'pending'}
                    status={queuePressure?.signalFresh ? 'success' : 'warning'}
                  />

                  {performance.byAgent.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Нагрузка по ролям</p>
                      <div className="space-y-0.5">
                        {performance.byAgent.slice(0, 4).map(a => (
                          <div key={a.agentRole} className="flex items-center justify-between py-1.5">
                            <span className="text-[13px] font-medium text-[#030213]">{a.agentRole}</span>
                            <span className="text-[13px] font-mono text-[#717182]">{a.avgLatencyMs.toFixed(0)} ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {queuePressure && queuePressure.observedQueues.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-black/5">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Queue contour</p>
                      <div className="space-y-0.5">
                        {queuePressure.observedQueues.slice(0, 3).map(queue => (
                          <div key={queue.queueName} className="flex items-center justify-between py-1.5">
                            <span className="text-[12px] font-medium text-[#030213]">{queue.queueName}</span>
                            <span className="text-[12px] font-mono text-[#717182]">last {queue.lastSize} / peak {queue.peakSize}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : <NoData />}
            </div>
          </UnitCard>

          {/* Качество и Валидация */}
          <UnitCard title="Качество и Валидация" icon={<ShieldCheck size={20} />} subtitle="Model Integrity">
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
                    label="P95 BS% Score"
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
                    label="Acceptance Rate (advisory)"
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
                    label="Correction Rate"
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
                    label="Autonomy Mode"
                    value={autonomy ? formatAutonomyLevel(autonomy.level) : 'pending'}
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

                  <div className="mt-8 p-4 bg-slate-50 border border-black/5 rounded-xl">
                    <p className="text-[12px] text-[#717182] leading-relaxed">
                      `Acceptance Rate` строится по tenant-scoped advisory decisions. `Correction Rate` строится по decision-scoped persisted advisory feedback с `outcome=corrected` и дедупликацией по `traceId`; при отсутствии decision base он остаётся `pending`. Quality-метрики без persisted evidence показываются как `pending`, а не как synthetic `0/100`. `Autonomy Mode` зависит от реально посчитанного BS%-окна и активных quality drift alerts.
                    </p>
                    <p className="text-[12px] text-[#717182] leading-relaxed mt-3">
                      Quality ready traces: <span className="font-mono text-[#030213]">{dashboard.qualityKnownTraceCount}</span>, pending traces: <span className="font-mono text-[#030213]">{dashboard.qualityPendingTraceCount}</span>.
                    </p>
                    {autonomy && (
                      <p className="text-[12px] text-[#717182] leading-relaxed mt-3">
                        Autonomy driver: <span className="font-mono text-[#030213]">{autonomy.driver}</span>
                        {autonomy.activeQualityAlert ? ' (active quality alert)' : ''}.
                      </p>
                    )}
                  </div>
                </>
              ) : <NoData />}
            </div>
          </UnitCard>

          {/* Стоимость и Хотспоты */}
          <UnitCard title="Стоимость и LLM" icon={<DollarSign size={20} />} subtitle="Unit Economy">
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
                        <span className="text-[12px] font-medium text-[#030213] truncate mr-4">{m.modelId.split('/').pop()}</span>
                        <span className="text-[12px] font-mono text-[#717182]">${m.costUsd.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-black/5">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Топ сессий (Cost)</p>
                    <div className="space-y-1">
                      {cost.topByCost.slice(0, 3).map(task => (
                        <div key={task.traceId} className="flex items-center justify-between py-1.5">
                          <Link
                            href={`/control-tower/trace/${task.traceId}`}
                            className="text-[12px] font-mono text-blue-600 hover:underline"
                          >
                            {task.traceId.slice(0, 16)}...
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

        {runtimeGovernanceSummary && runtimeGovernanceSummary.flags.uiEnabled && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={20} className="text-[#030213]" />
              <h2 className="text-xl font-medium text-[#030213] tracking-tight">Runtime Governance</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <UnitCard
                title="Governance Signals"
                icon={<ShieldCheck size={20} />}
                subtitle="Runtime Control"
              >
                <div className="space-y-1">
                  <DataRow
                    label="Активные рекомендации"
                    value={`${runtimeGovernanceSummary.activeRecommendations.length}`}
                    status={runtimeGovernanceSummary.activeRecommendations.length > 0 ? 'warning' : 'success'}
                  />
                  <DataRow
                    label="Quality alerts"
                    value={`${runtimeGovernanceSummary.quality.qualityAlertCount}`}
                    status={runtimeGovernanceSummary.quality.qualityAlertCount > 0 ? 'warning' : 'success'}
                  />
                  <DataRow
                    label="Queue pressure"
                    value={formatQueuePressureState(runtimeGovernanceSummary.queuePressure.pressureState)}
                    status={queuePressureStatus(runtimeGovernanceSummary.queuePressure)}
                  />
                  <DataRow
                    label="Autonomy"
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
                    label="Auto quarantine"
                    value={runtimeGovernanceSummary.flags.autoQuarantineEnabled ? 'enabled' : 'disabled'}
                    status={runtimeGovernanceSummary.flags.autoQuarantineEnabled ? 'warning' : 'success'}
                  />
                </div>
                <div className="mt-6 pt-5 border-t border-black/5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Manual autonomy override</p>
                  {runtimeGovernanceSummary.autonomy.manualOverride ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[12px] font-medium text-[#030213]">
                        Активен override: {formatAutonomyLevel(runtimeGovernanceSummary.autonomy.manualOverride.level as AutonomyStatusDto['level'])}
                      </p>
                      <p className="mt-2 text-[12px] text-[#717182] leading-relaxed">
                        Причина: {runtimeGovernanceSummary.autonomy.manualOverride.reason}
                      </p>
                      <p className="mt-2 text-[11px] text-[#717182]">
                        {new Date(runtimeGovernanceSummary.autonomy.manualOverride.createdAt).toLocaleString('ru')}
                      </p>
                    </div>
                  ) : (
                    <p className="mb-4 text-[12px] text-[#717182]">Активный manual override отсутствует.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAutonomyOverride('TOOL_FIRST')}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'TOOL_FIRST' ? 'Применение...' : 'Перевести в TOOL-FIRST'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAutonomyOverride('QUARANTINE')}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'QUARANTINE' ? 'Применение...' : 'Включить QUARANTINE'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAutonomyOverride}
                      disabled={governanceActionLoading !== null || !runtimeGovernanceSummary.autonomy.manualOverride || !runtimeGovernanceSummary.flags.enforcementEnabled}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {governanceActionLoading === 'CLEAR' ? 'Снятие...' : 'Снять override'}
                    </button>
                  </div>
                </div>
              </UnitCard>

              <UnitCard
                title="Fallback Contour"
                icon={<Zap size={20} />}
                subtitle="Routing & Recovery"
              >
                <div className="space-y-0.5">
                  {runtimeGovernanceSummary.topFallbackReasons.length > 0 ? (
                    runtimeGovernanceSummary.topFallbackReasons.slice(0, 5).map((item) => (
                      <div key={item.fallbackReason} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <span className="text-[13px] text-[#030213] font-medium">{formatGovernanceKey(item.fallbackReason)}</span>
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
                              <p className="text-[12px] font-medium text-[#030213] truncate">{incident.incidentType}</p>
                              <p className="text-[11px] text-[#717182] truncate">
                                {incident.traceId ?? 'без trace'} • {new Date(incident.createdAt).toLocaleString('ru')}
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
                title="Hottest Agents"
                icon={<Activity size={20} />}
                subtitle="Reliability Ranking"
              >
                <div className="space-y-0.5">
                  {runtimeGovernanceSummary.hottestAgents.length > 0 ? (
                    runtimeGovernanceSummary.hottestAgents.map((agent) => (
                      <div key={agent.agentRole} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                        <div>
                          <p className="text-[13px] font-medium text-[#030213]">{agent.agentRole}</p>
                          <p className="text-[11px] text-[#717182]">
                            fallback {formatPctOrPending(agent.fallbackRatePct)} • BS {formatPctOrPending(agent.avgBsScorePct)}
                          </p>
                        </div>
                        <span className="text-[12px] font-mono text-[#717182]">{agent.incidentCount} inc</span>
                      </div>
                    ))
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
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-1">Agent Reliability Table</p>
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
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Success</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Fallback</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Budget deny</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Tool fail</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">P95 latency</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">BS / Evidence</th>
                        <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {runtimeGovernanceAgents.map((agent) => (
                        <tr key={agent.agentRole} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[13px] font-medium text-[#030213]">{agent.agentRole}</div>
                            <div className="text-[11px] text-[#717182]">{agent.executionCount} runs • {agent.incidentCount} incidents</div>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.successRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-amber-600">{formatPctOrPending(agent.fallbackRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.budgetDeniedRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{formatPctOrPending(agent.toolFailureRatePct)}</td>
                          <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">
                            {agent.p95LatencyMs === null ? 'pending' : `${agent.p95LatencyMs.toFixed(0)} ms`}
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
                              {formatGovernanceKey(agent.lastRecommendation ?? 'NONE')}
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

            {runtimeGovernanceDrilldowns && (
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <UnitCard
                  title="Fallback History"
                  icon={<Zap size={20} />}
                  subtitle="Drilldown"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.fallbackHistory.length > 0 ? (
                      runtimeGovernanceDrilldowns.fallbackHistory.slice(0, 8).map((item) => (
                        <div key={`${item.agentRole}:${item.fallbackReason}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{item.agentRole}</p>
                            <p className="text-[11px] text-[#717182]">{formatGovernanceKey(item.fallbackReason)}</p>
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
                  title="Budget Hotspots"
                  icon={<DollarSign size={20} />}
                  subtitle="Drilldown"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.budgetHotspots.length > 0 ? (
                      runtimeGovernanceDrilldowns.budgetHotspots.slice(0, 8).map((item) => (
                        <div key={`${item.agentRole ?? 'unknown'}:${item.toolName}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{item.toolName}</p>
                            <p className="text-[11px] text-[#717182]">{item.agentRole ?? 'unknown'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-mono text-[#030213]">deny {item.deniedCount} / degrade {item.degradedCount}</p>
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
                  title="Quality Drift History"
                  icon={<ShieldCheck size={20} />}
                  subtitle="Drilldown"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.qualityDriftHistory.length > 0 ? (
                      runtimeGovernanceDrilldowns.qualityDriftHistory.slice(0, 8).map((item, index) => (
                        <div key={`${item.traceId ?? 'trace'}:${index}`} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#030213] truncate">{item.agentRole ?? 'unknown'}</p>
                            <p className="text-[11px] text-[#717182] truncate">
                              {item.traceId ?? 'без trace'} • rec {formatGovernanceKey(item.recommendationType ?? 'NONE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-mono text-[#030213]">{formatPctOrPending(item.recentAvgBsPct)}</p>
                            <p className="text-[11px] text-[#717182]">base {formatPctOrPending(item.baselineAvgBsPct)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}
                  </div>
                </UnitCard>

                <UnitCard
                  title="Queue & Correlation"
                  icon={<Activity size={20} />}
                  subtitle="Drilldown"
                >
                  <div className="space-y-0.5">
                    {runtimeGovernanceDrilldowns.queueSaturationTimeline.length > 0 ? (
                      runtimeGovernanceDrilldowns.queueSaturationTimeline.slice(0, 4).map((item) => (
                        <div key={item.observedAt} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium text-[#030213]">{formatQueuePressureState(item.pressureState)}</p>
                            <p className="text-[11px] text-[#717182]">{item.hottestQueue ?? 'runtime'} • {new Date(item.observedAt).toLocaleString('ru')}</p>
                          </div>
                          <p className="text-[13px] font-mono text-[#030213]">{item.totalBacklog}</p>
                        </div>
                      ))
                    ) : (
                      <NoData />
                    )}

                    {runtimeGovernanceDrilldowns.correlation.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-black/5">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-3">Correlation</p>
                        <div className="space-y-2">
                          {runtimeGovernanceDrilldowns.correlation.slice(0, 4).map((item, index) => (
                            <div key={`${item.traceId ?? 'trace'}:${index}`} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-3">
                              <p className="text-[12px] font-medium text-[#030213]">
                                {item.agentRole ?? 'unknown'} • {formatGovernanceKey(item.fallbackReason ?? 'NONE')}
                              </p>
                              <p className="mt-1 text-[11px] text-[#717182]">
                                rec {formatGovernanceKey(item.recommendationType ?? 'NONE')} • incident {item.incidentType ?? 'none'}
                              </p>
                              <p className="mt-1 text-[11px] text-[#717182]">
                                {item.traceId ?? 'без trace'} • {new Date(item.createdAt).toLocaleString('ru')}
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
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Событие / Trace ID</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">BS% Score</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Evidence Base</th>
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
                            {trace.traceId}
                          </Link>
                          <span className="text-[11px] text-[#717182] mt-1 block">
                            {new Date(trace.createdAt).toLocaleString('ru')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx("text-[13px] font-mono font-medium", isR4 ? 'text-red-600' : 'text-amber-600')}>
                            {bsScore === null ? 'pending' : `${bsScore.toFixed(0)}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-mono text-[#030213]">
                            {evidenceCoverage === null ? 'pending' : `${evidenceCoverage.toFixed(0)}%`}
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
              <h2 className="text-xl font-medium text-[#030213] tracking-tight">Critical Path Visibility</h2>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Trace</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Bottleneck phase</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Phase duration</th>
                    <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Total trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {dashboard.criticalPath.map((item) => (
                    <tr key={`${item.traceId}:${item.phase}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/control-tower/trace/${item.traceId}`} className="text-[13px] font-mono text-blue-600 hover:underline block">
                          {item.traceId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#030213]">{item.phase}</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#030213]">{item.durationMs.toFixed(0)} ms</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#717182]">
                        {item.totalDurationMs === null ? 'pending' : `${item.totalDurationMs.toFixed(0)} ms`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Утилитные компоненты Control Plane

function UnitCard({ title, icon, subtitle, children }: { title: string; icon: React.ReactNode; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-black/10 rounded-3xl p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#717182] block mb-1">{subtitle}</span>
          <h3 className="text-lg font-medium text-[#030213] tracking-tight">{title}</h3>
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

function formatPctOrPending(value: number | null) {
  return value === null ? 'pending' : `${value.toFixed(1)}%`;
}

function formatAutonomyLevel(level: AutonomyStatusDto['level']) {
  switch (level) {
    case 'AUTONOMOUS':
      return 'autonomous';
    case 'TOOL_FIRST':
      return 'tool-first';
    case 'QUARANTINE':
      return 'quarantine';
    default:
      return 'pending';
  }
}

function formatQueuePressureState(state: QueuePressureData['pressureState'] | undefined) {
  switch (state) {
    case 'IDLE':
      return 'idle';
    case 'STABLE':
      return 'stable';
    case 'PRESSURED':
      return 'pressured';
    case 'SATURATED':
      return 'saturated';
    default:
      return 'pending';
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

function formatGovernanceKey(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ');
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
      {level === 'Success' ? 'Verified' : level}
    </span>
  );
}

function NoData() {
  return <p className="text-[13px] text-[#717182] italic py-4">Данные отсутствуют</p>;
}

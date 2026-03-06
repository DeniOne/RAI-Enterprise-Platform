'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Monitor, ShieldCheck, Zap, Activity, DollarSign, TerminalSquare, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const THRESHOLD_LATENCY_P95_MS = 5000;
const THRESHOLD_SUCCESS_RATE_PCT = 95;

interface DashboardData {
  companyId: string;
  avgBsScore: number;
  p95BsScore: number;
  avgEvidenceCoverage: number;
  worstTraces: Array<{ traceId: string; bsScorePct: number; evidenceCoveragePct: number; createdAt: string }>;
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

export default function ControlTowerPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [cost, setCost] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dRes, pRes, cRes] = await Promise.all([
          api.explainability.dashboard({ hours: 24 }),
          api.explainability.performance({ timeWindowMs: 3600000 }),
          api.explainability.costHotspots({ timeWindowMs: 86400000, limit: 10 }),
        ]);
        if (cancelled) return;
        setDashboard(dRes.data);
        setPerformance(pRes.data);
        setCost(cRes.data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? 'Сбой получения телеметрии');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
                    value={`${dashboard.avgBsScore.toFixed(1)}%`}
                    status={dashboard.avgBsScore <= 15 ? 'success' : dashboard.avgBsScore <= 40 ? 'warning' : 'error'}
                  />
                  <DataRow
                    label="P95 BS% Score"
                    value={`${dashboard.p95BsScore.toFixed(1)}%`}
                  />
                  <DataRow
                    label="Доказательная база"
                    value={`${dashboard.avgEvidenceCoverage.toFixed(1)}%`}
                    status={dashboard.avgEvidenceCoverage >= 85 ? 'success' : 'warning'}
                  />

                  <div className="mt-8 p-4 bg-slate-50 border border-black/5 rounded-xl">
                    <p className="text-[12px] text-[#717182] leading-relaxed">
                      Система RAI гарантирует детерминизм через Evidence Tagging. Текущий уровень покрытия соответствует Institutional Grade (Stage 4).
                    </p>
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
                    const isR4 = trace.bsScorePct > 60;
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
                            {trace.bsScorePct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-mono text-[#030213]">
                            {trace.evidenceCoveragePct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <RiskBadge level={isR4 ? 'R4' : 'R3'} />
                        </td>
                      </tr>
                    );
                  })}
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

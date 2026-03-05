'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

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
        if (!cancelled) setError((e as Error).message ?? 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Control Tower</h1>
        <p className="mt-2">Загрузка…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Control Tower</h1>
        <p className="mt-2 text-red-400">{error}</p>
      </div>
    );
  }

  const latencyOk = performance ? performance.p95LatencyMs <= THRESHOLD_LATENCY_P95_MS : true;
  const successRateOk = performance ? performance.successRatePct >= THRESHOLD_SUCCESS_RATE_PCT : true;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
      <h1 className="text-2xl font-semibold text-white">Control Tower</h1>
      <p className="mt-1 text-sm text-zinc-500">SLO, стоимость, топология роя агентов</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* SLO & Reliability */}
        <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-200">SLO & Reliability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">Latency p95</span>
                  <span className={latencyOk ? 'text-emerald-400' : 'text-red-400'}>
                    {performance.p95LatencyMs.toFixed(0)} ms
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">Avg latency</span>
                  <span className="text-zinc-200">{performance.avgLatencyMs.toFixed(0)} ms</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">Success rate</span>
                  <span className={successRateOk ? 'text-emerald-400' : 'text-red-400'}>
                    {performance.successRatePct.toFixed(1)}%
                  </span>
                </div>
                {performance.byAgent.length > 0 && (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                    <p className="mb-2 text-xs font-medium uppercase text-zinc-500">По агентам</p>
                    <ul className="space-y-1 text-sm">
                      {performance.byAgent.slice(0, 5).map((a) => (
                        <li key={a.agentRole} className="flex justify-between">
                          <span>{a.agentRole}</span>
                          <span>{a.avgLatencyMs.toFixed(0)} ms / err: {a.errorCount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {!performance && <p className="text-sm text-zinc-500">Нет данных</p>}
          </CardContent>
        </Card>

        {/* Quality (BS% / Evidence) */}
        <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-200">Quality & Evals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">BS% avg</span>
                  <span className={dashboard.avgBsScore <= 20 ? 'text-emerald-400' : dashboard.avgBsScore <= 50 ? 'text-amber-400' : 'text-red-400'}>
                    {dashboard.avgBsScore.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">Evidence coverage</span>
                  <span className="text-zinc-200">{dashboard.avgEvidenceCoverage.toFixed(1)}%</span>
                </div>
              </>
            )}
            {!dashboard && <p className="text-sm text-zinc-500">Нет данных</p>}
          </CardContent>
        </Card>

        {/* Cost */}
        <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-200">Cost Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cost && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <span className="text-sm text-zinc-400">Total (24h)</span>
                  <span className="text-lg font-medium text-white">${cost.tenantCost.totalCostUsd.toFixed(2)}</span>
                </div>
                {cost.tenantCost.byModel.length > 0 && (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                    <p className="mb-2 text-xs font-medium uppercase text-zinc-500">По моделям</p>
                    <ul className="space-y-1 text-sm">
                      {cost.tenantCost.byModel.map((m) => (
                        <li key={m.modelId} className="flex justify-between">
                          <span className="truncate">{m.modelId}</span>
                          <span>${m.costUsd.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
                  <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Top по стоимости</p>
                  <ul className="space-y-1 text-sm">
                    {(cost.topByCost ?? []).slice(0, 5).map((h) => (
                      <li key={h.traceId}>
                        <Link
                          href={`/control-tower/trace/${h.traceId}`}
                          className="text-sky-400 hover:underline"
                        >
                          {h.traceId.slice(0, 12)}…
                        </Link>
                        <span className="ml-2">${h.costUsd.toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {!cost && <p className="text-sm text-zinc-500">Нет данных</p>}
          </CardContent>
        </Card>
      </div>

      {/* Worst traces */}
      {dashboard && dashboard.worstTraces.length > 0 && (
        <Card className="mt-8 border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-200">Худшие трейсы (BS%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dashboard.worstTraces.map((t) => (
                <li key={t.traceId} className="flex items-center justify-between rounded border border-zinc-700/50 px-4 py-2">
                  <Link
                    href={`/control-tower/trace/${t.traceId}`}
                    className="text-sky-400 hover:underline"
                  >
                    {t.traceId}
                  </Link>
                  <span className={t.bsScorePct > 50 ? 'text-red-400' : 'text-amber-400'}>
                    BS% {t.bsScorePct.toFixed(0)} / Evidence {t.evidenceCoveragePct.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

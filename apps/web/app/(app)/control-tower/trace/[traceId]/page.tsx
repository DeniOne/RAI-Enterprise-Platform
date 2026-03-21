'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  api,
  type BranchVerdict,
  type TraceForensicsResponseDto,
  type TraceForensicsSemanticIngressFrameDto,
} from '@/lib/api';
import { Play, Clock, FileSearch, ShieldCheck, Box } from 'lucide-react';
import { clsx } from 'clsx';

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then((mod) => mod.default),
  { ssr: false }
);

interface TopologyNode {
  id: string;
  label: string;
  kind: string;
  durationMs: number;
  parentId: string | null;
  childrenIds: string[];
  hasError?: boolean;
  toolNames?: string[];
}

interface TopologyData {
  traceId: string;
  nodes: TopologyNode[];
  criticalPathNodeIds: string[];
  totalDurationMs: number;
}

interface BranchTrustEntry {
  assessment: NonNullable<TraceForensicsResponseDto['branchTrust']>['branchTrustAssessments'][number];
  result?: NonNullable<TraceForensicsResponseDto['branchTrust']>['branchResults'][number];
  composition?: NonNullable<TraceForensicsResponseDto['branchTrust']>['branchCompositions'][number];
}

export default function TraceForensicsPage() {
  const params = useParams<{ traceId: string }>();
  const router = useRouter();
  const traceId = useMemo(() => String(params?.traceId ?? ''), [params]);

  const [forensics, setForensics] = useState<TraceForensicsResponseDto | null>(null);
  const [topology, setTopology] = useState<TopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayBusy, setReplayBusy] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('forensics');

  useEffect(() => {
    if (!traceId) return;
    let cancelled = false;
    (async () => {
      try {
        const [fRes, topRes] = await Promise.all([
          api.explainability.traceForensics(traceId),
          api.explainability.traceTopology(traceId),
        ]);
        if (cancelled) return;
        setForensics(fRes.data);
        setTopology(topRes.data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? 'Сбой криптографической проверки трейса');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [traceId]);

  const onReplay = useCallback(async () => {
    if (!traceId) return;
    setReplayError(null);
    setReplayBusy(true);
    try {
      const res = await api.explainability.replayTrace(traceId);
      const data = res.data as { replayTraceId?: string };
      if (data?.replayTraceId) {
        router.push(`/control-tower/trace/${data.replayTraceId}`);
      } else {
        setReplayError('Повтор выполнен успешно, но создать новый traceId не удалось.');
      }
    } catch (e) {
      setReplayError((e as Error).message ?? 'Повтор отклонён Sentinel (требуется доступ ADMIN)');
    } finally {
      setReplayBusy(false);
    }
  }, [traceId, router]);

  const graphData = useMemo(() => {
    if (!topology?.nodes?.length) return { nodes: [], links: [] };
    const criticalSet = new Set(topology.criticalPathNodeIds ?? []);
    const nodes = topology.nodes.map((n) => ({
      id: n.id,
      name: n.label || n.id,
      kind: n.kind,
      critical: criticalSet.has(n.id),
      durationMs: n.durationMs,
    }));
    const links: Array<{ source: string; target: string }> = [];
    for (const n of topology.nodes) {
      for (const cid of n.childrenIds ?? []) {
        if (topology.nodes.some((x) => x.id === cid)) {
          links.push({ source: n.id, target: cid });
        }
      }
    }
    return { nodes, links };
  }, [topology]);

  const branchTrustEntries = useMemo(
    () => buildBranchTrustEntries(forensics?.branchTrust),
    [forensics?.branchTrust],
  );

  const graphRef = React.useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const el = graphRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 600, height: 400 };
      setGraphSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab]); // Recalculate size when tab changes

  if (!traceId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-tight">
        <p className="text-[#717182] font-medium text-[13px]">TRACE_ID отсутствует.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-[13px]">Декодирование пакетов телеметрии...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 font-sans">
        <div className="max-w-xl mx-auto bg-white border border-black/10 rounded-2xl p-8 flex items-start gap-6">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#030213]">Отказ в расшифровке идентификатора трассы</h1>
            <p className="mt-2 text-[#717182] leading-relaxed text-[13px]">
              <span className="font-mono text-red-600 block mb-1">ERR_TRACE_NOT_FOUND:</span> {error}
            </p>
            <Link
              href="/control-tower"
              className="mt-6 inline-block px-5 py-2.5 bg-[#030213] text-white text-[13px] font-medium rounded-lg hover:bg-black transition-colors"
            >
              Вернуться в пульт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* C-Pattern Header */}
      <div className="bg-white border-b border-black/10 px-10 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/control-tower" className="text-[11px] font-medium uppercase tracking-widest text-[#717182] hover:text-[#030213] transition-colors">
              Контроль и надёжность
            </Link>
            <span className="text-[11px] font-medium text-[#717182]">/</span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#030213]">Форензика трассы</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-black/5 shrink-0">
                  <FileSearch size={20} className="text-[#030213]" />
                </div>
                <div>
                  <h1 className="text-2xl font-medium text-[#030213] tracking-tight">Разбор трассы</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-mono text-[#717182] bg-slate-100 px-2 py-0.5 rounded border border-black/5">
                      {traceId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Проверено
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                onClick={onReplay}
                disabled={replayBusy}
                className="px-6 py-2.5 bg-white border border-black/10 text-[#030213] hover:bg-slate-50 text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={16} className={replayBusy ? "animate-pulse text-amber-500" : "text-[#030213]"} />
                {replayBusy ? 'Симуляция...' : 'Повтор трассы (песочница)'}
              </button>
              {replayError && <p className="text-[11px] font-mono text-red-600 max-w-[250px] text-right">{replayError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10">
        <div className="flex gap-2 border-b border-black/10 mb-8">
          <button
            onClick={() => setActiveTab('forensics')}
            className={clsx(
              "px-6 py-3 text-[13px] font-medium uppercase tracking-widest transition-all border-b-2 -mb-[1px]",
              activeTab === 'forensics' ? "border-[#030213] text-[#030213]" : "border-transparent text-[#717182] hover:text-[#030213]"
            )}
          >
            Хронология и доказательства
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            className={clsx(
              "px-6 py-3 text-[13px] font-medium uppercase tracking-widest transition-all border-b-2 -mb-[1px]",
              activeTab === 'topology' ? "border-[#030213] text-[#030213]" : "border-transparent text-[#717182] hover:text-[#030213]"
            )}
          >
            Граф топологии (DAG)
          </button>
        </div>

        {activeTab === 'forensics' && (
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
            {forensics?.memoryLane && (
              <div className="border-b border-black/5 bg-slate-50 px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <MemoryLaneColumn title="Вспомнено" items={forensics.memoryLane.recalled.map((item) => ({ ...item, meta: `${Math.round(item.confidence * 100)}%` }))} />
                  <MemoryLaneColumn title="Использовано" items={forensics.memoryLane.used.map((item) => ({ ...item, meta: `${Math.round(item.confidence * 100)}%` }))} />
                  <MemoryLaneColumn title="Отброшено" items={forensics.memoryLane.dropped.map((item) => ({ kind: item.kind, label: item.label, meta: item.reason }))} />
                </div>
                {forensics.memoryLane.escalationReason && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                    Причина эскалации: {forensics.memoryLane.escalationReason}
                  </div>
                )}
              </div>
            )}
            {forensics?.semanticIngressFrame && (
              <div className="border-b border-black/5 bg-white px-6 py-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-[14px] font-medium text-[#030213]">Semantic Ingress Frame</h2>
                      <p className="mt-1 text-[12px] text-[#717182]">
                        Канонический ingress-объект до orchestration: режим запроса, owner-операция и обязательные пробелы контекста.
                      </p>
                    </div>
                    {forensics.semanticIngressFrame.proofSliceId && (
                      <span className="inline-flex items-center rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#717182]">
                        {forensics.semanticIngressFrame.proofSliceId}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <TrustMetaCard
                      label="Режим"
                      value={formatIngressInteractionMode(forensics.semanticIngressFrame.interactionMode)}
                    />
                    <TrustMetaCard
                      label="Форма запроса"
                      value={formatIngressRequestShape(forensics.semanticIngressFrame.requestShape)}
                    />
                    <TrustMetaCard
                      label="Риск"
                      value={formatIngressRiskClass(forensics.semanticIngressFrame.riskClass)}
                      tone={resolveIngressRiskTone(forensics.semanticIngressFrame.riskClass)}
                    />
                    <TrustMetaCard
                      label="Источник решения"
                      value={formatIngressSource(forensics.semanticIngressFrame.requestedOperation.source)}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
                    <IngressFrameCard frame={forensics.semanticIngressFrame} />
                    <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">
                        Кандидаты домена
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {forensics.semanticIngressFrame.domainCandidates.length > 0 ? (
                          forensics.semanticIngressFrame.domainCandidates.map((candidate) => (
                            <span
                              key={`${candidate.source}:${candidate.domain}:${candidate.ownerRole ?? 'none'}`}
                              className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#4a4a5a]"
                            >
                              {candidate.domain} • {candidate.ownerRole ?? 'no-owner'} • {Math.round(candidate.score * 100)}%
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] text-[#717182]">Кандидаты не зафиксированы.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(forensics?.summary || branchTrustEntries.length > 0) && (
              <div className="border-b border-black/5 bg-white px-6 py-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-[14px] font-medium text-[#030213]">Контур доверия веток</h2>
                      <p className="mt-1 text-[12px] text-[#717182]">
                        Вердикты по веткам, задержка trust-gate и бюджетный вердикт для финальной композиции ответа.
                      </p>
                    </div>
                    {forensics?.summary?.trustLatencyProfile && (
                      <span className="inline-flex items-center rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#717182]">
                        {formatTrustLatencyProfile(forensics.summary.trustLatencyProfile)}
                      </span>
                    )}
                  </div>

                  {forensics?.summary && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <TrustStatCard
                          label="Подтверждено"
                          value={formatNullableCount(forensics.summary.verifiedBranchCount)}
                          tone="success"
                        />
                        <TrustStatCard
                          label="Частично"
                          value={formatNullableCount(forensics.summary.partialBranchCount)}
                          tone="warning"
                        />
                        <TrustStatCard
                          label="Неподтверждено"
                          value={formatNullableCount(forensics.summary.unverifiedBranchCount)}
                          tone="warning"
                        />
                        <TrustStatCard
                          label="Конфликт"
                          value={formatNullableCount(forensics.summary.conflictedBranchCount)}
                          tone="error"
                        />
                        <TrustStatCard
                          label="Отклонено"
                          value={formatNullableCount(forensics.summary.rejectedBranchCount)}
                          tone="error"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <TrustMetaCard
                          label="Задержка trust-gate"
                          value={formatLatency(forensics.summary.trustGateLatencyMs)}
                          tone={resolveBudgetTone(forensics.summary.trustLatencyWithinBudget)}
                        />
                        <TrustMetaCard
                          label="Бюджет задержки"
                          value={formatLatency(forensics.summary.trustLatencyBudgetMs)}
                        />
                        <TrustMetaCard
                          label="Вердикт бюджета"
                          value={formatBudgetVerdict(forensics.summary.trustLatencyWithinBudget)}
                          tone={resolveBudgetTone(forensics.summary.trustLatencyWithinBudget)}
                        />
                        <TrustMetaCard
                          label="Сигналы качества"
                          value={`${forensics.qualityAlerts.length}`}
                          tone={forensics.qualityAlerts.length > 0 ? 'warning' : 'neutral'}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                        Вердикты веток
                      </p>
                      <span className="text-[11px] text-[#717182]">
                        {branchTrustEntries.length > 0 ? `${branchTrustEntries.length} веток` : 'ветки не зафиксированы'}
                      </span>
                    </div>

                    {branchTrustEntries.length > 0 ? (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {branchTrustEntries.map((entry) => {
                          const summary =
                            entry.composition?.summary ??
                            entry.result?.summary ??
                            'Краткий итог ветки не сохранён.';
                          const disclosure = uniqueStrings([
                            ...entry.assessment.reasons,
                            ...(entry.composition?.disclosure ?? []),
                            ...(entry.result?.data_gaps ?? []),
                          ]);

                          return (
                            <div
                              key={entry.assessment.branch_id}
                              className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">
                                    {entry.assessment.source_agent} • {entry.result?.domain ?? 'branch'}
                                  </p>
                                  <h3 className="mt-1 text-[14px] font-medium text-[#030213]">
                                    {entry.assessment.branch_id}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <VerdictBadge verdict={entry.assessment.verdict} />
                                  <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-mono text-[#717182]">
                                    оценка {Math.round(entry.assessment.score * 100)}%
                                  </span>
                                  {entry.assessment.requires_cross_check && (
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                                      перепроверка
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="mt-3 text-[13px] leading-relaxed text-[#030213]">
                                {summary}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <TrustMetaCard
                                  label="Источники"
                                  value={`${entry.result?.evidence_refs.length ?? 0}`}
                                />
                                <TrustMetaCard
                                  label="Пробелы"
                                  value={`${entry.result?.data_gaps.length ?? 0}`}
                                  tone={
                                    (entry.result?.data_gaps.length ?? 0) > 0 ? 'warning' : 'neutral'
                                  }
                                />
                                <TrustMetaCard
                                  label="Свежесть"
                                  value={formatFreshnessStatus(entry.result?.freshness.status)}
                                  tone={
                                    entry.result?.freshness.status === 'STALE'
                                      ? 'error'
                                      : entry.result?.freshness.status === 'FRESH'
                                        ? 'success'
                                        : 'neutral'
                                  }
                                />
                              </div>

                              {disclosure.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {disclosure.map((item) => (
                                    <span
                                      key={`${entry.assessment.branch_id}:${item}`}
                                      className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#4a4a5a]"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-4 text-[13px] text-[#717182]">
                        Артефакты доверия веток для этой трассы не сохранены.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="p-6 border-b border-black/5 bg-slate-50 flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-[#030213] flex items-center gap-2">
                <Clock size={16} className="text-[#717182]" />
                Хронология вызовов агентов
              </h2>
            </div>
            <div className="p-0">
              {forensics?.timeline?.length ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-black/5">
                      <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-widest text-[#717182] w-[30%]">Фаза / Функция</th>
                      <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-widest text-[#717182] w-[20%]">Длительность</th>
                      <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-widest text-[#717182] w-[50%]">Доказательства (ссылки)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {forensics.timeline.map((entry, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-medium text-[#030213]">{String(entry.phase ?? entry.label ?? '—')}</span>
                        </td>
                        <td className="px-6 py-4">
                          {entry.durationMs != null ? (
                            <span className="text-[12px] font-mono text-[#717182] bg-slate-50 px-2 py-1 rounded border border-black/5">{Number(entry.durationMs)} ms</span>
                          ) : (
                            <span className="text-[12px] text-[#717182]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {entry.evidenceRefs.map((_, idx: number) => (
                                <span key={idx} className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                  ДОК_{idx + 1}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#717182] italic">Отсутствуют</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-[13px] text-[#717182]">Журнал изоляции пуст или недоступен.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'topology' && (
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02] flex flex-col h-[700px]">
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
              <h2 className="text-[14px] font-medium text-[#030213] flex items-center gap-2">
                <Box size={16} className="text-[#717182]" />
                Визуализация DAG (Агенты)
              </h2>
              {topology && (
                <p className="text-[12px] text-[#717182] font-mono">
                  Узлы: {topology.nodes.length} | Задержка: <span className="font-medium text-[#030213]">{topology.totalDurationMs} ms</span>
                </p>
              )}
            </div>
            <div className="flex-1 bg-slate-50 relative w-full h-full" ref={graphRef}>
              {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  graphData={graphData}
                  width={graphSize.w}
                  height={graphSize.h}
                  nodeLabel={(n) => {
                    const o = n as { name?: string; kind?: string; durationMs?: number; critical?: boolean };
                    return `${o.name ?? ''} (${o.kind ?? ''}) ${o.durationMs ?? 0}ms${o.critical ? ' [КРИТИЧЕСКИЙ_ПУТЬ]' : ''}`;
                  }}
                  nodeColor={(n) => ((n as { critical?: boolean }).critical ? '#dc2626' : '#030213')} // Red-600 or Ink Black
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const n = node as { x?: number; y?: number; name?: string; critical?: boolean };
                    const label = n.name ?? (node as { id?: string }).id ?? '';
                    const critical = n.critical;
                    const x = n.x ?? 0;
                    const y = n.y ?? 0;
                    const fontSize = 11 / globalScale; // Scaled font size

                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(x, y, critical ? 8 : 4.5, 0, 2 * Math.PI);
                    ctx.fillStyle = critical ? '#dc2626' : '#2563eb'; // Red or Blue for node dot
                    ctx.fill();

                    // Institutional Grade Text rendering
                    ctx.font = `${critical ? 'bold ' : ''}${fontSize}px 'Geist', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Background for text readability
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4) as [number, number];
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White backing
                    ctx.fillRect(x - bckgDimensions[0] / 2, y + 10 - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                    // Text color
                    ctx.fillStyle = critical ? '#dc2626' : '#030213';
                    ctx.fillText(label, x, y + 10);
                  }}
                  linkColor={(link) => {
                    // Critical path link coloring (optional advanced feature)
                    return 'rgba(3, 2, 19, 0.15)'; // #030213 with 15% opacity
                  }}
                  linkWidth={(link) => 1.5}
                  linkDirectionalArrowLength={3.5}
                  linkDirectionalArrowRelPos={1}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[13px] text-[#717182]">Нет данных топологии для данного графа.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryLaneColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ kind: string; label: string; meta: string }>;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? items.map((item) => (
          <div key={`${title}:${item.kind}:${item.label}`} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[#717182]">{item.kind}</span>
              <span className="text-[11px] font-mono text-[#717182]">{item.meta}</span>
            </div>
            <p className="mt-1 text-[12px] text-[#030213]">{item.label}</p>
          </div>
        )) : (
          <p className="text-[12px] text-[#717182]">Нет элементов.</p>
        )}
      </div>
    </div>
  );
}

function IngressFrameCard({
  frame,
}: {
  frame: TraceForensicsSemanticIngressFrameDto;
}) {
  const entityLabels = frame.entities.map((entity) => `${entity.kind}: ${entity.value}`);
  const missingSlots = frame.missingSlots.length > 0 ? frame.missingSlots.join(', ') : 'Нет';

  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">
        Нормализованная операция
      </p>
      <h3 className="mt-2 text-[15px] font-medium text-[#030213]">
        {frame.requestedOperation.ownerRole ?? 'unknown-owner'} • {frame.requestedOperation.intent ?? 'unknown-intent'}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#030213]">
        {frame.explanation}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TrustMetaCard
          label="Цель"
          value={frame.goal ?? 'не определена'}
        />
        <TrustMetaCard
          label="Подтверждение"
          value={frame.requiresConfirmation ? 'требуется' : 'не требуется'}
          tone={frame.requiresConfirmation ? 'warning' : 'neutral'}
        />
        <TrustMetaCard
          label="Источник действия"
          value={formatIngressOperationAuthority(frame.operationAuthority)}
          tone={
            frame.operationAuthority === 'direct_user_command'
              ? 'success'
              : frame.requiresConfirmation
                ? 'warning'
                : 'neutral'
          }
        />
        <TrustMetaCard
          label="Недостающие слоты"
          value={missingSlots}
          tone={frame.missingSlots.length > 0 ? 'warning' : 'neutral'}
        />
        <TrustMetaCard
          label="Уверенность"
          value={formatConfidenceBand(frame.confidenceBand)}
        />
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">
          Извлечённые сущности
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {entityLabels.length > 0 ? (
            entityLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#4a4a5a]"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-[#717182]">Сущности не выделены.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TrustStatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral';
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{label}</p>
      <p
        className={clsx(
          'mt-2 text-[22px] font-medium tracking-tight',
          tone === 'success'
            ? 'text-emerald-700'
            : tone === 'warning'
              ? 'text-amber-700'
              : tone === 'error'
                ? 'text-red-700'
                : 'text-[#030213]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TrustMetaCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral';
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{label}</p>
      <p
        className={clsx(
          'mt-2 text-[13px] font-medium',
          tone === 'success'
            ? 'text-emerald-700'
            : tone === 'warning'
              ? 'text-amber-700'
              : tone === 'error'
                ? 'text-red-700'
                : 'text-[#030213]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: BranchVerdict }) {
  return (
    <span
      className={clsx(
        'rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide',
        verdict === 'VERIFIED'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : verdict === 'PARTIAL'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : verdict === 'CONFLICTED' || verdict === 'REJECTED'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-slate-200 bg-slate-100 text-slate-700',
      )}
    >
      {formatVerdict(verdict)}
    </span>
  );
}

function buildBranchTrustEntries(
  branchTrust: TraceForensicsResponseDto['branchTrust'] | null | undefined,
): BranchTrustEntry[] {
  if (!branchTrust) {
    return [];
  }
  const resultsById = new Map(
    branchTrust.branchResults.map((result) => [result.branch_id, result]),
  );
  const compositionsById = new Map(
    branchTrust.branchCompositions.map((composition) => [composition.branch_id, composition]),
  );

  return branchTrust.branchTrustAssessments.map((assessment) => ({
    assessment,
    result: resultsById.get(assessment.branch_id),
    composition: compositionsById.get(assessment.branch_id),
  }));
}

function formatVerdict(verdict: BranchVerdict): string {
  switch (verdict) {
    case 'VERIFIED':
      return 'подтверждено';
    case 'PARTIAL':
      return 'частично';
    case 'UNVERIFIED':
      return 'неподтверждено';
    case 'CONFLICTED':
      return 'конфликт';
    case 'REJECTED':
      return 'отклонено';
    default:
      return verdict;
  }
}

function formatIngressInteractionMode(mode: string): string {
  if (mode === 'task_request') {
    return 'операционный запрос';
  }
  if (mode === 'information_request') {
    return 'информационный запрос';
  }
  if (mode === 'workflow_resume') {
    return 'продолжение сценария';
  }
  return 'свободный диалог';
}

function formatIngressRequestShape(shape: string): string {
  if (shape === 'single_intent') {
    return 'один intent';
  }
  if (shape === 'clarification_resume') {
    return 'resume clarification';
  }
  if (shape === 'composite') {
    return 'составной запрос';
  }
  return 'не определена';
}

function formatIngressRiskClass(riskClass: string): string {
  if (riskClass === 'safe_read') {
    return 'безопасное чтение';
  }
  if (riskClass === 'write_candidate') {
    return 'write-candidate';
  }
  if (riskClass === 'high_risk_write') {
    return 'high-risk write';
  }
  return 'не определён';
}

function resolveIngressRiskTone(
  riskClass: string,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (riskClass === 'safe_read') {
    return 'success';
  }
  if (riskClass === 'write_candidate') {
    return 'warning';
  }
  if (riskClass === 'high_risk_write') {
    return 'error';
  }
  return 'neutral';
}

function formatIngressSource(source: string): string {
  if (source === 'legacy_contracts') {
    return 'legacy contracts';
  }
  if (source === 'semantic_router_primary') {
    return 'semantic router primary';
  }
  if (source === 'semantic_router_shadow') {
    return 'semantic router shadow';
  }
  if (source === 'explicit_tool_call') {
    return 'explicit tool call';
  }
  return 'clarification resume';
}

function formatIngressOperationAuthority(authority: string): string {
  if (authority === 'direct_user_command') {
    return 'прямая пользовательская команда';
  }
  if (authority === 'workflow_resume') {
    return 'возобновление подтверждённого workflow';
  }
  if (authority === 'delegated_or_autonomous') {
    return 'делегированное или автономное действие';
  }
  return 'не определён';
}

function formatConfidenceBand(band: string): string {
  if (band === 'high') {
    return 'высокая';
  }
  if (band === 'medium') {
    return 'средняя';
  }
  return 'низкая';
}

function formatTrustLatencyProfile(profile: string | null | undefined): string {
  if (profile === 'HAPPY_PATH') {
    return 'обычный путь';
  }
  if (profile === 'MULTI_SOURCE_READ') {
    return 'чтение из нескольких источников';
  }
  if (profile === 'CROSS_CHECK_TRIGGERED') {
    return 'селективная перепроверка';
  }
  return 'trust-профиль';
}

function formatBudgetVerdict(withinBudget: boolean | null | undefined): string {
  if (withinBudget === true) {
    return 'в бюджете';
  }
  if (withinBudget === false) {
    return 'выше бюджета';
  }
  return 'ожидание';
}

function resolveBudgetTone(
  withinBudget: boolean | null | undefined,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (withinBudget === true) {
    return 'success';
  }
  if (withinBudget === false) {
    return 'error';
  }
  return 'neutral';
}

function formatLatency(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)} ms` : 'ожидание';
}

function formatNullableCount(value: number | null | undefined): string {
  return typeof value === 'number' ? `${value}` : '—';
}

function formatFreshnessStatus(status: string | null | undefined): string {
  if (status === 'FRESH') {
    return 'свежее';
  }
  if (status === 'STALE') {
    return 'просрочено';
  }
  return 'неизвестно';
}

function uniqueStrings(values: string[]): string[] {
  return values.filter((value, index) => value.trim().length > 0 && values.indexOf(value) === index);
}

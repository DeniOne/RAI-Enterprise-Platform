'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui';

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

interface ForensicsData {
  summary: { traceId: string; totalDurationMs?: number };
  timeline: Array<{ phase: string; label?: string; durationMs?: number; evidenceRefs?: unknown[] }>;
  qualityAlerts: unknown[];
}

export default function TraceForensicsPage() {
  const params = useParams<{ traceId: string }>();
  const router = useRouter();
  const traceId = useMemo(() => String(params?.traceId ?? ''), [params]);

  const [timeline, setTimeline] = useState<unknown | null>(null);
  const [forensics, setForensics] = useState<ForensicsData | null>(null);
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
        const [tRes, fRes, topRes] = await Promise.all([
          api.explainability.traceTimeline(traceId),
          api.explainability.traceForensics(traceId),
          api.explainability.traceTopology(traceId),
        ]);
        if (cancelled) return;
        setTimeline(tRes.data);
        setForensics(fRes.data);
        setTopology(topRes.data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? 'Ошибка загрузки');
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
        setReplayError('Replay выполнен, новый traceId не получен');
      }
    } catch (e) {
      setReplayError((e as Error).message ?? 'Replay недоступен (требуется ADMIN)');
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
  }, []);

  if (!traceId) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <p>traceId не указан</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <p>Загрузка трейса…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <a href="/control-tower" className="text-sm text-sky-400 hover:underline">← Control Tower</a>
          <h1 className="mt-2 text-xl font-semibold text-white">Трейс: {traceId.slice(0, 20)}…</h1>
        </div>
        <Button
          onClick={onReplay}
          disabled={replayBusy}
          className="rounded border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {replayBusy ? 'Replay…' : 'Replay Trace'}
        </Button>
      </div>
      {replayError && <p className="mb-4 text-sm text-red-400">{replayError}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border-zinc-700 bg-zinc-900/80">
          <TabsTrigger value="forensics" className="data-[state=active]:text-white data-[state=active]:border-zinc-500">
            Forensics
          </TabsTrigger>
          <TabsTrigger value="topology" className="data-[state=active]:text-white data-[state=active]:border-zinc-500">
            Topology Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forensics" className="mt-6">
          <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-zinc-200">Timeline & Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {forensics?.timeline?.length ? (
                <ul className="space-y-3">
                  {forensics.timeline.map((entry: Record<string, unknown>, i: number) => (
                    <li
                      key={i}
                      className="rounded border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-zinc-200">{String(entry.phase ?? entry.label ?? '—')}</span>
                      {entry.durationMs != null && (
                        <span className="ml-2 text-zinc-500">{Number(entry.durationMs)} ms</span>
                      )}
                      {Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length > 0 && (
                        <span className="ml-2 text-zinc-500">evidence: {entry.evidenceRefs.length}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Нет данных таймлайна</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topology" className="mt-6">
          <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-zinc-200">Topology Map</CardTitle>
              {topology && (
                <p className="mt-1 text-xs text-zinc-500">
                  Критический путь подсвечен. Всего {topology.nodes.length} узлов, {topology.totalDurationMs} ms
                </p>
              )}
            </CardHeader>
            <CardContent>
              {graphData.nodes.length > 0 ? (
                <div ref={graphRef} className="h-[400px] w-full overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900">
                  <ForceGraph2D
                    graphData={graphData}
                    width={graphSize.w}
                    height={graphSize.h}
                    nodeLabel={(n) => {
                      const o = n as { name?: string; kind?: string; durationMs?: number; critical?: boolean };
                      return `${o.name ?? ''} (${o.kind ?? ''}) ${o.durationMs ?? 0}ms${o.critical ? ' [critical]' : ''}`;
                    }}
                    nodeColor={(n) => ((n as { critical?: boolean }).critical ? '#ef4444' : '#3b82f6')}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const n = node as { x?: number; y?: number; name?: string; critical?: boolean };
                      const label = n.name ?? (node as { id?: string }).id ?? '';
                      const critical = n.critical;
                      const x = n.x ?? 0;
                      const y = n.y ?? 0;
                      const fontSize = 12 / globalScale;
                      ctx.font = `${critical ? 'bold ' : ''}${fontSize}px sans-serif`;
                      ctx.fillStyle = critical ? '#ef4444' : '#3b82f6';
                      ctx.beginPath();
                      ctx.arc(x, y, critical ? 8 : 5, 0, 2 * Math.PI);
                      ctx.fill();
                      ctx.fillStyle = '#e4e4e7';
                      ctx.textAlign = 'center';
                      ctx.fillText(label, x, y + 14);
                    }}
                    linkColor={() => 'rgba(113, 113, 122, 0.5)'}
                  />
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Нет данных топологии</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type IncidentFeedItem, type GovernanceCountersDto } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

const SEVERITY_ORDER = ['HIGH', 'MEDIUM', 'LOW'];

export default function GovernanceSecurityPage() {
  const [counters, setCounters] = useState<GovernanceCountersDto | null>(null);
  const [incidents, setIncidents] = useState<IncidentFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveComment, setResolveComment] = useState('');

  const load = () => {
    Promise.all([api.governance.counters(), api.governance.incidentsFeed({ limit: 100 })])
      .then(([cRes, iRes]) => {
        setCounters(cRes.data);
        setIncidents(iRes.data);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = (id: string) => {
    const comment = resolveComment.trim();
    if (!comment) return;
    setResolvingId(id);
    api.governance
      .resolveIncident(id, comment)
      .then(() => {
        setResolveComment('');
        load();
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setResolvingId(null));
  };

  const filtered = severityFilter === 'ALL'
    ? incidents
    : incidents.filter((i) => i.severity === severityFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Governance & Security</h1>
        <p className="mt-2">Загрузка…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Governance & Security</h1>
        <p className="mt-2 text-red-400">{error}</p>
        <p className="mt-1 text-sm text-zinc-500">Доступ: только ADMIN.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
      <h1 className="text-2xl font-semibold text-white">Governance & Security</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">Счётчики безопасности, лента инцидентов, разрешение инцидентов. Доступ: ADMIN.</p>

      {/* Governance Counters */}
      <Card className="mb-8 border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-zinc-200">Governance Counters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
            <p className="text-xs uppercase text-zinc-500">Tenant Isolation (попытки кросс-тенанта)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">{counters?.crossTenantBreach ?? 0}</p>
          </div>
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
            <p className="text-xs uppercase text-zinc-500">SensitiveDataFilter (PII заблокировано)</p>
            <p className="mt-1 text-2xl font-semibold text-sky-400">{counters?.piiLeak ?? 0}</p>
          </div>
          {counters?.byType && Object.keys(counters.byType).length > 0 && (
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 sm:col-span-2">
              <p className="text-xs uppercase text-zinc-500">По типам</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {Object.entries(counters.byType).map(([type, n]) => (
                  <li key={type} className="rounded bg-zinc-700/50 px-2 py-1 text-sm">
                    {type}: <span className="font-medium text-zinc-200">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents Feed */}
      <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-zinc-200">Incidents Feed</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Комментарий для Resolve"
              value={resolveComment}
              onChange={(e) => setResolveComment(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 w-48"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
          >
            <option value="ALL">Все</option>
            {SEVERITY_ORDER.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">Нет инцидентов</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((inc) => (
                <li
                  key={inc.id}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="rounded px-2 py-0.5 text-xs font-medium text-zinc-400">
                        {inc.incidentType}
                      </span>
                      <span className={`ml-2 rounded px-2 py-0.5 text-xs ${
                        inc.severity === 'HIGH' ? 'bg-red-900/50 text-red-300' :
                        inc.severity === 'MEDIUM' ? 'bg-amber-900/50 text-amber-300' :
                        'bg-zinc-600/50 text-zinc-300'
                      }`}>
                        {inc.severity}
                      </span>
                      {inc.resolvedAt && (
                        <span className="ml-2 text-xs text-emerald-400">Решён</span>
                      )}
                      <p className="mt-1 text-sm text-zinc-400">
                        {new Date(inc.createdAt).toLocaleString('ru')}
                      </p>
                      {inc.traceId && (
                        <Link
                          href={`/control-tower/trace/${inc.traceId}`}
                          className="mt-1 inline-block text-sm text-sky-400 hover:underline"
                        >
                          Trace: {inc.traceId.slice(0, 12)}…
                        </Link>
                      )}
                    </div>
                    {!inc.resolvedAt && (
                      <Button
                        size="default"
                        onClick={() => resolve(inc.id)}
                        disabled={!resolveComment.trim() || resolvingId === inc.id}
                      >
                        {resolvingId === inc.id ? '…' : 'Resolve'}
                      </Button>
                    )}
                  </div>
                  {inc.resolveComment && (
                    <p className="mt-2 border-t border-zinc-700/50 pt-2 text-xs text-zinc-500">
                      Решение: {inc.resolveComment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts / Auto-Runbooks placeholder */}
      <Card className="mt-8 border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-zinc-200">Security Alerts (Auto-Runbooks)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Запущенные скрипты реагирования (например, Quarantine для агента) отображаются в деталях инцидента (details.runbookTriggered). В будущем — отдельная лента.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

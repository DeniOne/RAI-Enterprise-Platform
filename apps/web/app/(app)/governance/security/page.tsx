'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type IncidentFeedItem, type GovernanceCountersDto } from '@/lib/api';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, Eye, CheckCircle2, Search, FileText } from 'lucide-react';
import { clsx } from 'clsx';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-red-600 rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-[13px]">Сбор данных Sentinel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center font-sans">
        <div className="max-w-xl w-full bg-white border border-black/10 rounded-2xl p-10 flex items-start gap-6">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#030213]">Отклонение доступа R4</h1>
            <p className="mt-2 text-[#717182] text-[13px] leading-relaxed">
              <span className="font-mono text-red-600 block mb-1">ERR_FORBIDDEN:</span>
              Вы не обладаете клиренсом Audit/Executive для просмотра логов изоляции. Код ошибки инстанциирован в Ledger: <br /> {error}.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-5 py-2.5 bg-white border border-black/10 text-[#030213] text-[13px] font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#030213] font-sans pb-32">
      {/* Header — Белая Канва */}
      <div className="bg-white border-b border-black/10 px-10 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-black/5">
                <ShieldAlert size={16} className="text-[#030213]" />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">Governance & Sentinel</span>
            </div>
            <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Безопасность и Доверие</h1>
            <p className="text-sm text-[#717182] max-w-2xl leading-relaxed">
              Среда управления рисками (Risk-first priority). Мониторинг изоляции тенантов, PII инциденты и операционный аудит системы Sentinel.
            </p>
          </div>
          <div className="flex">
            <div className="flex items-center gap-2 px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest">Active Audit</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10">
        {/* Governance Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <CounterBox
            label="Изоляция тенантов"
            value={counters?.crossTenantBreach ?? 0}
            desc="События кросс-тенанта"
            icon={<Fingerprint size={20} />}
          />
          <CounterBox
            label="Sentinel: PII Guard"
            value={counters?.piiLeak ?? 0}
            desc="Заблокировано данных (R3)"
            icon={<Lock size={20} />}
          />
          {counters?.byType && Object.entries(counters.byType).map(([type, n]) => (
            <CounterBox
              key={type}
              label={type}
              value={n as number}
              desc="Срабатываний политик"
              icon={<Eye size={20} />}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* C-Pattern: Табличный вывод инцидентов */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-medium text-[#030213] tracking-tight flex items-center gap-2">
                <FileText size={20} className="text-[#717182]" />
                Регистр Инцидентов
              </h2>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-black/5">
                {['ALL', ...SEVERITY_ORDER].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={clsx(
                      "px-4 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-widest transition-all",
                      severityFilter === s ? "bg-white text-[#030213] shadow-sm border border-black/5" : "text-[#717182] hover:text-[#030213]"
                    )}
                  >
                    {s === 'ALL' ? 'Все' : s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 bg-white border border-black/10 rounded-2xl flex flex-col items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500 mb-4" />
                <p className="text-[#030213] font-medium text-[15px]">Нулевой уровень угроз</p>
                <p className="text-[#717182] text-[13px] mt-1">Очередь инцидентов Sentinel пуста.</p>
              </div>
            ) : (
              <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black/10">
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-1/4">Escalation ID / Triage</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-2/4">Context (Muted Details)</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-1/4">Action / Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filtered.map(inc => {
                      const isHigh = inc.severity === 'HIGH';
                      const level = isHigh ? 'R4' : (inc.severity === 'MEDIUM' ? 'R3' : 'R2');

                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors align-top">
                          {/* Column 1: Info */}
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-2">
                              <RiskBadge level={level} />
                              <span className="text-[12px] font-mono text-[#030213] uppercase font-medium">{inc.incidentType}</span>
                              <span className="text-[11px] text-[#717182] font-mono">{new Date(inc.createdAt).toLocaleString('ru')}</span>
                            </div>
                          </td>

                          {/* Column 2: Context */}
                          <td className="px-6 py-5">
                            <div className="space-y-3">
                              {inc.resolvedAt ? (
                                <p className="text-[13px] text-[#030213] leading-relaxed">
                                  <span className="text-emerald-600 font-medium mr-1">\u2713 Resolved:</span>
                                  {inc.resolveComment}
                                </p>
                              ) : (
                                <p className="text-[13px] text-[#717182] leading-relaxed italic">
                                  Requires immediate quorum validation. Escalated to Security Ops.
                                </p>
                              )}
                              {inc.traceId && (
                                <div>
                                  <Link href={`/control-tower/trace/${inc.traceId}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-600 hover:underline">
                                    <Search size={12} />
                                    Forensic Trace: {inc.traceId.slice(0, 12)}...
                                  </Link>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Column 3: Edit Mode Action */}
                          <td className="px-6 py-5">
                            {inc.resolvedAt ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-emerald-600">
                                <Lock size={12} />
                                В Ledger
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  placeholder="Резолюция..."
                                  className="w-full bg-white border border-black/10 rounded-md px-3 py-2 text-[13px] text-[#030213] placeholder:text-[#717182] focus:border-black/30 outline-none transition-colors"
                                  value={resolveComment}
                                  onChange={(e) => setResolveComment(e.target.value)}
                                  onClick={() => setResolvingId(inc.id)}
                                />
                                {resolvingId === inc.id && (
                                  <button
                                    className="w-full bg-[#030213] hover:bg-black text-white text-[11px] font-medium rounded-md py-2 transition-colors disabled:opacity-50"
                                    onClick={() => resolve(inc.id)}
                                    disabled={!resolveComment.trim()}
                                  >
                                    Подтвердить
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar - B-Pattern Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-[#030213] tracking-tight">Reg Compliance</h2>

            <div className="bg-white border border-black/10 rounded-2xl p-6 space-y-6">
              <ComplianceRow id="RL-01" title="Tenant Isolation" status={counters?.crossTenantBreach === 0 ? 'Verified' : 'Breach'} />
              <ComplianceRow id="RL-04" title="PII Masking (Sentinel)" status={counters?.piiLeak === 0 ? 'Verified' : 'Breach'} />
              <ComplianceRow id="RL-07" title="A-Filter Validation" status="Active" isInfo />
            </div>

            <div className="p-4 bg-slate-100 border border-black/5 rounded-xl">
              <p className="text-[11px] text-[#717182] leading-relaxed">
                <span className="font-medium text-[#030213]">АУДИТ ТРЕЙЛ:</span> Резолюции инцидентов R3 и R4 записываются в неизменяемый лог и недоступны для удаления (Immutable Lock).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Утилитные Institutional Компоненты

function CounterBox({ label, value, desc, icon }: { label: string; value: number; desc: string; icon: React.ReactNode }) {
  // Institutional styling: no bright background gradients depending on value
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{label}</span>
        <div className="text-[#030213]/20">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-medium text-[#030213] tracking-tight font-mono">{value}</p>
        <p className="text-[11px] text-[#717182] mt-1">{desc}</p>
      </div>
    </div>
  );
}

function ComplianceRow({ id, title, status, isInfo }: { id: string; title: string; status: string; isInfo?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-[13px]">
        <div className="flex gap-2 items-center">
          <span className="text-[#717182] font-mono text-[10px]">{id}</span>
          <span className="font-medium text-[#030213]">{title}</span>
        </div>
        <span className={clsx(
          "font-mono text-[11px]",
          isInfo ? "text-blue-600" : (status === 'Verified' ? "text-emerald-600" : "text-red-600 font-medium")
        )}>{status}</span>
      </div>
      <div className="h-px bg-black/5 w-full mt-2" />
    </div>
  );
}

function RiskBadge({ level }: { level: 'R2' | 'R3' | 'R4' | 'Success' }) {
  const styles = {
    'R4': 'bg-red-50 text-red-700 border-red-200',
    'R3': 'bg-amber-50 text-amber-700 border-amber-200',
    'R2': 'bg-amber-50 text-amber-600 border-amber-200',
    'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={clsx("px-2 py-1 rounded-[4px] text-[10px] font-medium uppercase tracking-widest border inline-flex items-center gap-1.5 w-fit", styles[level])}>
      <div className={clsx(
        "w-1.5 h-1.5 rounded-full",
        level === 'R4' ? 'bg-red-500' :
          level === 'R3' ? 'bg-amber-500' :
            level === 'R2' ? 'bg-amber-400' : 'bg-emerald-500'
      )} />
      Risk {level}
    </span>
  );
}

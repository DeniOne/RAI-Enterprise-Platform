'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type AgentConfigsResponse, type AgentConfiguratorItem } from '@/lib/api';
import { Settings2, UserCog, Bot, ShieldCheck } from 'lucide-react';

const LLM_MODELS = ['GPT-4o', 'GPT-4o-mini', 'Claude-3.5-Sonnet', 'Claude-3-Opus'];
const CAPABILITY_OPTIONS = ['AgroToolsRegistry', 'FinanceToolsRegistry', 'RiskToolsRegistry', 'KnowledgeToolsRegistry'];
const KNOWN_ROLES = ['agronomist', 'economist', 'knowledge', 'monitoring'];

export default function AgentsPage() {
  const [configs, setConfigs] = useState<AgentConfigsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentConfiguratorItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.agents
      .getConfig()
      .then((r) => setConfigs(r.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-[#030213] rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-[13px]">Синхронизация effective runtime state...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center font-sans">
        <div className="max-w-xl w-full bg-white border border-black/10 rounded-2xl p-10 flex items-start gap-6">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0 border border-red-100">
            <UserCog size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#030213]">Отклонение доступа R4</h1>
            <p className="mt-2 text-[#717182] text-[13px] leading-relaxed">
              <span className="font-mono text-red-600 block mb-1">ERR_FORBIDDEN:</span>
              Вы не обладаете клиренсом Audit/Executive для конфигурации роя. <br /> {error}.
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

  const agents = configs?.agents ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-[#030213] font-sans pb-32">
      <div className="bg-white border-b border-black/10 px-10 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link href="/control-tower" className="text-[11px] font-medium uppercase tracking-widest text-[#717182] hover:text-[#030213] transition-colors">
                Control & Reliability
              </Link>
              <span className="text-[11px] font-medium text-[#717182]">/</span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#030213]">Agent Configurator</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-black/5">
                <Bot size={16} className="text-[#030213]" />
              </div>
              <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Agent Configurator</h1>
            </div>
            <p className="text-sm text-[#717182] max-w-3xl leading-relaxed mt-1">
              Surface читает effective runtime/governed state из registry-aware read model. Production change не происходит напрямую из формы: любые изменения проходят через change request, eval, canary и promote/rollback.
            </p>
          </div>
          <div className="flex">
            <button
              onClick={() => setCreating(true)}
              className="px-6 py-2.5 bg-[#030213] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings2 size={16} />
              Создать change request
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10 space-y-6">
        <div className="p-4 bg-white border border-black/10 rounded-2xl">
          <p className="text-[12px] text-[#717182] leading-relaxed">
            `Runtime source` показывает, откуда реально собран effective config (`global` / `tenant`). `Bindings source` показывает, authority ли это persisted bindings или legacy bootstrap fallback. `Tenant access` показывает, как текущий tenant реально видит агента в runtime, а не как это выглядит в локальном form state.
          </p>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-black/10">
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Agent / Role</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Runtime Truth</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Bindings / Access</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Capabilities / Tools</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] text-right">Governed Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {agents.map((agent) => (
                <tr key={agent.role} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <span className="text-[14px] font-medium text-[#030213] block">{agent.agentName}</span>
                      <span className="text-[11px] font-mono text-[#717182] block">{agent.role}</span>
                      <span className="text-[12px] text-[#717182] block">{agent.businessRole}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 text-[12px]">
                      <div className="font-mono text-[#030213]">{agent.runtime.llmModel}</div>
                      <div className="text-[#717182]">maxTokens: <span className="font-mono text-[#030213]">{agent.runtime.maxTokens}</span></div>
                      <Badge
                        tone={agent.runtime.isActive ? 'green' : 'slate'}
                        label={agent.runtime.isActive ? 'Runtime Active' : 'Runtime Disabled'}
                      />
                      <Badge tone="blue" label={`Runtime source: ${agent.runtime.source}`} />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 text-[12px]">
                      <Badge
                        tone={agent.runtime.bindingsSource === 'persisted' ? 'green' : 'amber'}
                        label={`Bindings: ${agent.runtime.bindingsSource}`}
                      />
                      <Badge
                        tone={
                          agent.tenantAccess.mode === 'DENIED'
                            ? 'red'
                            : agent.tenantAccess.mode === 'OVERRIDE'
                              ? 'amber'
                              : 'blue'
                        }
                        label={`Tenant access: ${agent.tenantAccess.mode}`}
                      />
                      <div className="text-[#717182]">
                        access source: <span className="font-mono text-[#030213]">{agent.tenantAccess.source}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-2">Capabilities</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.runtime.capabilities.map((capability) => (
                            <Tag key={capability} label={capability} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-2">Tools</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.runtime.tools.map((tool) => (
                            <Tag key={tool} label={tool} mono />
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(agent)}
                        className="px-4 py-1.5 border border-black/10 rounded-md text-[13px] font-medium text-[#030213] hover:bg-slate-50 transition-colors"
                      >
                        Создать change request
                      </button>
                      <div className="max-w-[220px] text-[11px] text-[#717182] leading-relaxed">
                        Instant toggle/write path отсутствует на этой поверхности намеренно.
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AgentEditor
          agent={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          setSaving={setSaving}
        />
      )}
      {creating && (
        <AgentEditor
          agent={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
          setSaving={setSaving}
          createMode
        />
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-[#030213] text-white text-[12px] rounded-lg shadow-lg">
          Change request отправляется в governed workflow...
        </div>
      )}
    </div>
  );
}

function AgentEditor({
  agent,
  onClose,
  onSaved,
  setSaving,
  createMode = false,
}: {
  agent: AgentConfiguratorItem | null;
  onClose: () => void;
  onSaved: () => void;
  setSaving: (v: boolean) => void;
  createMode?: boolean;
}) {
  const [role, setRole] = useState(agent?.role ?? '');
  const [name, setName] = useState(agent?.agentName ?? '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.runtime.systemPrompt ?? '');
  const [llmModel, setLlmModel] = useState(agent?.runtime.llmModel ?? 'GPT-4o-mini');
  const [maxTokens, setMaxTokens] = useState(agent?.runtime.maxTokens ?? 8000);
  const [capabilities, setCapabilities] = useState<string[]>(agent?.runtime.capabilities ?? []);
  const [tools, setTools] = useState<string[]>(agent?.runtime.tools ?? []);
  const [scope, setScope] = useState<'tenant' | 'global'>(agent?.runtime.source === 'global' ? 'global' : 'tenant');
  const [err, setErr] = useState<string | null>(null);

  const toggleCap = (cap: string) => {
    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]));
  };

  const save = () => {
    const effectiveRole = createMode ? role : agent?.role ?? role;
    if (!effectiveRole?.trim()) { setErr('Укажите роль'); return; }
    if (!name?.trim()) { setErr('Укажите название'); return; }
    setErr(null);
    setSaving(true);
    api.agents
      .createChangeRequest({
        name: name.trim(),
        role: effectiveRole,
        systemPrompt,
        llmModel,
        maxTokens,
        isActive: agent?.runtime.isActive ?? true,
        capabilities,
        tools,
      }, scope)
      .then(() => onSaved())
      .catch((e) => setErr((e as Error).message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm p-4 font-sans">
      <div className="h-full w-full max-w-xl bg-white rounded-3xl border border-black/10 shadow-2xl flex flex-col pt-8 pb-6 px-8 animate-in slide-in-from-right duration-300">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182] mb-1">
              {createMode ? 'Новый change request' : 'Governed update request'}
            </p>
            <h2 className="text-2xl font-medium text-[#030213] tracking-tight">
              {createMode ? 'Создать change request' : `Change request: ${agent?.agentName}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#717182] hover:text-[#030213] transition-colors p-2 -mr-2">
            ✕
          </button>
        </div>

        <div className="mb-5 p-4 bg-slate-50 border border-black/5 rounded-xl">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-[#030213] mt-0.5" />
            <p className="text-[12px] text-[#717182] leading-relaxed">
              Эта форма не пишет production config напрямую. Она создаёт governed request для eval - canary - promote/rollback.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">
              {err}
            </div>
          )}

          {createMode && (
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Роль (канонический registry role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
              >
                <option value="">— Выбрать системную роль —</option>
                {KNOWN_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Отображаемое имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Runtime model</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            >
              {LLM_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full min-h-[180px] rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCap(cap)}
                  className={`px-3 py-1.5 rounded-md border text-[12px] transition-colors ${
                    capabilities.includes(cap)
                      ? 'bg-[#030213] text-white border-[#030213]'
                      : 'bg-white text-[#030213] border-black/10 hover:bg-slate-50'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Tools (runtime authority target)</label>
            <input
              value={tools.join(', ')}
              onChange={(e) => setTools(e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] font-mono focus:border-black/30 outline-none"
              placeholder="generate_tech_map_draft, compute_deviations"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'tenant' | 'global')}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            >
              <option value="tenant">Tenant change request</option>
              <option value="global">Global change request</option>
            </select>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-black/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium border border-black/10 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#030213] text-white hover:bg-black transition-colors"
          >
            Отправить в governance
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'blue' | 'red' | 'slate' }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest border ${map[tone]}`}>
      {label}
    </span>
  );
}

function Tag({ label, mono = false }: { label: string; mono?: boolean }) {
  return (
    <span className={`px-2 py-1 rounded-md border border-black/10 bg-slate-50 text-[11px] text-[#030213] ${mono ? 'font-mono' : ''}`}>
      {label}
    </span>
  );
}

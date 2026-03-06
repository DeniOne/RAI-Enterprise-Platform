'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type AgentConfigItem } from '@/lib/api';
import { Settings2, UserCog, CheckCircle2, Bot } from 'lucide-react';
import clsx from 'clsx';

type AgentConfigs = { global: AgentConfigItem[]; tenantOverrides: AgentConfigItem[] };

const LLM_MODELS = ['GPT-4o', 'GPT-4o-mini', 'Claude-3.5-Sonnet', 'Claude-3-Opus'];
const CAPABILITY_OPTIONS = ['AgroToolsRegistry', 'FinanceToolsRegistry', 'RiskToolsRegistry', 'KnowledgeToolsRegistry'];
const KNOWN_ROLES = ['agronomist', 'economist', 'knowledge', 'monitoring'];

function effectiveAgent(global: AgentConfigItem[], overrides: AgentConfigItem[], role: string): AgentConfigItem | null {
  const ov = overrides.find((a) => a.role === role);
  if (ov) return ov;
  return global.find((a) => a.role === role) ?? null;
}

export default function AgentsPage() {
  const [configs, setConfigs] = useState<AgentConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentConfigItem | null>(null);
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

  const toggle = (role: string, isActive: boolean) => {
    api.agents
      .toggle(role, isActive)
      .then(() => load())
      .catch((e) => setError((e as Error).message));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-black/10 border-t-[#030213] rounded-full animate-spin" />
          <p className="text-[#717182] font-medium text-[13px]">Синхронизация профилей агентов...</p>
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

  const global = configs!.global;
  const overrides = configs!.tenantOverrides;
  const roles = [...new Set([...global.map((a) => a.role), ...overrides.map((a) => a.role)])];

  return (
    <div className="min-h-screen bg-slate-50 text-[#030213] font-sans pb-32">
      {/* Header — Белая Канва */}
      <div className="bg-white border-b border-black/10 px-10 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link href="/control-tower" className="text-[11px] font-medium uppercase tracking-widest text-[#717182] hover:text-[#030213] transition-colors">
                Control & Reliability
              </Link>
              <span className="text-[11px] font-medium text-[#717182]">/</span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#030213]">Agent Registry</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-black/5">
                <Bot size={16} className="text-[#030213]" />
              </div>
              <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Реестр агентов</h1>
            </div>
            <p className="text-sm text-[#717182] max-w-2xl leading-relaxed mt-1">
              Управление конфигурацией роя: промпты, модели, возможности. Переопределения для тенанта изолированы.
            </p>
          </div>
          <div className="flex">
            <button
              onClick={() => setCreating(true)}
              className="px-6 py-2.5 bg-[#030213] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings2 size={16} />
              Добавить переопределение
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10">
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-black/10">
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-[30%]">Swarm Agent / Role</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-[20%]">LLM Model</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-[20%]">Status / Scope</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] w-[30%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {roles.map((role) => {
                const agent = effectiveAgent(global, overrides, role);
                if (!agent) return null;
                const isOverride = overrides.some((a) => a.role === role);
                return (
                  <tr key={`${agent.role}-${agent.companyId ?? 'global'}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-medium text-[#030213] block">{agent.name}</span>
                      <span className="text-[11px] font-mono text-[#717182] mt-1 block">{agent.role}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-mono text-[#030213] bg-slate-100 px-2 py-1 rounded inline-block border border-black/5">
                        {agent.llmModel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 items-start">
                        {agent.isActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                            Disabled
                          </span>
                        )}
                        {isOverride ? (
                          <span className="text-[10px] font-medium uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Tenant Override
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Global Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <span className="text-[12px] font-medium text-[#717182] group-hover:text-[#030213] transition-colors">Вкл / Выкл</span>
                          <input
                            type="checkbox"
                            checked={agent.isActive}
                            onChange={(e) => toggle(agent.role, e.target.checked)}
                            className="h-4 w-4 rounded border-black/20 text-[#030213] focus:ring-[#030213] transition-colors"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setEditing(agent)}
                          className="px-4 py-1.5 border border-black/10 rounded-md text-[13px] font-medium text-[#030213] hover:bg-slate-50 transition-colors"
                        >
                          Настроить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AgentEditor
          agent={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          setSaving={setSaving}
        />
      )}
      {creating && (
        <AgentEditor
          agent={{
            id: '', name: '', role: '', systemPrompt: '',
            llmModel: 'GPT-4o-mini', maxTokens: 8000, isActive: true,
            companyId: null, capabilities: [], createdAt: '', updatedAt: '',
          }}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
          setSaving={setSaving}
          createMode
        />
      )}
    </div>
  );
}

// Side Panel B-Pattern 
function AgentEditor({
  agent,
  onClose,
  onSaved,
  setSaving,
  createMode = false,
}: {
  agent: AgentConfigItem;
  onClose: () => void;
  onSaved: () => void;
  setSaving: (v: boolean) => void;
  createMode?: boolean;
}) {
  const [role, setRole] = useState(agent.role);
  const [name, setName] = useState(agent.name);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [llmModel, setLlmModel] = useState(agent.llmModel);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens);
  const [capabilities, setCapabilities] = useState<string[]>(agent.capabilities ?? []);
  const [scope, setScope] = useState<'tenant' | 'global'>(agent.companyId ? 'tenant' : 'tenant');
  const [err, setErr] = useState<string | null>(null);

  const toggleCap = (cap: string) => {
    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]));
  };

  const save = () => {
    const r = createMode ? role : agent.role;
    if (!r?.trim()) { setErr('Укажите роль'); return; }
    if (!name?.trim()) { setErr('Укажите название'); return; }
    setErr(null);
    setSaving(true);
    api.agents
      .upsertConfig({ name: name.trim(), role: r, systemPrompt, llmModel, maxTokens, isActive: agent.isActive, capabilities }, scope)
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
              {createMode ? 'Новая конфигурация' : 'Редактирование'}
            </p>
            <h2 className="text-2xl font-medium text-[#030213] tracking-tight">{createMode ? 'Создать агента' : `Агент: ${agent.name}`}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#717182] hover:text-[#030213] transition-colors p-2 -mr-2">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">
              {err}
            </div>
          )}

          {createMode && (
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Роль (ID агента)</label>
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
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Отображаемое Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
              placeholder="Например: Агроном-Аналитик"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Language Model (LLM)</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] font-mono text-[#030213] focus:border-black/30 outline-none"
            >
              {LLM_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-medium text-[#717182]">System Prompt</label>
              <span className="text-[11px] font-mono text-[#717182] bg-slate-100 px-1.5 py-0.5 rounded">Markdown Supported</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-3 font-mono text-[12px] text-[#030213] focus:border-black/30 outline-none leading-relaxed resize-none"
              placeholder="Системные инструкции для LLM..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Макс. Токенов (Output)</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] font-mono text-[#030213] focus:border-black/30 outline-none"
              />
            </div>
            {!createMode && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Изоляция Конфига</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'tenant' | 'global')}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                >
                  <option value="tenant">Тенант (Локально)</option>
                  <option value="global">Global (Для всех)</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-3 block text-[13px] font-medium text-[#717182]">Разрешенные Инструменты (Capabilities)</label>
            <div className="flex flex-col gap-2.5">
              {CAPABILITY_OPTIONS.map((cap) => (
                <label key={cap} className="flex items-center gap-3 p-3 rounded-lg border border-black/5 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={capabilities.includes(cap)}
                      onChange={() => toggleCap(cap)}
                      className="peer appearance-none w-4 h-4 rounded border border-black/20 checked:bg-[#030213] checked:border-[#030213] transition-colors"
                    />
                    <CheckCircle2 size={12} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                  </div>
                  <span className="text-[13px] text-[#030213] font-medium">{cap}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/10 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-black/10 text-[#030213] text-[13px] font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={save}
            className="px-6 py-2.5 bg-[#030213] text-white text-[13px] font-medium rounded-lg hover:bg-black transition-colors"
          >
            Сохранить в Ledger
          </button>
        </div>
      </div>
    </div>
  );
}

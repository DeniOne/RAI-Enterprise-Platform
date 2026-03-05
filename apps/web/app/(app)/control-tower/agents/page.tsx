'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type AgentConfigItem } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

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
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Реестр агентов</h1>
        <p className="mt-2">Загрузка…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
        <h1 className="text-2xl font-semibold text-white">Реестр агентов</h1>
        <p className="mt-2 text-red-400">{error}</p>
      </div>
    );
  }

  const global = configs!.global;
  const overrides = configs!.tenantOverrides;
  const roles = [...new Set([...global.map((a) => a.role), ...overrides.map((a) => a.role)])];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-300">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/control-tower" className="text-sm text-sky-400 hover:underline">← Control Tower</Link>
        <h1 className="text-2xl font-semibold text-white">Реестр агентов</h1>
      </div>
      <p className="mt-1 mb-6 text-sm text-zinc-500">Управление конфигурацией роя: промпты, модели, возможности. Переопределения для тенанта отображаются отдельно.</p>

      {/* Список: глобальные + индикация переопределений */}
      <Card className="border-zinc-700/50 bg-zinc-900/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-200">Агенты</CardTitle>
          <Button variant="outline" size="default" onClick={() => setCreating(true)}>
            Добавить переопределение
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((role) => {
              const agent = effectiveAgent(global, overrides, role);
              if (!agent) return null;
              const isOverride = overrides.some((a) => a.role === role);
              return (
                <div
                  key={`${agent.role}-${agent.companyId ?? 'global'}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{agent.name}</span>
                    <span className="rounded bg-zinc-600/60 px-2 py-0.5 text-xs text-zinc-300">{agent.role}</span>
                    {isOverride && (
                      <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">Тенант</span>
                    )}
                    {!agent.companyId && (
                      <span className="rounded bg-zinc-600/40 px-2 py-0.5 text-xs text-zinc-400">Глобальный</span>
                    )}
                    <span className="text-sm text-zinc-500">{agent.llmModel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(agent)}
                      className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
                    >
                      Редактировать
                    </button>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Вкл</span>
                      <input
                        type="checkbox"
                        checked={agent.isActive}
                        onChange={(e) => toggle(agent.role, e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Редактор (модальное окно) */}
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
            id: '',
            name: '',
            role: '',
            systemPrompt: '',
            llmModel: 'GPT-4o-mini',
            maxTokens: 8000,
            isActive: true,
            companyId: null,
            capabilities: [],
            createdAt: '',
            updatedAt: '',
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
      .upsertConfig(
        {
          name: name.trim(),
          role: r,
          systemPrompt,
          llmModel,
          maxTokens,
          isActive: agent.isActive,
          capabilities,
        },
        scope
      )
      .then(() => onSaved())
      .catch((e) => setErr((e as Error).message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto border-zinc-600 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-200">{createMode ? 'Новое переопределение' : `Редактировать: ${agent.role}`}</CardTitle>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {err && <p className="text-sm text-red-400">{err}</p>}
          {createMode && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Роль</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200"
              >
                <option value="">— выбрать —</option>
                {KNOWN_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">System Prompt (моноширинный)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Модель</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200"
            >
              {LLM_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">maxTokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map((cap) => (
                <label key={cap} className="flex items-center gap-2 rounded border border-zinc-600 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={capabilities.includes(cap)}
                    onChange={() => toggleCap(cap)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                  />
                  <span className="text-sm text-zinc-300">{cap}</span>
                </label>
              ))}
            </div>
          </div>
          {!createMode && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Область</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as 'tenant' | 'global')}
                className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200"
              >
                <option value="tenant">Переопределение для тенанта</option>
                <option value="global">Глобальный</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  type AgentConfigsResponse,
  type AgentConfiguratorItem,
  type FutureAgentManifestBody,
  type FutureAgentManifestValidation,
  type FutureAgentTemplateItem,
} from '@/lib/api';
import { Settings2, UserCog, Bot } from 'lucide-react';

const LLM_MODELS = [
  { label: 'Gemini 3.1 Flash Lite', value: 'google/gemini-3.1-flash-lite-preview' },
  { label: 'GPT-5 Mini', value: 'openai/gpt-5-mini' },
  { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5' },
  { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4.6' },
  { label: 'GPT-5.2', value: 'openai/gpt-5.2' },
  { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro-preview-06-05' },
  { label: 'GPT-5.3 Codex', value: 'openai/gpt-5.3-codex' },
];
const CAPABILITY_OPTIONS = [
  'AgroToolsRegistry',
  'FinanceToolsRegistry',
  'RiskToolsRegistry',
  'KnowledgeToolsRegistry',
  'CrmToolsRegistry',
  'FrontOfficeToolsRegistry',
  'LegalToolsRegistry',
  'StrategyToolsRegistry',
  'ProductivityToolsRegistry',
  'MarketingToolsRegistry',
];
const KNOWN_ROLES = ['agronomist', 'economist', 'knowledge', 'monitoring', 'crm_agent', 'front_office_agent', 'contracts_agent', 'chief_agronomist', 'data_scientist'];
const ADAPTER_ROLES = ['agronomist', 'economist', 'knowledge', 'monitoring', 'crm_agent', 'front_office_agent', 'contracts_agent', 'chief_agronomist', 'data_scientist'];
const TEMPLATE_OPTIONS = ['marketer', 'strategist', 'finance_advisor', 'legal_advisor', 'crm_agent', 'front_office_agent', 'contracts_agent', 'controller', 'personal_assistant'] as const;
const KIND_OPTIONS = ['domain_advisor', 'worker_hybrid', 'personal_delegated'] as const;
const AUTONOMY_OPTIONS = ['advisory', 'hybrid', 'autonomous'] as const;
const MODEL_ROUTING_CLASSES = ['cheap', 'fast', 'strong'] as const;
const RESPONSIBILITY_INTENT_OPTIONS = [
  'tech_map_draft',
  'compute_deviations',
  'compute_plan_fact',
  'simulate_scenario',
  'compute_risk_assessment',
  'query_knowledge',
  'emit_alerts',
  'register_counterparty',
  'create_counterparty_relation',
  'create_crm_account',
  'review_account_workspace',
  'update_account_profile',
  'create_crm_contact',
  'update_crm_contact',
  'delete_crm_contact',
  'log_crm_interaction',
  'create_crm_obligation',
  'update_crm_interaction',
  'delete_crm_interaction',
  'update_crm_obligation',
  'delete_crm_obligation',
  'create_commerce_contract',
  'list_commerce_contracts',
  'review_commerce_contract',
  'create_contract_obligation',
  'create_fulfillment_event',
  'create_invoice_from_fulfillment',
  'post_invoice',
  'create_payment',
  'confirm_payment',
  'allocate_payment',
  'review_ar_balance',
  'log_dialog_message',
  'classify_dialog_thread',
  'create_front_office_escalation',
] as const;
type CanonicalAdapterRole = 'agronomist' | 'economist' | 'knowledge' | 'monitoring' | 'crm_agent' | 'front_office_agent' | 'contracts_agent' | 'chief_agronomist' | 'data_scientist';

function roleOptionLabel(role: string) {
  const labels: Record<string, string> = {
    agronomist: 'Агроном (agronomist)',
    economist: 'Экономист (economist)',
    knowledge: 'Знание (knowledge)',
    monitoring: 'Мониторинг (monitoring)',
    crm_agent: 'CRM-агент (crm_agent)',
    front_office_agent: 'Фронт-офис агент (front_office_agent)',
    contracts_agent: 'Контрактный агент (contracts_agent)',
    chief_agronomist: 'Мега-Агроном (chief_agronomist)',
    data_scientist: 'Дата-сайентист (data_scientist)',
  };
  return labels[role] ?? role;
}

function kindLabel(kind: (typeof KIND_OPTIONS)[number]) {
  const labels: Record<(typeof KIND_OPTIONS)[number], string> = {
    domain_advisor: 'Доменный советник',
    worker_hybrid: 'Гибридный исполнитель',
    personal_delegated: 'Персональный делегат',
  };
  return labels[kind];
}

function autonomyLabel(mode: (typeof AUTONOMY_OPTIONS)[number]) {
  const labels: Record<(typeof AUTONOMY_OPTIONS)[number], string> = {
    advisory: 'Рекомендательный',
    hybrid: 'Гибридный',
    autonomous: 'Автономный',
  };
  return labels[mode];
}

function routingClassLabel(mode: (typeof MODEL_ROUTING_CLASSES)[number]) {
  const labels: Record<(typeof MODEL_ROUTING_CLASSES)[number], string> = {
    cheap: 'Экономичный',
    fast: 'Быстрый',
    strong: 'Сильный',
  };
  return labels[mode];
}

function sourceLabel(value: 'global' | 'tenant') {
  return value === 'global' ? 'глобальный' : 'арендаторский';
}

function bindingsLabel(value: 'persisted' | 'bootstrap') {
  return value === 'persisted' ? 'сохранённые' : 'начальные';
}

function accessModeLabel(value: 'INHERITED' | 'OVERRIDE' | 'DENIED') {
  if (value === 'INHERITED') return 'наследуется';
  if (value === 'OVERRIDE') return 'переопределён';
  return 'запрещён';
}

function displayAgentName(role: string, fallbackName: string) {
  const labels: Record<string, string> = {
    agronomist: 'Агроном-А',
    economist: 'Экономист-А',
    knowledge: 'Знание-А',
    monitoring: 'Мониторинг-А',
    marketer: 'Маркетолог-А',
    strategist: 'Стратег-А',
    finance_advisor: 'Финсоветник-А',
    legal_advisor: 'Юрист-А',
    crm_agent: 'CRM-А',
    front_office_agent: 'ФронтОфис-А',
    contracts_agent: 'Контракты-А',
    chief_agronomist: 'Мега-Агроном-А',
    data_scientist: 'Дата-Сайентист-А',
    controller: 'Контролёр-А',
    personal_assistant: 'Ассистент-А',
  };
  return labels[role] ?? fallbackName;
}

function parseDelimitedList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyDelimitedList(value: string[] | undefined) {
  return (value ?? []).join(', ');
}

function formatUiError(error: unknown, fallback: string) {
  const payload = (error as { response?: { data?: unknown; status?: number } })?.response?.data;
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (Array.isArray((payload as { message?: unknown })?.message)) {
    const message = ((payload as { message?: string[] }).message ?? [])
      .map((item) => String(item))
      .filter(Boolean)
      .join('; ');
    if (message) return message;
  }

  if (typeof (payload as { message?: unknown })?.message === 'string') {
    return (payload as { message: string }).message;
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (status === 500) {
    return 'Сервис временно недоступен. Повторите действие.';
  }

  return fallback;
}

function buildDefaultManifest(params: {
  role: string;
  name: string;
  templateId?: FutureAgentTemplateItem['templateId'];
  kind: FutureAgentManifestBody['kind'];
  ownerDomain: string;
  description: string;
  defaultAutonomyMode: FutureAgentManifestBody['defaultAutonomyMode'];
  llmModel: string;
  maxTokens: number;
  executionAdapterRole?: string;
  capabilities: string[];
  tools: string[];
  responsibilityBinding?: FutureAgentManifestBody['responsibilityBinding'];
  modelRoutingClass: FutureAgentManifestBody['runtimeProfile']['modelRoutingClass'];
}): FutureAgentManifestBody {
  const toolBindings = params.tools.map((toolName) => ({
    toolName,
    isEnabled: true,
    requiresHumanGate: false,
    riskLevel: 'READ' as const,
  }));

  return {
    templateId: params.templateId,
    role: params.role,
    name: params.name,
    kind: params.kind,
    ownerDomain: params.ownerDomain,
    description: params.description,
    defaultAutonomyMode: params.defaultAutonomyMode,
    runtimeProfile: {
      profileId: `${params.role}-runtime-v1`,
      modelRoutingClass: params.modelRoutingClass,
      provider: 'openrouter',
      model: params.llmModel,
      executionAdapterRole: params.executionAdapterRole || undefined,
      maxInputTokens: Math.max(params.maxTokens, 4000),
      maxOutputTokens: Math.max(Math.round(params.maxTokens / 3), 1500),
      temperature: 0.2,
      timeoutMs: 15000,
      supportsStreaming: false,
    },
    responsibilityBinding: params.responsibilityBinding,
    memoryPolicy: {
      policyId: `${params.role}-memory-v1`,
      allowedScopes: ['tenant', 'domain', 'task_workflow'],
      retrievalPolicy: 'scoped_recall',
      writePolicy: 'append_summary',
      sensitiveDataPolicy: 'mask',
    },
    capabilityPolicy: {
      capabilities: params.capabilities,
      toolAccessMode: 'allowlist',
      connectorAccessMode: 'allowlist',
    },
    toolBindings,
    connectorBindings: [],
    outputContract: {
      contractId: `${params.role}-v1`,
      responseSchemaVersion: 'v1',
      sections: ['summary', 'recommendations', 'evidence'],
      requiresEvidence: true,
      requiresDeterministicValidation: toolBindings.length > 0,
      fallbackMode: 'retrieval_summary',
    },
    governancePolicy: {
      policyId: `${params.role}-governance-v1`,
      allowedAutonomyModes: [params.defaultAutonomyMode],
      humanGateRules: ['review_required_for_change_request'],
      criticalActionRules: ['no_unreviewed_writes'],
      auditRequirements: ['trace', 'evidence'],
      fallbackRules: ['use_summary_if_llm_unavailable'],
    },
    domainAdapter: {
      adapterId: `${params.role}-domain-adapter`,
      status: 'optional',
      notes: 'Опциональный детерминированный адаптер для доменных обогащений.',
    },
  };
}

function HeaderWithHint({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      {hint ? (
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/15 bg-white text-[10px] font-medium normal-case tracking-normal text-[#717182] cursor-help"
          title={hint}
          aria-label={hint}
        >
          i
        </span>
      ) : null}
    </span>
  );
}

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
      .catch((e) => setError(formatUiError(e, 'Не удалось загрузить реестр агентов')))
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
          <p className="text-[#717182] font-medium text-[13px]">Синхронизация текущего состояния исполнения...</p>
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
              <span className="font-mono text-red-600 block mb-1">ДОСТУП_ЗАПРЕЩЁН:</span>
              У вас нет прав для изменения настроек агентов. <br /> {error}.
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
                Контроль и надёжность
              </Link>
              <span className="text-[11px] font-medium text-[#717182]">/</span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#030213]">Конфигуратор агентов</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-black/5">
                <Bot size={16} className="text-[#030213]" />
              </div>
              <h1 className="text-3xl font-medium text-[#030213] tracking-tight">Конфигуратор агентов</h1>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/15 bg-white text-[11px] font-semibold text-[#717182] cursor-help"
                title="Здесь можно посмотреть текущие настройки агентов и отправить запрос на их изменение. Изменения применяются только после проверки и утверждения."
                aria-label="Здесь можно посмотреть текущие настройки агентов и отправить запрос на их изменение. Изменения применяются только после проверки и утверждения."
              >
                i
              </span>
            </div>
          </div>
          <div className="flex">
            <button
              onClick={() => setCreating(true)}
              className="px-6 py-2.5 bg-[#030213] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings2 size={16} />
              Создать запрос на изменение
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-10 space-y-6">
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-black/10">
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">Агент / Роль</th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                  <HeaderWithHint
                    label="Истина исполнения"
                    hint="Здесь показано, какая модель сейчас использует агент, включён ли он и откуда взяты его рабочие настройки."
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                  <HeaderWithHint
                    label="Связки / Доступ"
                    hint="Здесь видно, откуда взяты связки агента и доступен ли он текущему арендатору."
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                  <HeaderWithHint
                    label="Возможности / Контракты"
                    hint="Здесь перечислены наборы возможностей, инструменты и контракты исполнения: память, ответ и управление."
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-[#717182] text-right">Управляемое действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {agents.map((agent) => (
                <tr key={agent.role} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <span className="text-[14px] font-medium text-[#030213] block">{displayAgentName(agent.role, agent.agentName)}</span>
                      <span className="text-[11px] font-mono text-[#717182] block">{agent.role}</span>
                      <span className="text-[12px] text-[#717182] block">{agent.businessRole}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 text-[12px]">
                      <div className="font-mono text-[#030213]">{agent.runtime.llmModel}</div>
                      <div className="text-[#717182]">Лимит токенов: <span className="font-mono text-[#030213]">{agent.runtime.maxTokens}</span></div>
                      {agent.kernel?.runtimeProfile.executionAdapterRole && (
                        <Badge tone="blue" label={`Адаптер: ${agent.kernel.runtimeProfile.executionAdapterRole}`} />
                      )}
                      <Badge
                        tone={agent.runtime.isActive ? 'green' : 'slate'}
                        label={agent.runtime.isActive ? 'Исполнение активно' : 'Исполнение выключено'}
                      />
                      <Badge tone="blue" label={`Источник исполнения: ${sourceLabel(agent.runtime.source)}`} />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 text-[12px]">
                      <Badge
                        tone={agent.runtime.bindingsSource === 'persisted' ? 'green' : 'amber'}
                        label={`Связки: ${bindingsLabel(agent.runtime.bindingsSource)}`}
                      />
                      <Badge
                        tone={
                          agent.tenantAccess.mode === 'DENIED'
                            ? 'red'
                            : agent.tenantAccess.mode === 'OVERRIDE'
                              ? 'amber'
                              : 'blue'
                        }
                        label={`Доступ арендатора: ${accessModeLabel(agent.tenantAccess.mode)}`}
                      />
                      <div className="text-[#717182]">
                        источник доступа: <span className="font-mono text-[#030213]">{sourceLabel(agent.tenantAccess.source)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-2">Возможности</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.runtime.capabilities.map((capability) => (
                            <Tag key={capability} label={capability} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182] mb-2">Инструменты</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.runtime.tools.map((tool) => (
                            <Tag key={tool} label={tool} mono />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <PolicyDisclosure title="Политика памяти" payload={agent.memoryPolicy} />
                        <PolicyDisclosure title="Контракт ответа" payload={agent.outputContract} />
                        <PolicyDisclosure title="Политика управления" payload={agent.governancePolicy} />
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
                        Создать запрос на изменение
                      </button>
                      <div className="max-w-[220px] text-[11px] text-[#717182] leading-relaxed">
                        Прямой путь включения и записи на этой поверхности намеренно отсутствует.
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
          Запрос на изменение отправляется в процесс согласования...
        </div>
      )}
    </div>
  );
}

function AgentEditor({
  agent,
  onClose,
  onSaved,
  setSaving: setParentSaving,
  createMode = false,
}: {
  agent: AgentConfiguratorItem | null;
  onClose: () => void;
  onSaved: () => void;
  setSaving: (v: boolean) => void;
  createMode?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<FutureAgentTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(createMode);
  const [selectedTemplateId, setSelectedTemplateId] = useState<FutureAgentTemplateItem['templateId'] | ''>('');
  const [role, setRole] = useState(agent?.role ?? '');
  const [name, setName] = useState(agent?.agentName ?? '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.runtime.systemPrompt ?? '');
  const [llmModel, setLlmModel] = useState(agent?.runtime.llmModel ?? 'openai/gpt-5-mini');
  const [maxTokens, setMaxTokens] = useState(agent?.runtime.maxTokens ?? 8000);
  const [capabilities, setCapabilities] = useState<string[]>(agent?.runtime.capabilities ?? []);
  const [tools, setTools] = useState<string[]>(agent?.runtime.tools ?? []);
  const [executionAdapterRole, setExecutionAdapterRole] = useState(agent?.kernel?.runtimeProfile.executionAdapterRole ?? '');
  const [ownerDomain, setOwnerDomain] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<FutureAgentManifestBody['kind']>('domain_advisor');
  const [defaultAutonomyMode, setDefaultAutonomyMode] = useState<FutureAgentManifestBody['defaultAutonomyMode']>('advisory');
  const [modelRoutingClass, setModelRoutingClass] = useState<FutureAgentManifestBody['runtimeProfile']['modelRoutingClass']>('fast');
  const [bindingRole, setBindingRole] = useState('');
  const [bindingInheritsFrom, setBindingInheritsFrom] = useState('');
  const [bindingTitle, setBindingTitle] = useState('');
  const [allowedIntentsInput, setAllowedIntentsInput] = useState('');
  const [forbiddenIntentsInput, setForbiddenIntentsInput] = useState('');
  const [extraUiActionsInput, setExtraUiActionsInput] = useState('');
  const [scope, setScope] = useState<'tenant' | 'global'>(agent?.runtime.source === 'global' ? 'global' : 'tenant');
  const [validation, setValidation] = useState<FutureAgentManifestValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!createMode) {
      return;
    }
    api.agents
      .getOnboardingTemplates()
      .then((response) => setTemplates(response.data.templates))
      .catch((error) => setErr(formatUiError(error, 'Не удалось загрузить шаблоны онбординга')))
      .finally(() => setTemplatesLoading(false));
  }, [createMode]);

  useEffect(() => {
    if (!createMode || !selectedTemplateId) {
      return;
    }
    const template = templates.find((item) => item.templateId === selectedTemplateId);
    if (!template) {
      return;
    }

    const manifest = template.manifest;
    setRole(manifest.role);
    setName(manifest.name);
    setOwnerDomain(manifest.ownerDomain);
    setDescription(manifest.description);
    setKind(manifest.kind);
    setDefaultAutonomyMode(manifest.defaultAutonomyMode);
    setLlmModel(manifest.runtimeProfile.model);
    setMaxTokens(manifest.runtimeProfile.maxInputTokens);
    setExecutionAdapterRole(manifest.runtimeProfile.executionAdapterRole ?? '');
    setModelRoutingClass(manifest.runtimeProfile.modelRoutingClass);
    setCapabilities(manifest.capabilityPolicy.capabilities);
    setTools(manifest.toolBindings.map((binding) => binding.toolName));
    setBindingRole(manifest.responsibilityBinding?.role ?? manifest.role);
    setBindingInheritsFrom(manifest.responsibilityBinding?.inheritsFromRole ?? manifest.runtimeProfile.executionAdapterRole ?? '');
    setBindingTitle(manifest.responsibilityBinding?.overrides?.title ?? '');
    setAllowedIntentsInput(stringifyDelimitedList(manifest.responsibilityBinding?.overrides?.allowedIntents));
    setForbiddenIntentsInput(stringifyDelimitedList(manifest.responsibilityBinding?.overrides?.forbiddenIntents));
    setExtraUiActionsInput(stringifyDelimitedList(manifest.responsibilityBinding?.overrides?.extraUiActions));
    setValidation(null);
  }, [createMode, selectedTemplateId, templates]);

  const toggleCap = (cap: string) => {
    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]));
  };

  const currentManifest = (): FutureAgentManifestBody => {
    const effectiveRole = createMode ? role.trim() : agent?.role ?? role.trim();
    const responsibilityBinding =
      bindingInheritsFrom.trim()
        ? {
            role: bindingRole.trim() || effectiveRole,
            inheritsFromRole: bindingInheritsFrom.trim() as CanonicalAdapterRole,
            overrides: {
              ...(bindingTitle.trim() ? { title: bindingTitle.trim() } : {}),
              ...(parseDelimitedList(allowedIntentsInput).length > 0
                ? { allowedIntents: parseDelimitedList(allowedIntentsInput) }
                : {}),
              ...(parseDelimitedList(forbiddenIntentsInput).length > 0
                ? { forbiddenIntents: parseDelimitedList(forbiddenIntentsInput) }
                : {}),
              ...(parseDelimitedList(extraUiActionsInput).length > 0
                ? { extraUiActions: parseDelimitedList(extraUiActionsInput) }
                : {}),
            },
          }
        : undefined;

    const template = selectedTemplateId
      ? templates.find((item) => item.templateId === selectedTemplateId)
      : null;

    return template
      ? {
          ...template.manifest,
          role: effectiveRole,
          name: name.trim(),
          ownerDomain: ownerDomain.trim() || template.manifest.ownerDomain,
          description: description.trim() || template.manifest.description,
          kind,
          defaultAutonomyMode,
          runtimeProfile: {
            ...template.manifest.runtimeProfile,
            model: llmModel,
            executionAdapterRole: executionAdapterRole || undefined,
            modelRoutingClass,
            maxInputTokens: maxTokens,
            maxOutputTokens: Math.max(Math.round(maxTokens / 3), 1500),
          },
          responsibilityBinding,
          capabilityPolicy: {
            ...template.manifest.capabilityPolicy,
            capabilities,
          },
          toolBindings: tools.map((toolName) => ({
            toolName,
            isEnabled: true,
            requiresHumanGate: false,
            riskLevel: 'READ',
          })),
        }
      : buildDefaultManifest({
          role: effectiveRole,
          name: name.trim(),
          kind,
          ownerDomain: ownerDomain.trim() || 'custom_domain',
          description: description.trim() || 'Управляемый будущий агент.',
          defaultAutonomyMode,
          llmModel,
          maxTokens,
          executionAdapterRole: executionAdapterRole || undefined,
          capabilities,
          tools,
          responsibilityBinding,
          modelRoutingClass,
        });
  };

  const validateManifest = async () => {
    if (!createMode) {
      return null;
    }
    setValidating(true);
    setErr(null);
    try {
      const response = await api.agents.validateOnboardingManifest(currentManifest());
      setValidation(response.data);
      return response.data;
    } catch (error) {
      const message = formatUiError(error, 'Не удалось проверить манифест');
      setErr(message);
      setValidation(null);
      return null;
    } finally {
      setValidating(false);
    }
  };

  const save = async () => {
    const effectiveRole = createMode ? role : agent?.role ?? role;
    if (!effectiveRole?.trim()) { setErr('Укажите роль'); return; }
    if (!name?.trim()) { setErr('Укажите название'); return; }
    if (createMode && !ownerDomain.trim()) { setErr('Укажите домен-владелец'); return; }
    if (createMode && !description.trim()) { setErr('Укажите описание агента'); return; }
    setErr(null);

    if (createMode) {
      const manifestValidation = await validateManifest();
      if (!manifestValidation?.valid) {
        setErr('Манифест не прошёл валидацию. Исправьте ошибки ниже.');
        return;
      }
    }

    const allowedIntents = parseDelimitedList(allowedIntentsInput);
    const forbiddenIntents = parseDelimitedList(forbiddenIntentsInput);
    const extraUiActions = parseDelimitedList(extraUiActionsInput);
    const responsibilityBinding = bindingInheritsFrom.trim()
      ? {
          role: bindingRole.trim() || effectiveRole.trim(),
          inheritsFromRole: bindingInheritsFrom.trim() as CanonicalAdapterRole,
          overrides: {
            ...(bindingTitle.trim() ? { title: bindingTitle.trim() } : {}),
            ...(allowedIntents.length > 0 ? { allowedIntents } : {}),
            ...(forbiddenIntents.length > 0 ? { forbiddenIntents } : {}),
            ...(extraUiActions.length > 0 ? { extraUiActions } : {}),
          },
        }
      : undefined;

    setSaving(true);
    setParentSaving(true);
    api.agents
      .createChangeRequest({
        name: name.trim(),
        role: effectiveRole.trim(),
        systemPrompt,
        llmModel,
        maxTokens,
        isActive: agent?.runtime.isActive ?? true,
        capabilities,
        tools,
        runtimeProfile: executionAdapterRole ? { executionAdapterRole } : undefined,
        responsibilityBinding,
      }, scope)
      .then(() => onSaved())
      .catch((e) => setErr(formatUiError(e, 'Не удалось создать запрос на изменение')))
      .finally(() => {
        setSaving(false);
        setParentSaving(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm p-4 font-sans">
      <div className="h-full w-full max-w-xl bg-white rounded-3xl border border-black/10 shadow-2xl flex flex-col pt-8 pb-6 px-8 animate-in slide-in-from-right duration-300">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182] mb-1">
              {createMode ? 'Новый запрос на изменение' : 'Запрос на обновление'}
            </p>
            <div className="inline-flex items-center gap-2">
              <h2 className="text-2xl font-medium text-[#030213] tracking-tight">
                {createMode ? 'Черновик запроса на изменение' : `Запрос на изменение: ${agent?.agentName}`}
              </h2>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/15 bg-white text-[11px] font-medium text-[#717182] cursor-help"
                title="Изменения применяются только после согласования и публикации."
                aria-label="Изменения применяются только после согласования и публикации."
              >
                i
              </span>
            </div>
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
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Шаблон онбординга</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value as FutureAgentTemplateItem['templateId'] | '')}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                disabled={templatesLoading}
              >
                <option value="">— Пустой манифест —</option>
                {templates.map((template) => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {createMode && (
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Роль</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                placeholder="например, contracts_agent или front_office_agent"
                list="known-agent-roles"
              />
              <datalist id="known-agent-roles">
                {KNOWN_ROLES.map((r) => (
                  <option key={r} value={r}>{roleOptionLabel(r)}</option>
                ))}
              </datalist>
            </div>
          )}

          {createMode && (
            <>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Домен-владелец</label>
                <input
                  value={ownerDomain}
                  onChange={(e) => setOwnerDomain(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  placeholder="например, crm"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Описание агента</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[96px] rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#717182]">Тип агента</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as FutureAgentManifestBody['kind'])}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  >
                    {KIND_OPTIONS.map((option) => (
                      <option key={option} value={option}>{kindLabel(option)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#717182]">Режим автономности</label>
                  <select
                    value={defaultAutonomyMode}
                    onChange={(e) => setDefaultAutonomyMode(e.target.value as FutureAgentManifestBody['defaultAutonomyMode'])}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  >
                    {AUTONOMY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{autonomyLabel(option)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#717182]">Класс маршрутизации модели</label>
                  <select
                    value={modelRoutingClass}
                    onChange={(e) => setModelRoutingClass(e.target.value as FutureAgentManifestBody['runtimeProfile']['modelRoutingClass'])}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  >
                    {MODEL_ROUTING_CLASSES.map((option) => (
                      <option key={option} value={option}>{routingClassLabel(option)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
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
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Модель</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            >
              {LLM_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
              <label className="mb-2 block text-[13px] font-medium text-[#717182]">Максимум токенов</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">
              <HeaderWithHint
                label="Базовый агент"
                hint="Для новой роли это источник исполнения и набора контрактов по умолчанию."
              />
            </label>
            <select
              value={executionAdapterRole}
              onChange={(e) => setExecutionAdapterRole(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            >
              <option value="">— Без явной связки —</option>
              {ADAPTER_ROLES.map((adapterRole) => (
                <option key={adapterRole} value={adapterRole}>{roleOptionLabel(adapterRole)}</option>
              ))}
            </select>
          </div>

          {createMode && (
            <div className="space-y-4 rounded-2xl border border-black/10 bg-slate-50 p-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182] mb-3">
                  <HeaderWithHint
                    label="Связка ответственности"
                    hint="Определяет профиль наследования и допустимые интенты для новой роли."
                  />
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#717182]">Роль в связке</label>
                  <input
                    value={bindingRole}
                    onChange={(e) => setBindingRole(e.target.value)}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                    placeholder="обычно совпадает с role"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#717182]">Наследует от</label>
                  <select
                    value={bindingInheritsFrom}
                    onChange={(e) => setBindingInheritsFrom(e.target.value)}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  >
                    <option value="">— Авто из базового агента —</option>
                    {ADAPTER_ROLES.map((adapterRole) => (
                      <option key={adapterRole} value={adapterRole}>{roleOptionLabel(adapterRole)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Переопределённый заголовок</label>
                <input
                  value={bindingTitle}
                  onChange={(e) => setBindingTitle(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
                  placeholder="например, CRM-агент"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Разрешённые интенты</label>
                <input
                  value={allowedIntentsInput}
                  onChange={(e) => setAllowedIntentsInput(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] font-mono focus:border-black/30 outline-none"
                  placeholder={RESPONSIBILITY_INTENT_OPTIONS.join(', ')}
                  list="responsibility-intents"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Запрещённые интенты</label>
                <input
                  value={forbiddenIntentsInput}
                  onChange={(e) => setForbiddenIntentsInput(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] font-mono focus:border-black/30 outline-none"
                  placeholder="интент_1, интент_2"
                  list="responsibility-intents"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#717182]">Дополнительные действия интерфейса</label>
                <input
                  value={extraUiActionsInput}
                  onChange={(e) => setExtraUiActionsInput(e.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] font-mono focus:border-black/30 outline-none"
                  placeholder="open_account, refresh_context"
                />
              </div>
              <datalist id="responsibility-intents">
                {RESPONSIBILITY_INTENT_OPTIONS.map((intent) => (
                  <option key={intent} value={intent} />
                ))}
              </datalist>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Системная инструкция</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full min-h-[180px] rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Возможности</label>
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
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Инструменты</label>
            <input
              value={tools.join(', ')}
              onChange={(e) => setTools(e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] font-mono focus:border-black/30 outline-none"
              placeholder="generate_tech_map_draft, compute_deviations"
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#717182]">Область действия</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'tenant' | 'global')}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] focus:border-black/30 outline-none"
            >
              <option value="tenant">Запрос на изменение для арендатора</option>
              <option value="global">Глобальный запрос на изменение</option>
            </select>
          </div>

          {createMode && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">
                    <HeaderWithHint
                      label="Проверка манифеста"
                      hint="Проверяется совместимость исполнения, управления и профиля ответственности."
                    />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { void validateManifest(); }}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium border border-black/10 hover:bg-slate-50 transition-colors"
                  disabled={validating}
                >
                  {validating ? 'Проверка...' : 'Проверить манифест'}
                </button>
              </div>

              {validation && (
                <div className="space-y-3">
                  <div className={`rounded-xl border px-3 py-2 text-[12px] ${
                    validation.valid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    {validation.valid
                      ? `Манифест валиден. Нормализованная роль: ${validation.normalizedRole}.`
                      : 'Манифест невалиден. Исправьте обязательные требования перед отправкой.'}
                  </div>
                  {validation.missingRequirements.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182] mb-2">Обязательные исправления</p>
                      <div className="flex flex-wrap gap-2">
                        {validation.missingRequirements.map((item) => (
                          <Tag key={item} label={item} mono />
                        ))}
                      </div>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182] mb-2">Предупреждения</p>
                      <div className="flex flex-wrap gap-2">
                        {validation.warnings.map((item) => (
                          <Tag key={item} label={item} mono />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-black/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium border border-black/10 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#030213] text-white hover:bg-black transition-colors"
          >
            {saving ? 'Отправка...' : 'Отправить на согласование'}
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

function PolicyDisclosure({ title, payload }: { title: string; payload?: Record<string, unknown> }) {
  if (!payload || Object.keys(payload).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-slate-50 px-3 py-2 text-[11px] text-[#717182]">
        {title}: нет данных исполнения
      </div>
    );
  }

  return (
    <details className="rounded-xl border border-black/10 bg-slate-50 px-3 py-2">
      <summary className="cursor-pointer list-none text-[11px] font-medium uppercase tracking-widest text-[#717182]">
        {title}
      </summary>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-[#030213]">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { Prisma, type AgentConfiguration } from "@rai/prisma-client";
import { RaiToolName } from "../rai-chat/tools/rai-tools.types";
import type {
  AgentConfigItemDto,
  AgentConfigsResponseDto,
  AgentKernelViewDto,
  AgentRegistryItemDto,
  AgentTemplateId,
  FutureAgentManifestDto,
  FutureAgentManifestValidationDto,
  FutureAgentTemplateDto,
  UpsertAgentConfigDto,
} from "./dto/agent-config.dto";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import {
  AgentRegistryService,
  getDefaultToolsForRole,
  isAgentRuntimeRole,
} from "../rai-chat/agent-registry.service";
import { EffectiveAgentKernelEntry } from "../rai-chat/agent-platform/agent-platform.types";
import {
  buildResponsibilityBinding,
  validateResponsibilityProfileCompatibility,
} from "../rai-chat/agent-contracts/agent-interaction-contracts";

const FUTURE_AGENT_TEMPLATES: FutureAgentTemplateDto[] = [
  {
    templateId: "marketer",
    label: "Маркетолог",
    manifest: {
      templateId: "marketer",
      role: "marketer",
      name: "Маркетолог-А",
      kind: "domain_advisor",
      ownerDomain: "marketing",
      description: "Планирование кампаний и анализ воронки с управляемыми рекомендательными ответами.",
      defaultAutonomyMode: "advisory",
      runtimeProfile: {
        profileId: "marketer-runtime-v1",
        modelRoutingClass: "fast",
        provider: "openrouter",
        model: "google/gemini-3.1-flash-lite-preview",
        executionAdapterRole: "knowledge",
        maxInputTokens: 8000,
        maxOutputTokens: 3000,
        temperature: 0.2,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "marketer-memory-v1",
        allowedScopes: ["tenant", "domain", "team", "task_workflow"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["MarketingToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "crm_read_model",
          accessMode: "read",
          scopes: ["tenant", "campaigns"],
        },
      ],
      outputContract: {
        contractId: "marketer-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "recommendations", "risks", "evidence", "next_steps"],
        requiresEvidence: true,
        requiresDeterministicValidation: false,
        fallbackMode: "retrieval_summary",
      },
      governancePolicy: {
        policyId: "marketer-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["campaign_launch_requires_human_gate"],
        criticalActionRules: ["no_unreviewed_writes"],
        auditRequirements: ["trace", "evidence"],
        fallbackRules: ["use_read_model_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "marketing-domain-adapter",
        status: "optional",
        notes: "Нужен только для детерминированных обогащений, специфичных для кампаний.",
      },
    },
    rolloutChecklist: [
      "Зарегистрировать запись в governance prompt-ов",
      "Подключить CRM-коннектор в режиме только чтения",
      "Добавить eval-набор для рекомендаций по кампаниям",
    ],
  },
  {
    templateId: "strategist",
    label: "Стратег",
    manifest: {
      templateId: "strategist",
      role: "strategist",
      name: "Стратег-А",
      kind: "domain_advisor",
      ownerDomain: "strategy",
      description: "Сценарный анализ и оценка стратегических компромиссов.",
      defaultAutonomyMode: "advisory",
      runtimeProfile: {
        profileId: "strategist-runtime-v1",
        modelRoutingClass: "strong",
        provider: "openrouter",
        model: "anthropic/claude-sonnet-4.6",
        executionAdapterRole: "knowledge",
        maxInputTokens: 12000,
        maxOutputTokens: 4000,
        temperature: 0.2,
        timeoutMs: 20000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "strategist-memory-v1",
        allowedScopes: ["tenant", "domain", "team", "task_workflow", "sensitive_compliance"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["StrategyToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [],
      outputContract: {
        contractId: "strategist-v1",
        responseSchemaVersion: "v1",
        sections: ["thesis", "scenarios", "assumptions", "risks", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: false,
        fallbackMode: "retrieval_summary",
      },
      governancePolicy: {
        policyId: "strategist-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["strategy_changes_require_exec_review"],
        criticalActionRules: ["no_autonomous_execution"],
        auditRequirements: ["trace", "evidence", "validation"],
        fallbackRules: ["use_structured_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "strategy-domain-adapter",
        status: "optional",
        notes: "Использовать только если появятся детерминированные движки сценариев.",
      },
    },
    rolloutChecklist: [
      "Определить стратегический корпус источников",
      "Подключить набор оценки сценариев",
      "Сохранить автономность в advisory-режиме",
    ],
  },
  {
    templateId: "finance_advisor",
    label: "Финансовый советник",
    manifest: {
      templateId: "finance_advisor",
      role: "finance_advisor",
      name: "Финсоветник-А",
      kind: "domain_advisor",
      ownerDomain: "finance",
      description: "Управляемый финансовый advisory поверх детерминированных метрик и сценариев.",
      defaultAutonomyMode: "advisory",
      runtimeProfile: {
        profileId: "finance-advisor-runtime-v1",
        modelRoutingClass: "strong",
        provider: "openrouter",
        model: "openai/gpt-5.2",
        executionAdapterRole: "economist",
        maxInputTokens: 10000,
        maxOutputTokens: 3500,
        temperature: 0.15,
        timeoutMs: 20000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "finance-advisor-memory-v1",
        allowedScopes: ["tenant", "domain", "task_workflow", "sensitive_compliance"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["FinanceToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [],
      outputContract: {
        contractId: "finance-advisor-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "metrics", "risks", "caveats", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "finance-advisor-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["financial_actions_disallowed"],
        criticalActionRules: ["no_payment_or_booking_writes"],
        auditRequirements: ["trace", "evidence", "validation"],
        fallbackRules: ["use_deterministic_finance_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "finance-domain-adapter",
        status: "optional",
        notes: "Переиспользовать существующий детерминированный контур экономиста, когда он доступен.",
      },
    },
    rolloutChecklist: [
      "Сопоставить детерминированные источники финансовых доказательств",
      "Добавить eval-набор по план-факту и сценариям",
      "Оставить рекомендации нетранзакционными",
    ],
  },
  {
    templateId: "legal_advisor",
    label: "Юридический советник",
    manifest: {
      templateId: "legal_advisor",
      role: "legal_advisor",
      name: "Юрист-А",
      kind: "domain_advisor",
      ownerDomain: "legal",
      description: "Юридический анализ на основе доказательств и оценка рисков по условиям.",
      defaultAutonomyMode: "advisory",
      runtimeProfile: {
        profileId: "legal-advisor-runtime-v1",
        modelRoutingClass: "strong",
        provider: "openrouter",
        model: "anthropic/claude-sonnet-4.6",
        executionAdapterRole: "knowledge",
        maxInputTokens: 12000,
        maxOutputTokens: 3500,
        temperature: 0.1,
        timeoutMs: 20000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "legal-advisor-memory-v1",
        allowedScopes: ["tenant", "domain", "team", "sensitive_compliance"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "allow_masked_only",
      },
      capabilityPolicy: {
        capabilities: ["LegalToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "legal_corpus",
          accessMode: "read",
          scopes: ["tenant", "clauses", "policies"],
        },
      ],
      outputContract: {
        contractId: "legal-advisor-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "clause_risks", "sources", "uncertainty", "next_steps"],
        requiresEvidence: true,
        requiresDeterministicValidation: false,
        fallbackMode: "retrieval_summary",
      },
      governancePolicy: {
        policyId: "legal-advisor-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["legal_decisions_require_human_review"],
        criticalActionRules: ["no_autonomous_legal_commitments"],
        auditRequirements: ["trace", "evidence", "validation"],
        fallbackRules: ["use_corpus_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "legal-domain-adapter",
        status: "required",
        notes: "Обязателен, когда есть парсинг условий или детерминированные проверки по юрисдикциям.",
      },
    },
    rolloutChecklist: [
      "Подключить коннектор к юридическому корпусу",
      "Добавить регрессионный набор по рискам условий",
      "Оставить все ответы строго advisory",
    ],
  },
  {
    templateId: "crm_agent",
    label: "CRM-агент",
    manifest: {
      templateId: "crm_agent",
      role: "crm_agent",
      name: "CRM-А",
      kind: "worker_hybrid",
      ownerDomain: "crm",
      description: "Сводка по клиентским карточкам и управляемая поддержка CRM-процессов.",
      defaultAutonomyMode: "hybrid",
      runtimeProfile: {
        profileId: "crm-agent-runtime-v1",
        modelRoutingClass: "fast",
        provider: "openrouter",
        model: "openai/gpt-5-mini",
        executionAdapterRole: "crm_agent",
        maxInputTokens: 8000,
        maxOutputTokens: 2500,
        temperature: 0.15,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      responsibilityBinding: {
        role: "crm_agent",
        inheritsFromRole: "crm_agent",
        overrides: {
          title: "CRM-агент",
          allowedIntents: [
            "register_counterparty",
            "create_counterparty_relation",
            "create_crm_account",
            "review_account_workspace",
            "update_account_profile",
            "create_crm_contact",
            "update_crm_contact",
            "delete_crm_contact",
            "log_crm_interaction",
            "create_crm_obligation",
            "update_crm_interaction",
            "delete_crm_interaction",
            "update_crm_obligation",
            "delete_crm_obligation",
          ],
          extraUiActions: ["open_account", "open_activity_log", "open_contacts", "open_obligations", "refresh_context", "open_crm_route", "open_parties_route"],
        },
      },
      memoryPolicy: {
        policyId: "crm-agent-memory-v1",
        allowedScopes: ["tenant", "domain", "user", "task_workflow"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_interaction",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["CrmToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "crm_primary",
          accessMode: "governed_write",
          scopes: ["contacts", "activities"],
        },
      ],
      outputContract: {
        contractId: "crm-agent-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "recommended_actions", "record_changes", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "crm-agent-governance-v1",
        allowedAutonomyModes: ["advisory", "hybrid"],
        humanGateRules: ["write_actions_require_governed_gate"],
        criticalActionRules: ["no_unreviewed_record_mutations"],
        auditRequirements: ["trace", "evidence", "validation", "gate_status"],
        fallbackRules: ["use_read_model_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "crm-domain-adapter",
        status: "optional",
        notes: "Подключать, если понадобится CRM-специфичное детерминированное форматирование действий.",
      },
    },
    rolloutChecklist: [
      "Сначала подтвердить read-only сценарий",
      "Включать governed_write только через human gate",
      "Добавить проверки аудита CRM-активностей",
    ],
  },
  {
    templateId: "front_office_agent",
    label: "Фронт-офис агент",
    manifest: {
      templateId: "front_office_agent",
      role: "front_office_agent",
      name: "ФронтОфис-А",
      kind: "worker_hybrid",
      ownerDomain: "front_office",
      description:
        "Коммуникационный ingress: логирование диалогов, классификация сообщений и эскалация в owner-домены.",
      defaultAutonomyMode: "hybrid",
      runtimeProfile: {
        profileId: "front-office-agent-runtime-v1",
        modelRoutingClass: "fast",
        provider: "openrouter",
        model: "openai/gpt-5-mini",
        executionAdapterRole: "front_office_agent",
        maxInputTokens: 8000,
        maxOutputTokens: 2500,
        temperature: 0.1,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      responsibilityBinding: {
        role: "front_office_agent",
        inheritsFromRole: "front_office_agent",
        overrides: {
          title: "Фронт-офис агент",
          allowedIntents: [
            "log_dialog_message",
            "classify_dialog_thread",
            "create_front_office_escalation",
          ],
          extraUiActions: [
            "open_front_office_route",
            "refresh_front_office_context",
            "focus_front_office_result",
          ],
        },
      },
      memoryPolicy: {
        policyId: "front-office-agent-memory-v1",
        allowedScopes: ["tenant", "domain", "user", "task_workflow"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["FrontOfficeToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "telegram_primary",
          accessMode: "governed_write",
          scopes: ["dialogs", "messages"],
        },
      ],
      outputContract: {
        contractId: "front-office-agent-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "classification", "handoff", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "front-office-agent-governance-v1",
        allowedAutonomyModes: ["advisory", "hybrid"],
        humanGateRules: ["external_message_writes_require_gate"],
        criticalActionRules: ["no_cross_domain_writes"],
        auditRequirements: ["trace", "evidence", "validation", "gate_status"],
        fallbackRules: ["use_audit_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "front-office-domain-adapter",
        status: "optional",
        notes: "На первой волне достаточно audit-backed message logging и классификации thread.",
      },
    },
    rolloutChecklist: [
      "Подключить Telegram как первый communicator ingress",
      "Подтвердить log/classification/escalation сценарии через audit trail",
      "Зафиксировать handoff-map в owner-domains",
    ],
  },
  {
    templateId: "contracts_agent",
    label: "Contracts-агент",
    manifest: {
      templateId: "contracts_agent",
      role: "contracts_agent",
      name: "Контракты-А",
      kind: "worker_hybrid",
      ownerDomain: "commerce",
      description:
        "Исполнение commerce-контура: договоры, обязательства, исполнение, счета, платежи и аллокации.",
      defaultAutonomyMode: "hybrid",
      runtimeProfile: {
        profileId: "contracts-agent-runtime-v1",
        modelRoutingClass: "strong",
        provider: "openrouter",
        model: "openai/gpt-5.2",
        executionAdapterRole: "contracts_agent",
        maxInputTokens: 10000,
        maxOutputTokens: 3000,
        temperature: 0.15,
        timeoutMs: 20000,
        supportsStreaming: false,
      },
      responsibilityBinding: {
        role: "contracts_agent",
        inheritsFromRole: "contracts_agent",
        overrides: {
          title: "Contracts-агент",
          allowedIntents: [
            "create_commerce_contract",
            "list_commerce_contracts",
            "review_commerce_contract",
            "create_contract_obligation",
            "create_fulfillment_event",
            "create_invoice_from_fulfillment",
            "post_invoice",
            "create_payment",
            "confirm_payment",
            "allocate_payment",
            "review_ar_balance",
          ],
          extraUiActions: [
            "open_contracts_route",
            "open_contract_create_route",
            "open_contract",
            "open_invoice",
            "open_payment",
            "refresh_commerce_context",
          ],
        },
      },
      memoryPolicy: {
        policyId: "contracts-agent-memory-v1",
        allowedScopes: ["tenant", "domain", "user", "task_workflow", "sensitive_compliance"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["ContractsToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "commerce_primary",
          accessMode: "governed_write",
          scopes: ["contracts", "obligations", "fulfillment", "invoices", "payments", "allocations"],
        },
      ],
      outputContract: {
        contractId: "contracts-agent-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "commerce_state", "recommended_actions", "record_changes", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "contracts-agent-governance-v1",
        allowedAutonomyModes: ["advisory", "hybrid"],
        humanGateRules: ["commerce_write_actions_require_gate"],
        criticalActionRules: ["no_unreviewed_financial_posting_actions"],
        auditRequirements: ["trace", "evidence", "validation", "gate_status"],
        fallbackRules: ["use_commerce_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "contracts-domain-adapter",
        status: "optional",
        notes: "Первая волна опирается на существующие commerce services без отдельного orchestration mesh.",
      },
    },
    rolloutChecklist: [
      "Подтвердить create/review contract path в чате и через commerce UI",
      "Проверить governed write path для invoice posting и payment confirmation",
      "Добавить smoke-набор для obligations, fulfillment, billing и AR balance",
    ],
  },
  {
    templateId: "controller",
    label: "Контролёр",
    manifest: {
      templateId: "controller",
      role: "controller",
      name: "Контролёр-А",
      kind: "worker_hybrid",
      ownerDomain: "finance",
      description: "Контрольный мониторинг, поддержка сверок и управляемые эскалации.",
      defaultAutonomyMode: "hybrid",
      runtimeProfile: {
        profileId: "controller-runtime-v1",
        modelRoutingClass: "fast",
        provider: "openrouter",
        model: "anthropic/claude-haiku-4.5",
        executionAdapterRole: "monitoring",
        maxInputTokens: 8000,
        maxOutputTokens: 2500,
        temperature: 0.1,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "controller-memory-v1",
        allowedScopes: ["tenant", "domain", "task_workflow", "sensitive_compliance"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_summary",
        sensitiveDataPolicy: "mask",
      },
      capabilityPolicy: {
        capabilities: ["FinanceToolsRegistry", "RiskToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [],
      outputContract: {
        contractId: "controller-v1",
        responseSchemaVersion: "v1",
        sections: ["signal_summary", "exceptions", "recommended_actions", "evidence"],
        requiresEvidence: true,
        requiresDeterministicValidation: true,
        fallbackMode: "deterministic_summary",
      },
      governancePolicy: {
        policyId: "controller-governance-v1",
        allowedAutonomyModes: ["advisory", "hybrid"],
        humanGateRules: ["escalations_require_review_for_writes"],
        criticalActionRules: ["deny_unreviewed_postings"],
        auditRequirements: ["trace", "evidence", "validation", "gate_status"],
        fallbackRules: ["use_controls_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "controller-domain-adapter",
        status: "optional",
        notes: "Полезен, когда движки сверки выдают структурированные исключения.",
      },
    },
    rolloutChecklist: [
      "Подключить источники доказательств для контрольных проверок",
      "Подтвердить no-write путь по умолчанию",
      "Добавить тесты политики эскалаций",
    ],
  },
  {
    templateId: "personal_assistant",
    label: "Персональный ассистент",
    manifest: {
      templateId: "personal_assistant",
      role: "personal_assistant",
      name: "Ассистент-А",
      kind: "personal_delegated",
      ownerDomain: "personal_ops",
      description: "Планирование личных задач и подготовка сводок в делегированных границах.",
      defaultAutonomyMode: "advisory",
      runtimeProfile: {
        profileId: "personal-assistant-runtime-v1",
        modelRoutingClass: "fast",
        provider: "openrouter",
        model: "google/gemini-3.1-flash-lite-preview",
        executionAdapterRole: "knowledge",
        maxInputTokens: 8000,
        maxOutputTokens: 2500,
        temperature: 0.25,
        timeoutMs: 15000,
        supportsStreaming: false,
      },
      memoryPolicy: {
        policyId: "personal-assistant-memory-v1",
        allowedScopes: ["tenant", "user", "task_workflow"],
        retrievalPolicy: "scoped_recall",
        writePolicy: "append_interaction",
        sensitiveDataPolicy: "allow_masked_only",
      },
      capabilityPolicy: {
        capabilities: ["ProductivityToolsRegistry"],
        toolAccessMode: "allowlist",
        connectorAccessMode: "allowlist",
      },
      toolBindings: [],
      connectorBindings: [
        {
          connectorName: "calendar_read_model",
          accessMode: "read",
          scopes: ["events", "availability"],
        },
      ],
      outputContract: {
        contractId: "personal-assistant-v1",
        responseSchemaVersion: "v1",
        sections: ["summary", "tasks", "constraints", "next_steps"],
        requiresEvidence: false,
        requiresDeterministicValidation: false,
        fallbackMode: "retrieval_summary",
      },
      governancePolicy: {
        policyId: "personal-assistant-governance-v1",
        allowedAutonomyModes: ["advisory"],
        humanGateRules: ["delegated_actions_require_confirmation"],
        criticalActionRules: ["no_unreviewed_external_writes"],
        auditRequirements: ["trace", "validation"],
        fallbackRules: ["use_context_summary_if_llm_unavailable"],
      },
      domainAdapter: {
        adapterId: "personal-ops-adapter",
        status: "optional",
        notes: "Подключать только когда календарь или задачи требуют детерминированного форматирования.",
      },
    },
    rolloutChecklist: [
      "Ограничить память областями пользователя и задач",
      "Оставить коннекторы в read-only режиме по умолчанию",
      "Добавить тесты подтверждения через gate",
    ],
  },
];

function toItemDto(row: AgentConfiguration): AgentConfigItemDto {
  const capabilities = Array.isArray(row.capabilities) ? (row.capabilities as string[]) : [];
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    systemPrompt: row.systemPrompt,
    llmModel: row.llmModel,
    maxTokens: row.maxTokens,
    isActive: row.isActive,
    companyId: row.companyId,
    capabilities,
    autonomyMode: (row.autonomyMode as AgentConfigItemDto["autonomyMode"]) ?? "advisory",
    runtimeProfile:
      row.runtimeProfile && typeof row.runtimeProfile === "object"
        ? (row.runtimeProfile as Record<string, unknown>)
        : {},
    memoryPolicy:
      row.memoryPolicy && typeof row.memoryPolicy === "object"
        ? (row.memoryPolicy as Record<string, unknown>)
        : {},
    outputContract:
      row.outputContract && typeof row.outputContract === "object"
        ? (row.outputContract as Record<string, unknown>)
        : {},
    governancePolicy:
      row.governancePolicy && typeof row.governancePolicy === "object"
        ? (row.governancePolicy as Record<string, unknown>)
        : {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAuditMetadata(item: AgentConfigItemDto, extra?: Record<string, unknown>) {
  return {
    role: item.role,
    name: item.name,
    llmModel: item.llmModel,
    maxTokens: item.maxTokens,
    isActive: item.isActive,
    companyId: item.companyId,
    capabilities: item.capabilities,
    autonomyMode: item.autonomyMode,
    runtimeProfile: item.runtimeProfile,
    memoryPolicy: item.memoryPolicy,
    outputContract: item.outputContract,
    governancePolicy: item.governancePolicy,
    ...extra,
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class AgentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configGuard: AgentConfigGuardService,
    private readonly agentRegistry: AgentRegistryService,
  ) {}

  async getAgentConfigs(companyId: string): Promise<AgentConfigsResponseDto> {
    const [global, tenantOverrides, registry] = await Promise.all([
      this.prisma.agentConfiguration.findMany({ where: { companyId: null } }),
      this.prisma.agentConfiguration.findMany({ where: { companyId } }),
      this.agentRegistry.getRegistry(companyId),
    ]);
    const kernels = await Promise.all(
      registry.map((entry) =>
        this.agentRegistry.getEffectiveKernel(companyId, entry.definition.role),
      ),
    );
    const kernelByRole = new Map(
      kernels
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .map((entry) => [entry.definition.role, this.toKernelDto(entry)]),
    );
    return {
      global: global.map(toItemDto),
      tenantOverrides: tenantOverrides.map(toItemDto),
      agents: registry.map((entry): AgentRegistryItemDto => ({
        role: entry.definition.role,
        agentName: entry.definition.name,
        businessRole: entry.definition.businessRole,
        ownerDomain: entry.definition.ownerDomain,
        runtime: {
          configId: entry.runtime.configId,
          source: entry.runtime.source,
          bindingsSource: entry.runtime.bindingsSource,
          llmModel: entry.runtime.llmModel,
          maxTokens: entry.runtime.maxTokens,
          systemPrompt: entry.runtime.systemPrompt,
          capabilities: entry.runtime.capabilities,
          tools: entry.runtime.tools,
          isActive: entry.runtime.isActive,
        },
        tenantAccess: {
          companyId: entry.tenantAccess.companyId,
          mode: entry.tenantAccess.mode,
          source: entry.tenantAccess.source,
          isActive: entry.tenantAccess.isActive,
        },
        kernel: kernelByRole.get(entry.definition.role),
      })),
    };
  }

  getFutureAgentTemplates(): FutureAgentTemplateDto[] {
    return FUTURE_AGENT_TEMPLATES.map((template) => ({
      ...template,
      manifest: JSON.parse(JSON.stringify(template.manifest)) as FutureAgentManifestDto,
      rolloutChecklist: [...template.rolloutChecklist],
    }));
  }

  validateFutureAgentManifest(
    manifest: FutureAgentManifestDto,
  ): FutureAgentManifestValidationDto {
    const normalizedRole = manifest.role.trim().toLowerCase();
    const missingRequirements: string[] = [];
    const warnings: string[] = [];

    if (!manifest.runtimeProfile.model.startsWith("openrouter/") && !manifest.runtimeProfile.model.startsWith("openai/")) {
      warnings.push("runtime_profile_model_should_use_openrouter_catalog_name");
    }
    if (!isAgentRuntimeRole(normalizedRole)) {
      if (!manifest.runtimeProfile.executionAdapterRole) {
        missingRequirements.push("future_role_requires_execution_adapter_role");
      } else if (!isAgentRuntimeRole(manifest.runtimeProfile.executionAdapterRole)) {
        missingRequirements.push("execution_adapter_role_must_reference_canonical_runtime");
      }
    }
    if (manifest.governancePolicy.allowedAutonomyModes.includes("autonomous")) {
      warnings.push("autonomous_mode_requires_manual_governance_review");
    }
    if (manifest.connectorBindings.some((binding) => binding.accessMode !== "read")) {
      warnings.push("non_read_connector_requires_governed_write_review");
    }
    if (manifest.toolBindings.some((binding) => binding.riskLevel === "CRITICAL" && !binding.requiresHumanGate)) {
      missingRequirements.push("critical_tools_must_require_human_gate");
    }
    if (
      manifest.outputContract.requiresEvidence &&
      manifest.outputContract.sections.every((section) => !section.toLowerCase().includes("evidence"))
    ) {
      missingRequirements.push("output_contract_requires_evidence_section");
    }
    if (
      manifest.defaultAutonomyMode !== "advisory" &&
      !manifest.governancePolicy.humanGateRules.some((rule) => rule.includes("gate") || rule.includes("review"))
    ) {
      missingRequirements.push("non_advisory_agents_need_explicit_human_gate_rules");
    }
    if (manifest.capabilityPolicy.capabilities.length === 0) {
      missingRequirements.push("capability_policy_requires_at_least_one_capability");
    }
    if (manifest.governancePolicy.auditRequirements.length === 0) {
      missingRequirements.push("governance_policy_requires_audit_requirements");
    }
    if (
      manifest.domainAdapter?.status === "required" &&
      !manifest.domainAdapter.adapterId.trim()
    ) {
      missingRequirements.push("required_domain_adapter_must_have_adapter_id");
    }

    const responsibility = validateResponsibilityProfileCompatibility({
      role: normalizedRole,
      tools: manifest.toolBindings.map((binding) => binding.toolName),
      runtimeAdapterRole: manifest.runtimeProfile.executionAdapterRole,
      responsibilityBinding: buildResponsibilityBinding(
        normalizedRole,
        manifest.runtimeProfile.executionAdapterRole,
        manifest.responsibilityBinding,
      ),
    });
    missingRequirements.push(...responsibility.missingRequirements);
    warnings.push(...responsibility.warnings);

    return {
      valid: missingRequirements.length === 0,
      normalizedRole,
      compatibleWithRuntimeWithoutCodeChanges: missingRequirements.length === 0,
      missingRequirements,
      warnings,
    };
  }

  async upsertAgentConfig(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<AgentConfigItemDto> {
    throw new BadRequestException(
      "Direct production config writes are forbidden. Use governed prompt-change workflow.",
    );
  }

  async getStoredConfigSnapshot(
    callerCompanyId: string,
    role: string,
    scope: "tenant" | "global",
  ): Promise<UpsertAgentConfigDto | null> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role, companyId },
      },
    });
    if (!existing) {
      return null;
    }
    return {
      name: existing.name,
      role: existing.role,
      systemPrompt: existing.systemPrompt,
      llmModel: existing.llmModel,
      maxTokens: existing.maxTokens,
      isActive: existing.isActive,
      capabilities: Array.isArray(existing.capabilities)
        ? (existing.capabilities as string[])
        : [],
      autonomyMode: existing.autonomyMode as UpsertAgentConfigDto["autonomyMode"],
      runtimeProfile:
        existing.runtimeProfile && typeof existing.runtimeProfile === "object"
          ? (existing.runtimeProfile as UpsertAgentConfigDto["runtimeProfile"])
          : undefined,
      memoryPolicy:
        existing.memoryPolicy && typeof existing.memoryPolicy === "object"
          ? (existing.memoryPolicy as UpsertAgentConfigDto["memoryPolicy"])
          : undefined,
      outputContract:
        existing.outputContract && typeof existing.outputContract === "object"
          ? (existing.outputContract as UpsertAgentConfigDto["outputContract"])
          : undefined,
      governancePolicy:
        existing.governancePolicy && typeof existing.governancePolicy === "object"
          ? (existing.governancePolicy as UpsertAgentConfigDto["governancePolicy"])
          : undefined,
      tools: await this.getStoredToolBindings(role, companyId),
      connectors: await this.getStoredConnectorBindings(role, companyId),
    };
  }

  async restoreStoredConfigSnapshot(
    callerCompanyId: string,
    role: string,
    scope: "tenant" | "global",
    snapshot: UpsertAgentConfigDto | null,
  ): Promise<void> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role, companyId },
      },
    });

    if (!snapshot) {
      if (existing) {
        await this.prisma.agentConfiguration.delete({
          where: { id: existing.id },
        });
        await this.prisma.agentCapabilityBinding.deleteMany({
          where: { role, companyId },
        });
        await this.prisma.agentToolBinding.deleteMany({
          where: { role, companyId },
        });
        await this.prisma.agentConnectorBinding.deleteMany({
          where: { role, companyId },
        });
      }
      return;
    }

    if (existing) {
      await this.prisma.agentConfiguration.update({
        where: { id: existing.id },
        data: {
          name: snapshot.name,
          systemPrompt: snapshot.systemPrompt,
          llmModel: snapshot.llmModel,
          maxTokens: snapshot.maxTokens,
          isActive: snapshot.isActive,
          capabilities: snapshot.capabilities,
          autonomyMode: snapshot.autonomyMode ?? "advisory",
          runtimeProfile: snapshot.runtimeProfile ?? {},
          memoryPolicy: snapshot.memoryPolicy ?? {},
          outputContract: snapshot.outputContract ?? {},
          governancePolicy: snapshot.governancePolicy ?? {},
        },
      });
      await this.syncPersistedBindings(callerCompanyId, snapshot, scope);
      return;
    }

    await this.prisma.agentConfiguration.create({
      data: {
        name: snapshot.name,
        role: snapshot.role,
        systemPrompt: snapshot.systemPrompt,
        llmModel: snapshot.llmModel,
        maxTokens: snapshot.maxTokens,
        isActive: snapshot.isActive,
        capabilities: snapshot.capabilities,
        autonomyMode: snapshot.autonomyMode ?? "advisory",
        runtimeProfile: snapshot.runtimeProfile ?? {},
        memoryPolicy: snapshot.memoryPolicy ?? {},
        outputContract: snapshot.outputContract ?? {},
        governancePolicy: snapshot.governancePolicy ?? {},
        companyId,
      },
    });
    await this.syncPersistedBindings(callerCompanyId, snapshot, scope);
  }

  async applyPromotedAgentConfig(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
    governanceMetadata?: Record<string, unknown>,
  ): Promise<AgentConfigItemDto> {
    const companyId = scope === "global" ? null : callerCompanyId;

    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role: dto.role, companyId },
      },
    });

    const data = {
      name: dto.name,
      systemPrompt: dto.systemPrompt,
      llmModel: dto.llmModel,
      maxTokens: dto.maxTokens,
      isActive: dto.isActive ?? true,
      capabilities: dto.capabilities ?? [],
      autonomyMode: dto.autonomyMode ?? "advisory",
      runtimeProfile: dto.runtimeProfile ?? {},
      memoryPolicy: dto.memoryPolicy ?? {},
      outputContract: dto.outputContract ?? {},
      governancePolicy: dto.governancePolicy ?? {},
    };

    if (existing) {
      const updated = await this.prisma.agentConfiguration.update({
        where: { id: existing.id },
        data,
      });
      await this.syncPersistedBindings(callerCompanyId, dto, scope);
      const item = toItemDto(updated);
      await this.prisma.auditLog.create({
        data: {
          action: "AGENT_CONFIG_PROMOTED_UPDATE",
          companyId: callerCompanyId,
          metadata: toJsonValue(toAuditMetadata(item, { scope, ...governanceMetadata })),
        },
      });
      await this.writeBindingsAudit(callerCompanyId, dto, scope, governanceMetadata);
      return item;
    }

    const created = await this.prisma.agentConfiguration.create({
      data: {
        ...data,
        role: dto.role,
        companyId,
      },
    });
    await this.syncPersistedBindings(callerCompanyId, dto, scope);
    const item = toItemDto(created);
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_PROMOTED_CREATE",
        companyId: callerCompanyId,
        metadata: toJsonValue(toAuditMetadata(item, { scope, ...governanceMetadata })),
      },
    });
    await this.writeBindingsAudit(callerCompanyId, dto, scope, governanceMetadata);
    return item;
  }

  private async syncPersistedBindings(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<void> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const capabilities = dto.capabilities ?? [];
    const tools = await this.resolveToolsForSync(dto, companyId);

    await this.prisma.agentCapabilityBinding.deleteMany({
      where: { role: dto.role, companyId },
    });
    if (capabilities.length > 0) {
      await this.prisma.agentCapabilityBinding.createMany({
        data: capabilities.map((capability) => ({
          role: dto.role,
          capability,
          companyId,
          isEnabled: true,
        })),
      });
    }

    await this.prisma.agentToolBinding.deleteMany({
      where: { role: dto.role, companyId },
    });
    if (tools.length > 0) {
      await this.prisma.agentToolBinding.createMany({
        data: tools.map((toolName) => ({
          role: dto.role,
          toolName,
          companyId,
          isEnabled: true,
        })),
      });
    }

    await this.prisma.agentConnectorBinding.deleteMany({
      where: { role: dto.role, companyId },
    });
    if ((dto.connectors ?? []).length > 0) {
      await this.prisma.agentConnectorBinding.createMany({
        data: (dto.connectors ?? []).map((connector) => ({
          role: dto.role,
          connectorName: connector.connectorName,
          accessMode: connector.accessMode,
          scopes: connector.scopes,
          companyId,
          isEnabled: connector.isEnabled ?? true,
        })),
      });
    }
  }

  private async writeBindingsAudit(
    companyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
    governanceMetadata?: Record<string, unknown>,
  ): Promise<void> {
    const bindingCompanyId = scope === "global" ? null : companyId;
    const resolvedTools = await this.resolveToolsForSync(dto, bindingCompanyId);
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_BINDINGS_SYNCED",
        companyId,
        metadata: {
          role: dto.role,
          scope,
          capabilities: dto.capabilities ?? [],
          tools: resolvedTools,
          connectors: dto.connectors ?? [],
          ...governanceMetadata,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async resolveToolsForSync(
    dto: UpsertAgentConfigDto,
    companyId: string | null,
  ): Promise<string[]> {
    if (dto.tools) {
      return dto.tools;
    }

    const existingBindings = await this.getStoredToolBindings(dto.role, companyId);
    if (existingBindings.length > 0) {
      return existingBindings;
    }

    // Backward-compatibility bootstrap only for legacy clients that do not send explicit tool bindings yet.
    return (dto.capabilities ?? []).length > 0 && isAgentRuntimeRole(dto.role)
      ? getDefaultToolsForRole(dto.role)
      : [];
  }

  private async getStoredToolBindings(
    role: string,
    companyId: string | null,
  ): Promise<RaiToolName[]> {
    const rows = await this.prisma.agentToolBinding.findMany({
      where: { role, companyId, isEnabled: true },
      orderBy: { toolName: "asc" },
    });
    return rows.map((row) => row.toolName as RaiToolName);
  }

  private async getStoredConnectorBindings(
    role: string,
    companyId: string | null,
  ): Promise<NonNullable<UpsertAgentConfigDto["connectors"]>> {
    const rows = await this.prisma.agentConnectorBinding.findMany({
      where: { role, companyId, isEnabled: true },
      orderBy: { connectorName: "asc" },
    });
    return rows.map((row) => ({
      connectorName: row.connectorName,
      accessMode: row.accessMode as "read" | "write" | "governed_write",
      scopes: Array.isArray(row.scopes) ? (row.scopes as string[]) : [],
      isEnabled: row.isEnabled,
    }));
  }

  private toKernelDto(entry: EffectiveAgentKernelEntry): AgentKernelViewDto {
    return {
      runtimeProfile: entry.runtimeProfile,
      memoryPolicy: entry.memoryPolicy,
      outputContract: entry.outputContract,
      governancePolicy: entry.governancePolicy,
      toolBindings: entry.toolBindings,
      connectorBindings: entry.connectorBindings,
    };
  }
}

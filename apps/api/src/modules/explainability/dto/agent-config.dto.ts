import { z } from "zod";
import {
  isAgentRuntimeRole,
} from "../../rai-chat/agent-registry.service";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";
import { AgentAutonomyMode, AgentMemoryScope } from "../../rai-chat/agent-platform/agent-platform.types";
import {
  FALLBACK_MODES,
  RuntimeGovernanceOverrides,
} from "../../rai-chat/runtime-governance/runtime-governance-policy.types";

export const AgentRuntimeRoleSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/)
  .refine((value) => isAgentRuntimeRole(value) || value.includes("_") || /^[a-z]+$/.test(value), {
    message: "role must be a lowercase runtime role or future-agent manifest role",
  });

const RuntimeGovernanceFallbackPolicySchema = z
  .object({
    NONE: z.enum(FALLBACK_MODES).optional(),
    BUDGET_DENIED: z.enum(FALLBACK_MODES).optional(),
    BUDGET_DEGRADED: z.enum(FALLBACK_MODES).optional(),
    POLICY_BLOCKED: z.enum(FALLBACK_MODES).optional(),
    PENDING_USER_CONFIRMATION: z.enum(FALLBACK_MODES).optional(),
    DEADLINE_EXCEEDED: z.enum(FALLBACK_MODES).optional(),
    TOOL_FAILURE: z.enum(FALLBACK_MODES).optional(),
    NO_INTENT_OWNER: z.enum(FALLBACK_MODES).optional(),
    NO_EVIDENCE: z.enum(FALLBACK_MODES).optional(),
    LLM_UNAVAILABLE: z.enum(FALLBACK_MODES).optional(),
    REPLAY_MODE: z.enum(FALLBACK_MODES).optional(),
    NEEDS_MORE_DATA: z.enum(FALLBACK_MODES).optional(),
  })
  .strict();

const RuntimeConcurrencyEnvelopeSchema = z
  .object({
    maxParallelToolCalls: z.number().int().positive().optional(),
    maxParallelGroups: z.number().int().positive().optional(),
    deadlineMs: z.number().int().positive().optional(),
  })
  .strict();

const RuntimeTruthfulnessThresholdsSchema = z
  .object({
    bsReviewThresholdPct: z.number().min(0).max(100).optional(),
    bsQuarantineThresholdPct: z.number().min(0).max(100).optional(),
    evidenceCoverageMinPct: z.number().min(0).max(100).optional(),
  })
  .strict();

const RuntimeBudgetThresholdsSchema = z
  .object({
    degradePct: z.number().min(0).max(100).optional(),
    denyPct: z.number().min(0).max(100).optional(),
    budgetDeniedRateThresholdPct: z.number().min(0).max(100).optional(),
  })
  .strict();

const RuntimeRecommendationThresholdsSchema = z
  .object({
    bsReviewThresholdPct: z.number().min(0).max(100).optional(),
    bsQuarantineThresholdPct: z.number().min(0).max(100).optional(),
    budgetDeniedRateThresholdPct: z.number().min(0).max(100).optional(),
    queueSaturationThreshold: z.enum(["PRESSURED", "SATURATED"]).optional(),
    toolFailureRateThresholdPct: z.number().min(0).max(100).optional(),
  })
  .strict();

const RuntimeGovernanceOverridesSchema = z
  .object({
    concurrencyEnvelope: RuntimeConcurrencyEnvelopeSchema.optional(),
    truthfulnessThresholds: RuntimeTruthfulnessThresholdsSchema.optional(),
    budgetThresholds: RuntimeBudgetThresholdsSchema.optional(),
    fallbackPolicy: RuntimeGovernanceFallbackPolicySchema.optional(),
    recommendationThresholds: RuntimeRecommendationThresholdsSchema.optional(),
  })
  .strict();

export const UpsertAgentConfigDtoSchema = z.object({
  name: z.string().min(1),
  role: AgentRuntimeRoleSchema,
  systemPrompt: z.string(),
  llmModel: z.string().min(1),
  maxTokens: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  capabilities: z.union([z.array(z.string()), z.undefined()]).transform((v) => (v ?? [])),
  tools: z.union([z.array(z.nativeEnum(RaiToolName)), z.undefined()]).optional(),
  autonomyMode: z
    .enum(["advisory", "hybrid", "autonomous"] satisfies [AgentAutonomyMode, ...AgentAutonomyMode[]])
    .optional()
    .default("advisory"),
  runtimeProfile: z
    .object({
      modelRoutingClass: z.enum(["cheap", "fast", "strong"]).optional(),
      provider: z.literal("openrouter").optional(),
      model: z.string().min(1).optional(),
      executionAdapterRole: z.string().min(2).max(64).optional(),
      maxInputTokens: z.number().int().positive().optional(),
      maxOutputTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(2).optional(),
      timeoutMs: z.number().int().positive().optional(),
      supportsStreaming: z.boolean().optional(),
    })
    .optional(),
  responsibilityBinding: z
    .object({
      role: z.string().min(2).max(64),
      inheritsFromRole: z.enum([
        "agronomist",
        "economist",
        "knowledge",
        "monitoring",
        "crm_agent",
        "front_office_agent",
        "contracts_agent",
      ]),
      overrides: z
        .object({
          title: z.string().min(1).optional(),
          allowedIntents: z
            .array(
              z.enum([
                "tech_map_draft",
                "compute_deviations",
                "compute_plan_fact",
                "simulate_scenario",
                "compute_risk_assessment",
                "query_knowledge",
                "emit_alerts",
                "register_counterparty",
                "create_counterparty_relation",
                "create_crm_account",
                "review_account_workspace",
                "update_account_profile",
                "create_crm_contact",
                "update_crm_contact",
                "delete_crm_contact",
                "log_crm_interaction",
                "update_crm_interaction",
                "delete_crm_interaction",
                "create_crm_obligation",
                "update_crm_obligation",
                "delete_crm_obligation",
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
                "log_dialog_message",
                "classify_dialog_thread",
                "create_front_office_escalation",
              ]),
            )
            .optional(),
          forbiddenIntents: z
            .array(
              z.enum([
                "tech_map_draft",
                "compute_deviations",
                "compute_plan_fact",
                "simulate_scenario",
                "compute_risk_assessment",
                "query_knowledge",
                "emit_alerts",
                "register_counterparty",
                "create_counterparty_relation",
                "create_crm_account",
                "review_account_workspace",
                "update_account_profile",
                "create_crm_contact",
                "update_crm_contact",
                "delete_crm_contact",
                "log_crm_interaction",
                "update_crm_interaction",
                "delete_crm_interaction",
                "create_crm_obligation",
                "update_crm_obligation",
                "delete_crm_obligation",
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
                "log_dialog_message",
                "classify_dialog_thread",
                "create_front_office_escalation",
              ]),
            )
            .optional(),
          extraUiActions: z.array(z.string().min(1)).optional(),
        })
        .optional(),
    })
    .optional(),
  memoryPolicy: z
    .object({
      allowedScopes: z
        .array(
          z.enum(
            [
              "tenant",
              "domain",
              "user",
              "team",
              "task_workflow",
              "sensitive_compliance",
            ] satisfies [AgentMemoryScope, ...AgentMemoryScope[]],
          ),
        )
        .optional(),
      retrievalPolicy: z.string().optional(),
      writePolicy: z.string().optional(),
      sensitiveDataPolicy: z.string().optional(),
    })
    .optional(),
  outputContract: z
    .object({
      contractId: z.string().min(1).optional(),
      responseSchemaVersion: z.string().min(1).optional(),
      sections: z.array(z.string()).optional(),
      requiresEvidence: z.boolean().optional(),
      requiresDeterministicValidation: z.boolean().optional(),
      fallbackMode: z.string().optional(),
    })
    .optional(),
  governancePolicy: z
    .object({
      policyId: z.string().min(1).optional(),
      allowedAutonomyModes: z.array(z.enum(["advisory", "hybrid", "autonomous"])).optional(),
      humanGateRules: z.array(z.string()).optional(),
      criticalActionRules: z.array(z.string()).optional(),
      auditRequirements: z.array(z.string()).optional(),
      fallbackRules: z.array(z.string()).optional(),
      runtimeGovernanceOverrides: RuntimeGovernanceOverridesSchema.optional(),
    })
    .optional(),
  connectors: z
    .array(
      z.object({
        connectorName: z.string().min(1),
        accessMode: z.enum(["read", "write", "governed_write"]),
        scopes: z.array(z.string()).default([]),
        isEnabled: z.boolean().optional().default(true),
      }),
    )
    .optional(),
});
export type UpsertAgentConfigDto = z.infer<typeof UpsertAgentConfigDtoSchema>;

export interface AgentConfigItemDto {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  llmModel: string;
  maxTokens: number;
  isActive: boolean;
  companyId: string | null;
  capabilities: string[];
  autonomyMode?: AgentAutonomyMode;
  runtimeProfile?: Record<string, unknown>;
  memoryPolicy?: Record<string, unknown>;
  outputContract?: Record<string, unknown>;
  governancePolicy?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentKernelViewDto {
  runtimeProfile: {
    profileId: string;
    modelRoutingClass: "cheap" | "fast" | "strong";
    provider: "openrouter";
    model: string;
    executionAdapterRole?: string;
    maxInputTokens: number;
    maxOutputTokens: number;
    temperature: number;
    timeoutMs: number;
    supportsStreaming: boolean;
  };
  memoryPolicy: {
    policyId: string;
    allowedScopes: string[];
    retrievalPolicy: string;
    writePolicy: string;
    sensitiveDataPolicy: string;
  };
  outputContract: {
    contractId: string;
    responseSchemaVersion: string;
    sections: string[];
    requiresEvidence: boolean;
    requiresDeterministicValidation: boolean;
    fallbackMode: string;
  };
  governancePolicy: {
    policyId: string;
    allowedAutonomyModes: string[];
    humanGateRules: string[];
    criticalActionRules: string[];
    auditRequirements: string[];
    fallbackRules: string[];
    runtimeGovernanceOverrides?: RuntimeGovernanceOverrides;
  };
  toolBindings: Array<{
    toolName: string;
    isEnabled: boolean;
    requiresHumanGate: boolean;
    riskLevel: string;
  }>;
  connectorBindings: Array<{
    connectorName: string;
    accessMode: string;
    scopes: string[];
  }>;
}

export interface AgentRegistryItemDto {
  role: string;
  agentName: string;
  businessRole: string;
  ownerDomain: string;
  runtime: {
    configId: string | null;
    source: "global" | "tenant";
    bindingsSource: "persisted" | "bootstrap";
    llmModel: string;
    maxTokens: number;
    systemPrompt: string;
    capabilities: string[];
    tools: RaiToolName[];
    isActive: boolean;
  };
  tenantAccess: {
    companyId: string;
    mode: "INHERITED" | "OVERRIDE" | "DENIED";
    source: "global" | "tenant";
    isActive: boolean;
  };
  kernel?: AgentKernelViewDto;
}

export interface AgentConfigsResponseDto {
  global: AgentConfigItemDto[];
  tenantOverrides: AgentConfigItemDto[];
  agents: AgentRegistryItemDto[];
}

export interface AgentConfigChangeRequestDto {
  id: string;
  role: string;
  scope: "GLOBAL" | "TENANT";
  targetVersion: string;
  status:
    | "EVAL_FAILED"
    | "READY_FOR_CANARY"
    | "CANARY_ACTIVE"
    | "APPROVED_FOR_PRODUCTION"
    | "PROMOTED"
    | "ROLLED_BACK";
  evalVerdict: string | null;
  canaryStatus: "NOT_STARTED" | "ACTIVE" | "PASSED" | "DEGRADED";
  rollbackStatus: "NOT_REQUIRED" | "EXECUTED";
  productionDecision: "PENDING" | "APPROVED" | "REJECTED" | "ROLLED_BACK";
  requestedConfig: UpsertAgentConfigDto;
  promotedAt: Date | null;
  rolledBackAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CanaryReviewDtoSchema = z.object({
  baselineRejectionRate: z.number().min(0).max(1),
  canaryRejectionRate: z.number().min(0).max(1),
  sampleSize: z.number().int().nonnegative(),
});
export type CanaryReviewDto = z.infer<typeof CanaryReviewDtoSchema>;

export const RollbackChangeDtoSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type RollbackChangeDto = z.infer<typeof RollbackChangeDtoSchema>;

export const AgentTemplateIdSchema = z.enum([
  "marketer",
  "strategist",
  "finance_advisor",
  "legal_advisor",
  "crm_agent",
  "front_office_agent",
  "contracts_agent",
  "controller",
  "personal_assistant",
]);
export type AgentTemplateId = z.infer<typeof AgentTemplateIdSchema>;

export const FutureAgentManifestDtoSchema = z.object({
  templateId: AgentTemplateIdSchema.optional(),
  role: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1).max(120),
  kind: z.enum(["domain_advisor", "worker_hybrid", "personal_delegated"]),
  ownerDomain: z.string().min(2).max(64),
  description: z.string().min(1).max(500),
  defaultAutonomyMode: z.enum(["advisory", "hybrid", "autonomous"]),
  runtimeProfile: z.object({
    profileId: z.string().min(1),
    modelRoutingClass: z.enum(["cheap", "fast", "strong"]),
    provider: z.literal("openrouter"),
    model: z.string().min(1),
    executionAdapterRole: z.string().min(2).max(64).optional(),
    maxInputTokens: z.number().int().positive(),
    maxOutputTokens: z.number().int().positive(),
    temperature: z.number().min(0).max(2),
    timeoutMs: z.number().int().positive(),
    supportsStreaming: z.boolean(),
  }),
  responsibilityBinding: z
    .object({
      role: z.string().min(2).max(64),
      inheritsFromRole: z.enum([
        "agronomist",
        "economist",
        "knowledge",
        "monitoring",
        "crm_agent",
        "front_office_agent",
        "contracts_agent",
      ]),
      overrides: z
        .object({
          title: z.string().min(1).optional(),
          allowedIntents: z
            .array(
              z.enum([
                "tech_map_draft",
                "compute_deviations",
                "compute_plan_fact",
                "simulate_scenario",
                "compute_risk_assessment",
                "query_knowledge",
                "emit_alerts",
                "register_counterparty",
                "create_counterparty_relation",
                "create_crm_account",
                "review_account_workspace",
                "update_account_profile",
                "create_crm_contact",
                "update_crm_contact",
                "delete_crm_contact",
                "log_crm_interaction",
                "update_crm_interaction",
                "delete_crm_interaction",
                "create_crm_obligation",
                "update_crm_obligation",
                "delete_crm_obligation",
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
                "log_dialog_message",
                "classify_dialog_thread",
                "create_front_office_escalation",
              ]),
            )
            .optional(),
          forbiddenIntents: z
            .array(
              z.enum([
                "tech_map_draft",
                "compute_deviations",
                "compute_plan_fact",
                "simulate_scenario",
                "compute_risk_assessment",
                "query_knowledge",
                "emit_alerts",
                "register_counterparty",
                "create_counterparty_relation",
                "create_crm_account",
                "review_account_workspace",
                "update_account_profile",
                "create_crm_contact",
                "update_crm_contact",
                "delete_crm_contact",
                "log_crm_interaction",
                "update_crm_interaction",
                "delete_crm_interaction",
                "create_crm_obligation",
                "update_crm_obligation",
                "delete_crm_obligation",
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
                "log_dialog_message",
                "classify_dialog_thread",
                "create_front_office_escalation",
              ]),
            )
            .optional(),
          extraUiActions: z.array(z.string().min(1)).optional(),
        })
        .optional(),
    })
    .optional(),
  memoryPolicy: z.object({
    policyId: z.string().min(1),
    allowedScopes: z.array(
      z.enum(
        [
          "tenant",
          "domain",
          "user",
          "team",
          "task_workflow",
          "sensitive_compliance",
        ] satisfies [AgentMemoryScope, ...AgentMemoryScope[]],
      ),
    ),
    retrievalPolicy: z.string().min(1),
    writePolicy: z.string().min(1),
    sensitiveDataPolicy: z.string().min(1),
  }),
  capabilityPolicy: z.object({
    capabilities: z.array(z.string().min(1)),
    toolAccessMode: z.literal("allowlist"),
    connectorAccessMode: z.literal("allowlist"),
  }),
  toolBindings: z.array(
    z.object({
      toolName: z.string().min(1),
      isEnabled: z.boolean(),
      requiresHumanGate: z.boolean(),
      riskLevel: z.enum(["READ", "WRITE", "CRITICAL"]),
    }),
  ),
  connectorBindings: z.array(
    z.object({
      connectorName: z.string().min(1),
      accessMode: z.enum(["read", "write", "governed_write"]),
      scopes: z.array(z.string()),
    }),
  ),
  outputContract: z.object({
    contractId: z.string().min(1),
    responseSchemaVersion: z.string().min(1),
    sections: z.array(z.string().min(1)).min(1),
    requiresEvidence: z.boolean(),
    requiresDeterministicValidation: z.boolean(),
    fallbackMode: z.string().min(1),
  }),
  governancePolicy: z.object({
    policyId: z.string().min(1),
    allowedAutonomyModes: z.array(z.enum(["advisory", "hybrid", "autonomous"])).min(1),
    humanGateRules: z.array(z.string()),
    criticalActionRules: z.array(z.string()),
    auditRequirements: z.array(z.string()).min(1),
    fallbackRules: z.array(z.string()).min(1),
    runtimeGovernanceOverrides: RuntimeGovernanceOverridesSchema.optional(),
  }),
  domainAdapter: z
    .object({
      adapterId: z.string().min(1),
      status: z.enum(["optional", "required"]),
      notes: z.string().min(1),
    })
    .optional(),
});
export type FutureAgentManifestDto = z.infer<typeof FutureAgentManifestDtoSchema>;

export interface FutureAgentTemplateDto {
  templateId: AgentTemplateId;
  label: string;
  manifest: FutureAgentManifestDto;
  rolloutChecklist: string[];
}

export interface FutureAgentTemplatesResponseDto {
  templates: FutureAgentTemplateDto[];
}

export interface FutureAgentManifestValidationDto {
  valid: boolean;
  normalizedRole: string;
  compatibleWithRuntimeWithoutCodeChanges: boolean;
  missingRequirements: string[];
  warnings: string[];
}

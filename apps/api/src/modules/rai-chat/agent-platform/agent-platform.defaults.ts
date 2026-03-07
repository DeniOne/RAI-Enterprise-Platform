import {
  CanonicalAgentRuntimeRole,
  isAgentRuntimeRole,
} from "../agent-registry.service";
import {
  AgentCapabilityPolicy,
  AgentConnectorBinding,
  AgentDefinitionKernel,
  AgentGovernancePolicy,
  AgentMemoryPolicy,
  AgentOutputContract,
  AgentRuntimeProfile,
  AgentToolBindingPolicy,
  EffectiveAgentKernelEntry,
} from "./agent-platform.types";
import { DEFAULT_TOOL_BINDINGS } from "../agent-registry.service";
import { TOOL_RISK_MAP } from "../tools/rai-tools.types";

const OUTPUT_CONTRACTS: Record<CanonicalAgentRuntimeRole, AgentOutputContract> = {
  agronomist: {
    contractId: "agronom-v1",
    responseSchemaVersion: "v1",
    sections: ["summary", "deterministic_basis", "assumptions", "missing_data", "evidence"],
    requiresEvidence: true,
    requiresDeterministicValidation: true,
    fallbackMode: "deterministic_summary",
  },
  economist: {
    contractId: "economist-v1",
    responseSchemaVersion: "v1",
    sections: ["summary", "key_metrics", "risks", "evidence", "caveats"],
    requiresEvidence: true,
    requiresDeterministicValidation: true,
    fallbackMode: "deterministic_summary",
  },
  knowledge: {
    contractId: "knowledge-v1",
    responseSchemaVersion: "v1",
    sections: ["answer", "sources", "confidence", "missing_corpus_notice"],
    requiresEvidence: true,
    requiresDeterministicValidation: false,
    fallbackMode: "retrieval_summary",
  },
  monitoring: {
    contractId: "monitoring-v1",
    responseSchemaVersion: "v1",
    sections: ["signal_summary", "alerts", "evidence_snapshot", "gate_status"],
    requiresEvidence: true,
    requiresDeterministicValidation: true,
    fallbackMode: "alert_summary",
  },
};

const MEMORY_POLICIES: Record<CanonicalAgentRuntimeRole, AgentMemoryPolicy> = {
  agronomist: {
    policyId: "agronom-memory-v1",
    allowedScopes: ["tenant", "domain", "task_workflow"],
    retrievalPolicy: "scoped_recall",
    writePolicy: "append_summary",
    sensitiveDataPolicy: "allow_masked_only",
  },
  economist: {
    policyId: "economist-memory-v1",
    allowedScopes: ["tenant", "domain", "task_workflow", "sensitive_compliance"],
    retrievalPolicy: "scoped_recall",
    writePolicy: "append_summary",
    sensitiveDataPolicy: "mask",
  },
  knowledge: {
    policyId: "knowledge-memory-v1",
    allowedScopes: ["tenant", "domain", "team"],
    retrievalPolicy: "scoped_recall",
    writePolicy: "append_interaction",
    sensitiveDataPolicy: "mask",
  },
  monitoring: {
    policyId: "monitoring-memory-v1",
    allowedScopes: ["tenant", "domain", "task_workflow"],
    retrievalPolicy: "scoped_recall",
    writePolicy: "none",
    sensitiveDataPolicy: "deny",
  },
};

const GOVERNANCE_POLICIES: Record<CanonicalAgentRuntimeRole, AgentGovernancePolicy> = {
  agronomist: {
    policyId: "agronom-governance-v1",
    allowedAutonomyModes: ["advisory"],
    humanGateRules: ["write_tools_require_review"],
    criticalActionRules: ["no_critical_actions"],
    auditRequirements: ["trace", "evidence", "validation"],
    fallbackRules: ["use_deterministic_summary_if_llm_unavailable"],
  },
  economist: {
    policyId: "economist-governance-v1",
    allowedAutonomyModes: ["advisory"],
    humanGateRules: ["finance_actions_disallowed"],
    criticalActionRules: ["no_critical_actions"],
    auditRequirements: ["trace", "evidence", "validation"],
    fallbackRules: ["use_deterministic_summary_if_llm_unavailable"],
  },
  knowledge: {
    policyId: "knowledge-governance-v1",
    allowedAutonomyModes: ["advisory"],
    humanGateRules: ["sources_must_be_attached_when_available"],
    criticalActionRules: ["no_mutations"],
    auditRequirements: ["trace", "evidence"],
    fallbackRules: ["use_retrieval_summary_if_llm_unavailable"],
  },
  monitoring: {
    policyId: "monitoring-governance-v1",
    allowedAutonomyModes: ["advisory", "hybrid"],
    humanGateRules: ["write_actions_require_governed_gate"],
    criticalActionRules: ["deny_unrestricted_writes"],
    auditRequirements: ["trace", "evidence", "gate_status"],
    fallbackRules: ["use_alert_summary_if_llm_unavailable"],
  },
};

const CAPABILITY_POLICIES: Record<CanonicalAgentRuntimeRole, AgentCapabilityPolicy> = {
  agronomist: {
    capabilities: ["AgroToolsRegistry"],
    toolAccessMode: "allowlist",
    connectorAccessMode: "allowlist",
  },
  economist: {
    capabilities: ["FinanceToolsRegistry"],
    toolAccessMode: "allowlist",
    connectorAccessMode: "allowlist",
  },
  knowledge: {
    capabilities: ["KnowledgeToolsRegistry"],
    toolAccessMode: "allowlist",
    connectorAccessMode: "allowlist",
  },
  monitoring: {
    capabilities: ["RiskToolsRegistry"],
    toolAccessMode: "allowlist",
    connectorAccessMode: "allowlist",
  },
};

const CONNECTOR_BINDINGS: Record<CanonicalAgentRuntimeRole, AgentConnectorBinding[]> = {
  agronomist: [],
  economist: [],
  knowledge: [],
  monitoring: [],
};

export function buildDefaultRuntimeProfile(
  role: CanonicalAgentRuntimeRole,
  model: string,
  maxTokens: number,
): AgentRuntimeProfile {
  const modelRoutingClass =
    role === "monitoring" ? "cheap" : role === "knowledge" ? "fast" : "strong";
  return {
    profileId: `${role}-runtime-v1`,
    modelRoutingClass,
    provider: "openrouter",
    model,
    maxInputTokens: Math.max(maxTokens, 4000),
    maxOutputTokens: Math.min(Math.max(Math.floor(maxTokens / 2), 800), 8000),
    temperature: role === "monitoring" ? 0.1 : 0.2,
    timeoutMs: 15_000,
    supportsStreaming: false,
  };
}

export function buildDefaultDefinition(
  role: string,
  baseRole: CanonicalAgentRuntimeRole,
  name: string,
  ownerDomain: string,
  description: string,
): AgentDefinitionKernel {
  return {
    role,
    name,
    kind: baseRole === "monitoring" ? "worker_hybrid" : "domain_advisor",
    ownerDomain,
    description,
    defaultAutonomyMode: baseRole === "monitoring" ? "hybrid" : "advisory",
    outputContractId: OUTPUT_CONTRACTS[baseRole].contractId,
    runtimeProfileId: `${role}-runtime-v1`,
    governancePolicyId: GOVERNANCE_POLICIES[baseRole].policyId,
    memoryPolicyId: MEMORY_POLICIES[baseRole].policyId,
  };
}

export function buildDefaultToolBindings(role: CanonicalAgentRuntimeRole): AgentToolBindingPolicy[] {
  return DEFAULT_TOOL_BINDINGS[role].map((toolName) => ({
    toolName,
    isEnabled: true,
    requiresHumanGate: TOOL_RISK_MAP[toolName]?.riskLevel !== "READ",
    riskLevel: TOOL_RISK_MAP[toolName]?.riskLevel ?? "READ",
  }));
}

export function buildKernelEntry(params: {
  role: string;
  baseRole?: CanonicalAgentRuntimeRole;
  name: string;
  ownerDomain: string;
  description: string;
  model: string;
  maxTokens: number;
  systemPrompt: string;
  isActive: boolean;
  source: "global" | "tenant";
  bindingsSource: "persisted" | "bootstrap";
  capabilities: string[];
  enabledTools: string[];
  autonomyMode?: "advisory" | "hybrid" | "autonomous";
  runtimeProfileOverride?: Partial<AgentRuntimeProfile>;
  memoryPolicyOverride?: Partial<AgentMemoryPolicy>;
  outputContractOverride?: Partial<AgentOutputContract>;
  governancePolicyOverride?: Partial<AgentGovernancePolicy>;
  connectorBindingsOverride?: AgentConnectorBinding[];
}): EffectiveAgentKernelEntry {
  const resolvedBaseRole =
    params.baseRole ?? (isAgentRuntimeRole(params.role) ? params.role : "knowledge");
  const capabilityPolicy = {
    ...CAPABILITY_POLICIES[resolvedBaseRole],
    capabilities: params.capabilities,
  };
  const toolBindings = buildDefaultToolBindings(resolvedBaseRole).map((binding) => ({
    ...binding,
    isEnabled: params.enabledTools.includes(binding.toolName),
  }));

  const definition = buildDefaultDefinition(
    params.role,
    resolvedBaseRole,
    params.name,
    params.ownerDomain,
    params.description,
  );
  if (params.autonomyMode) {
    definition.defaultAutonomyMode = params.autonomyMode;
  }

  return {
    definition,
    runtimeProfile: {
      ...buildDefaultRuntimeProfile(resolvedBaseRole, params.model, params.maxTokens),
      ...(params.runtimeProfileOverride ?? {}),
    },
    memoryPolicy: {
      ...MEMORY_POLICIES[resolvedBaseRole],
      ...(params.memoryPolicyOverride ?? {}),
    },
    capabilityPolicy,
    toolBindings,
    connectorBindings: params.connectorBindingsOverride ?? CONNECTOR_BINDINGS[resolvedBaseRole],
    outputContract: {
      ...OUTPUT_CONTRACTS[resolvedBaseRole],
      ...(params.outputContractOverride ?? {}),
    },
    governancePolicy: {
      ...GOVERNANCE_POLICIES[resolvedBaseRole],
      ...(params.governancePolicyOverride ?? {}),
    },
    systemPrompt: params.systemPrompt,
    isActive: params.isActive,
    source: params.source,
    bindingsSource: params.bindingsSource,
  };
}

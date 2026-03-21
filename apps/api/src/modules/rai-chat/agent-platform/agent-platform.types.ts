import {
  EvidenceReference,
  RuntimeBudgetDto,
  RuntimeGovernanceDto,
  WorkspaceContextDto,
} from "../dto/rai-chat.dto";
import { RaiToolCallDto } from "../dto/rai-chat.dto";
import {
  DelegationChainStep,
  RaiSuggestedAction,
  TokenUsage,
} from "../../../shared/rai-chat/rai-tools.types";
import {
  BranchResultContract,
  BranchTrustAssessment,
  UserFacingBranchCompositionPayload,
} from "../../../shared/rai-chat/branch-trust.types";
import { RuntimeGovernanceOverrides } from "../../../shared/rai-chat/runtime-governance-policy.types";
import { SemanticRoutingContext } from "../../../shared/rai-chat/semantic-routing.types";
import { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";

export type AgentKind = "domain_advisor" | "worker_hybrid" | "personal_delegated";
export type AgentAutonomyMode = "advisory" | "hybrid" | "autonomous";
export type AgentMemoryScope =
  | "tenant"
  | "domain"
  | "user"
  | "team"
  | "task_workflow"
  | "sensitive_compliance";

export interface AgentMemoryPolicy {
  policyId: string;
  allowedScopes: AgentMemoryScope[];
  retrievalPolicy: "scoped_recall";
  writePolicy: "append_interaction" | "append_summary" | "none";
  sensitiveDataPolicy: "mask" | "deny" | "allow_masked_only";
}

export interface AgentCapabilityPolicy {
  capabilities: string[];
  toolAccessMode: "allowlist";
  connectorAccessMode: "allowlist";
}

export interface AgentToolBindingPolicy {
  toolName: string;
  isEnabled: boolean;
  requiresHumanGate: boolean;
  riskLevel: "READ" | "WRITE" | "CRITICAL";
}

export interface AgentConnectorBinding {
  connectorName: string;
  accessMode: "read" | "write" | "governed_write";
  scopes: string[];
}

export interface AgentOutputContract {
  contractId: string;
  responseSchemaVersion: string;
  sections: string[];
  requiresEvidence: boolean;
  requiresDeterministicValidation: boolean;
  fallbackMode: "deterministic_summary" | "retrieval_summary" | "alert_summary";
}

export interface AgentGovernancePolicy {
  policyId: string;
  allowedAutonomyModes: AgentAutonomyMode[];
  humanGateRules: string[];
  criticalActionRules: string[];
  auditRequirements: string[];
  fallbackRules: string[];
  runtimeGovernanceOverrides?: RuntimeGovernanceOverrides;
}

export interface AgentRuntimeProfile {
  profileId: string;
  modelRoutingClass: "cheap" | "fast" | "strong";
  provider: "openrouter";
  model: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
  supportsStreaming: boolean;
  executionAdapterRole?: string;
}

export interface AgentDefinitionKernel {
  role: string;
  name: string;
  kind: AgentKind;
  ownerDomain: string;
  description: string;
  defaultAutonomyMode: AgentAutonomyMode;
  outputContractId: string;
  runtimeProfileId: string;
  governancePolicyId: string;
  memoryPolicyId: string;
}

export interface AgentMemoryContext {
  profile: Record<string, unknown>;
  recalledEpisodes: Array<{
    content: string;
    similarity: number;
    confidence?: number;
    source?: string;
  }>;
  /** L4: Когнитивная память — энграммы (Trigger→Action→Outcome) */
  recalledEngrams?: Array<{
    id: string;
    category: string;
    content: string;
    compositeScore: number;
    synapticWeight: number;
    successRate: number;
    activationCount: number;
    keyInsights: string[];
  }>;
  /** L1: Активные алерты из мониторинга */
  activeAlerts?: Array<{
    id: string;
    severity: string;
    type: string;
    message: string;
  }>;
}

export interface AgentExecutionRequest {
  role: string;
  message: string;
  workspaceContext?: WorkspaceContextDto;
  memoryContext: AgentMemoryContext;
  requestedTools?: RaiToolCallDto[];
  requestedConnectors?: string[];
  semanticRouting?: SemanticRoutingContext;
  semanticIngressFrame?: SemanticIngressFrame;
  traceId: string;
  threadId: string;
}

export interface AgentExecutionValidation {
  passed: boolean;
  reasons: string[];
}

export interface AgentExecutionAuditPayload {
  runtimeMode: "tool-first-legacy" | "agent-first-hybrid";
  model?: string;
  provider?: "openrouter";
  autonomyMode: AgentAutonomyMode;
  allowedToolNames: string[];
  blockedToolNames: string[];
  connectorNames: string[];
  outputContractId: string;
}

export interface AgentExecutionResult {
  role: string;
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA" | "RATE_LIMITED";
  executionPath?:
    | "tool_call_primary"
    | "heuristic_fallback"
    | "semantic_router_primary";
  text: string;
  structuredOutput: Record<string, unknown>;
  structuredOutputs?: Record<string, unknown>[];
  branchResults?: BranchResultContract[];
  branchTrustAssessments?: BranchTrustAssessment[];
  branchCompositions?: UserFacingBranchCompositionPayload[];
  delegationChain?: DelegationChainStep[];
  usage?: TokenUsage;
  toolCalls: Array<{ name: string; result: unknown }>;
  connectorCalls: Array<{ name: string; result: unknown }>;
  evidence: EvidenceReference[];
  validation: AgentExecutionValidation;
  runtimeBudget?: RuntimeBudgetDto;
  runtimeGovernance?: RuntimeGovernanceDto;
  fallbackUsed: boolean;
  outputContractVersion: string;
  auditPayload: AgentExecutionAuditPayload;
  suggestedActions?: RaiSuggestedAction[];
}

export interface EffectiveAgentKernelEntry {
  definition: AgentDefinitionKernel;
  runtimeProfile: AgentRuntimeProfile;
  memoryPolicy: AgentMemoryPolicy;
  capabilityPolicy: AgentCapabilityPolicy;
  toolBindings: AgentToolBindingPolicy[];
  connectorBindings: AgentConnectorBinding[];
  outputContract: AgentOutputContract;
  governancePolicy: AgentGovernancePolicy;
  systemPrompt: string;
  isActive: boolean;
  source: "global" | "tenant";
  bindingsSource: "persisted" | "bootstrap";
}

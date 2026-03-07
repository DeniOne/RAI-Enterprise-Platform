import { z } from "zod";
import {
  type AgentRuntimeRole,
} from "../../rai-chat/agent-registry.service";
import { RaiToolName } from "../../rai-chat/tools/rai-tools.types";

export const AgentRuntimeRoleSchema = z.enum([
  "agronomist",
  "economist",
  "knowledge",
  "monitoring",
]);

export const UpsertAgentConfigDtoSchema = z.object({
  name: z.string().min(1),
  role: AgentRuntimeRoleSchema,
  systemPrompt: z.string(),
  llmModel: z.string().min(1),
  maxTokens: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  capabilities: z.union([z.array(z.string()), z.undefined()]).transform((v) => (v ?? [])),
  tools: z.union([z.array(z.nativeEnum(RaiToolName)), z.undefined()]).optional(),
});
export type UpsertAgentConfigDto = z.infer<typeof UpsertAgentConfigDtoSchema>;

export interface AgentConfigItemDto {
  id: string;
  name: string;
  role: AgentRuntimeRole;
  systemPrompt: string;
  llmModel: string;
  maxTokens: number;
  isActive: boolean;
  companyId: string | null;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRegistryItemDto {
  role: AgentRuntimeRole;
  agentName: string;
  businessRole: string;
  ownerDomain: "agro" | "finance" | "knowledge" | "risk";
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
}

export interface AgentConfigsResponseDto {
  global: AgentConfigItemDto[];
  tenantOverrides: AgentConfigItemDto[];
  agents: AgentRegistryItemDto[];
}

export interface AgentConfigChangeRequestDto {
  id: string;
  role: AgentRuntimeRole;
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

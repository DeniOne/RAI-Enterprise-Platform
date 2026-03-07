import { Injectable } from "@nestjs/common";
import { RaiToolName } from "./tools/rai-tools.types";
import {
  AgentRegistryService,
  getDefaultToolsForRole,
  isAgentRuntimeRole,
  type AgentRuntimeRole,
} from "./agent-registry.service";
import { EffectiveAgentKernelEntry } from "./agent-platform/agent-platform.types";

export interface EffectiveAgentRuntimeConfig {
  role: string;
  isActive: boolean;
  capabilities: string[];
  tools: RaiToolName[];
  source: "tenant" | "global";
  bindingsSource: "persisted" | "bootstrap";
}

export interface ToolAccessDecision {
  allowed: boolean;
  reasonCode?: "AGENT_DISABLED" | "CAPABILITY_DENIED";
    role?: string;
  requiredCapability?: string;
  source?: "persisted" | "bootstrap";
}

@Injectable()
export class AgentRuntimeConfigService {
  constructor(private readonly agentRegistry: AgentRegistryService) {}

  async resolveToolAccess(
    companyId: string,
    toolName: RaiToolName,
  ): Promise<ToolAccessDecision> {
    const config = await this.getEffectiveConfigForTool(companyId, toolName);
    if (!config) {
      if (this.isGovernedTool(toolName)) {
        return {
          allowed: false,
          reasonCode: "CAPABILITY_DENIED",
          source: "persisted",
        };
      }
      return { allowed: true };
    }

    if (!config.isActive) {
      return {
        allowed: false,
        reasonCode: "AGENT_DISABLED",
        role: config.role,
        requiredCapability: this.primaryCapability(config.capabilities),
        source: config.bindingsSource,
      };
    }

    if (!config.tools.includes(toolName)) {
      return {
        allowed: false,
        reasonCode: "CAPABILITY_DENIED",
        role: config.role,
        requiredCapability: this.primaryCapability(config.capabilities),
        source: config.bindingsSource,
      };
    }

    return {
      allowed: true,
      role: config.role,
      requiredCapability: this.primaryCapability(config.capabilities),
      source: config.bindingsSource,
    };
  }

  async getEffectiveConfig(
    companyId: string,
    role: string,
  ): Promise<EffectiveAgentRuntimeConfig | null> {
    if (!isAgentRuntimeRole(role)) {
      const kernel = await this.agentRegistry.getEffectiveKernel(companyId, role);
      if (!kernel) {
        return null;
      }
      return {
        role: kernel.definition.role,
        isActive: kernel.isActive,
        capabilities: kernel.capabilityPolicy.capabilities,
        tools: kernel.toolBindings.filter((binding) => binding.isEnabled).map((binding) => binding.toolName as RaiToolName),
        source: kernel.source,
        bindingsSource: kernel.bindingsSource,
      };
    }
    const entry = await this.agentRegistry.getEffectiveAgent(companyId, role);
    if (!entry) {
      return null;
    }
    return {
      role: entry.definition.role,
      isActive: entry.runtime.isActive,
      capabilities: entry.runtime.capabilities,
      tools: entry.runtime.tools,
      source: entry.runtime.source,
      bindingsSource: entry.runtime.bindingsSource,
    };
  }

  async getEffectiveKernel(
    companyId: string,
    role: string,
  ): Promise<EffectiveAgentKernelEntry | null> {
    return this.agentRegistry.getEffectiveKernel(companyId, role);
  }

  private async getEffectiveConfigForTool(
    companyId: string,
    toolName: RaiToolName,
  ): Promise<EffectiveAgentRuntimeConfig | null> {
    const registry = await this.agentRegistry.getRegistry(companyId);
    const owner = registry.find((entry) => entry.runtime.tools.includes(toolName));
    if (!owner) {
      return null;
    }

    return {
      role: owner.definition.role,
      isActive: owner.runtime.isActive,
      capabilities: owner.runtime.capabilities,
      tools: owner.runtime.tools,
      source: owner.runtime.source,
      bindingsSource: owner.runtime.bindingsSource,
    };
  }

  private primaryCapability(capabilities: string[]): string | undefined {
    return capabilities[0];
  }

  private isGovernedTool(toolName: RaiToolName): boolean {
    return (["agronomist", "economist", "knowledge", "monitoring"] as const)
      .flatMap((role) => getDefaultToolsForRole(role))
      .includes(toolName);
  }
}

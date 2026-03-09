import { Injectable } from "@nestjs/common";
import { RuntimeGovernanceOverrideService } from "../rai-chat/runtime-governance/runtime-governance-override.service";

@Injectable()
export class RuntimeGovernanceControlService {
  constructor(
    private readonly overrides: RuntimeGovernanceOverrideService,
  ) {}

  async setManualAutonomyOverride(params: {
    companyId: string;
    level: "TOOL_FIRST" | "QUARANTINE";
    reason: string;
    userId?: string | null;
  }) {
    return this.overrides.setManualAutonomyOverride(params);
  }

  async clearManualAutonomyOverride(params: {
    companyId: string;
    userId?: string | null;
  }) {
    return this.overrides.clearManualAutonomyOverride(params);
  }
}

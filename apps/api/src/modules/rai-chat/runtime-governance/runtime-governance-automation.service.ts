import { Injectable } from "@nestjs/common";
import { AutonomyPolicyService } from "../autonomy-policy.service";
import {
  GovernanceRecommendationRecord,
  GovernanceRecommendationType,
} from "../../../shared/rai-chat/runtime-governance-policy.types";
import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance-feature-flags.service";
import { RuntimeGovernanceOverrideService } from "./runtime-governance-override.service";

@Injectable()
export class RuntimeGovernanceAutomationService {
  constructor(
    private readonly autonomyPolicy: AutonomyPolicyService,
    private readonly runtimeGovernanceOverride: RuntimeGovernanceOverrideService,
    private readonly featureFlags: RuntimeGovernanceFeatureFlagsService,
  ) {}

  async applyRecommendation(
    companyId: string,
    recommendation: GovernanceRecommendationRecord | null,
  ): Promise<{
    applied: boolean;
    level?: "TOOL_FIRST" | "QUARANTINE";
    reason?: string;
  }> {
    if (!recommendation) {
      return { applied: false };
    }

    const flags = this.featureFlags.getFlags();
    if (!flags.enforcementEnabled || !flags.autoQuarantineEnabled) {
      return { applied: false };
    }

    const targetLevel = this.resolveTargetLevel(recommendation.type);
    if (!targetLevel) {
      return { applied: false };
    }

    const current = await this.autonomyPolicy.getCompanyAutonomyStatus(companyId);
    if (
      current.manualOverride?.active &&
      (current.manualOverride.level === targetLevel ||
        current.manualOverride.level === "QUARANTINE")
    ) {
      return {
        applied: false,
        level: current.manualOverride.level,
        reason: current.manualOverride.reason,
      };
    }

    const reason = `auto:${recommendation.reason}`;
    await this.runtimeGovernanceOverride.setManualAutonomyOverride({
      companyId,
      level: targetLevel,
      reason,
      userId: null,
    });
    return {
      applied: true,
      level: targetLevel,
      reason,
    };
  }

  private resolveTargetLevel(
    type: GovernanceRecommendationType,
  ): "TOOL_FIRST" | "QUARANTINE" | null {
    switch (type) {
      case "REVIEW_REQUIRED":
      case "BUDGET_TUNING_RECOMMENDED":
      case "CONCURRENCY_TUNING_RECOMMENDED":
        return "TOOL_FIRST";
      case "QUARANTINE_RECOMMENDED":
      case "ROLLBACK_RECOMMENDED":
        return "QUARANTINE";
      default:
        return null;
    }
  }
}

import { Injectable } from "@nestjs/common";

export interface RuntimeGovernanceFeatureFlags {
  apiEnabled: boolean;
  uiEnabled: boolean;
  enforcementEnabled: boolean;
  autoQuarantineEnabled: boolean;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(raw);
}

@Injectable()
export class RuntimeGovernanceFeatureFlagsService {
  getFlags(): RuntimeGovernanceFeatureFlags {
    return {
      apiEnabled: parseBooleanEnv("RAI_RUNTIME_GOVERNANCE_API", true),
      uiEnabled: parseBooleanEnv("RAI_RUNTIME_GOVERNANCE_UI", true),
      enforcementEnabled: parseBooleanEnv(
        "RAI_RUNTIME_GOVERNANCE_ENFORCEMENT",
        true,
      ),
      autoQuarantineEnabled: parseBooleanEnv(
        "RAI_RUNTIME_GOVERNANCE_AUTO_QUARANTINE",
        true,
      ),
    };
  }
}

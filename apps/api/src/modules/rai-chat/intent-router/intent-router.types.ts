import { RaiToolName } from "../tools/rai-tools.types";
import { AgentRuntimeRole } from "../agent-registry.service";

export interface IntentClassification {
  targetRole: AgentRuntimeRole | null;
  intent: string | null;
  toolName: RaiToolName | null;
  confidence: number;
  method: "regex" | "llm";
  reason: string;
}

export interface WorkspaceContextForIntent {
  route?: string;
  activeEntityRefs?: Array<{ kind: string; id: string }>;
  filters?: Record<string, string | number | boolean | null>;
}

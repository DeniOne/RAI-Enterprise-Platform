import { RaiToolName } from "./rai-tools.types";

type AgentRuntimeRole = string;

export interface IntentClassification {
  targetRole: AgentRuntimeRole | null;
  intent: string | null;
  toolName: RaiToolName | null;
  confidence: number;
  method:
    | "regex"
    | "llm"
    | "tool_call_primary"
    | "clarification_resume"
    | "semantic_router_shadow"
    | "semantic_router_primary";
  reason: string;
}

export interface WorkspaceContextForIntent {
  route?: string;
  activeEntityRefs?: Array<{ kind: string; id: string }>;
  filters?: Record<string, string | number | boolean | null>;
}

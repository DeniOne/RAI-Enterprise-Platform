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
    | "explicit_tool_path"
    | "clarification_resume"
    | "semantic_route_shadow"
    | "semantic_route_primary";
  reason: string;
}

export interface WorkspaceContextForIntent {
  route?: string;
  activeEntityRefs?: Array<{ kind: string; id: string }>;
  filters?: Record<string, string | number | boolean | null>;
}

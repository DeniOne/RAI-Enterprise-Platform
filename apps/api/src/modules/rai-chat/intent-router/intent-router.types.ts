import { RaiToolName } from "../tools/rai-tools.types";

export interface IntentClassification {
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

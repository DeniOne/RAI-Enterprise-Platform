import { RaiToolName } from "./rai-tools.types";

export type CompositeExecutionStrategy =
  | "sequential"
  | "parallel"
  | "blocking";

export type CompositeWorkflowStageStatus =
  | "planned"
  | "completed"
  | "failed"
  | "blocked";

export type CompositeStagePayloadBindingWriteMode =
  | "overwrite"
  | "set_if_absent";

export interface CompositeStagePayloadBinding {
  sourceStageId: string;
  sourcePath: string;
  targetPath: string;
  required?: boolean;
  writeMode?: CompositeStagePayloadBindingWriteMode;
}

export interface CompositeWorkflowStageContract {
  stageId: string;
  order: number;
  agentRole: string;
  intent: string;
  toolName: RaiToolName;
  payload?: Record<string, unknown>;
  payloadBindings?: CompositeStagePayloadBinding[];
  label: string;
  dependsOn: string[];
  status: CompositeWorkflowStageStatus;
  summary?: string;
}

export interface CompositeWorkflowPlan {
  planId: string;
  workflowId: string;
  leadOwnerAgent: string;
  executionStrategy: CompositeExecutionStrategy;
  summary: string;
  stages: CompositeWorkflowStageContract[];
}

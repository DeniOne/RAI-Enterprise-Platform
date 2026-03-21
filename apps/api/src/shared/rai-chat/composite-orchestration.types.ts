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

export interface CompositeWorkflowStageContract {
  stageId: string;
  order: number;
  agentRole: string;
  intent: string;
  toolName: RaiToolName;
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

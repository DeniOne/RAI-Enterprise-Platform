import type {
  ExecutionPlan,
  ExecutionSurfaceState,
} from "../../shared/rai-chat/execution-target-state.types";

/** Срез планировщика для продолжения по threadId (пока in-memory на процесс). */
export interface PlannerThreadSliceV1 {
  version: "v1";
  sourceGraphId: string;
  executionPlan: ExecutionPlan;
  executionSurface: ExecutionSurfaceState;
}

export enum RaiToolName {
  EchoMessage = "echo_message",
  WorkspaceSnapshot = "workspace_snapshot",
  ComputeDeviations = "compute_deviations",
  ComputePlanFact = "compute_plan_fact",
  EmitAlerts = "emit_alerts",
  GenerateTechMapDraft = "generate_tech_map_draft",
}

export interface RaiToolActorContext {
  companyId: string;
  traceId: string;
}

export interface EchoMessagePayload {
  message: string;
}

export interface WorkspaceSnapshotPayload {
  route: string;
  lastUserAction?: string;
}

export interface ComputeDeviationsPayload {
  scope: {
    seasonId?: string;
    fieldId?: string;
  };
}

export interface ComputePlanFactPayload {
  scope: {
    planId?: string;
    seasonId?: string;
  };
}

export interface EmitAlertsPayload {
  severity?: "S3" | "S4";
}

export interface GenerateTechMapDraftPayload {
  fieldRef: string;
  seasonRef: string;
  crop: "rapeseed" | "sunflower";
}

export interface RaiToolPayloadMap {
  [RaiToolName.EchoMessage]: EchoMessagePayload;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotPayload;
  [RaiToolName.ComputeDeviations]: ComputeDeviationsPayload;
  [RaiToolName.ComputePlanFact]: ComputePlanFactPayload;
  [RaiToolName.EmitAlerts]: EmitAlertsPayload;
  [RaiToolName.GenerateTechMapDraft]: GenerateTechMapDraftPayload;
}

export interface EchoMessageResult {
  echoedMessage: string;
  companyId: string;
}

export interface WorkspaceSnapshotResult {
  route: string;
  hasSelection: boolean;
  lastUserAction?: string;
}

export interface ComputeDeviationsResult {
  count: number;
  seasonId?: string;
  fieldId?: string;
  items: Array<{
    id: string;
    status: string;
    harvestPlanId: string;
    budgetPlanId: string | null;
  }>;
}

export interface ComputePlanFactResult {
  planId: string;
  status: string;
  seasonId?: string | null;
  hasData: boolean;
  roi: number;
  ebitda: number;
  revenue: number;
  totalActualCost: number;
  totalPlannedCost: number;
}

export interface EmitAlertsResult {
  count: number;
  severity: "S3" | "S4";
  items: Array<{
    id: string;
    severity: string;
    reason: string;
    status: string;
    references: Record<string, unknown>;
  }>;
}

export interface GenerateTechMapDraftResult {
  draftId: string;
  status: "DRAFT";
  fieldRef: string;
  seasonRef: string;
  crop: "rapeseed" | "sunflower";
  missingMust: string[];
  tasks: [];
  assumptions: [];
}

export interface RaiToolResultMap {
  [RaiToolName.EchoMessage]: EchoMessageResult;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotResult;
  [RaiToolName.ComputeDeviations]: ComputeDeviationsResult;
  [RaiToolName.ComputePlanFact]: ComputePlanFactResult;
  [RaiToolName.EmitAlerts]: EmitAlertsResult;
  [RaiToolName.GenerateTechMapDraft]: GenerateTechMapDraftResult;
}

export interface RaiToolCall<TName extends RaiToolName = RaiToolName> {
  name: TName;
  payload: RaiToolPayloadMap[TName];
}

export interface RaiSuggestedAction {
  kind: "tool";
  toolName: RaiToolName;
  title: string;
  payload: RaiToolPayloadMap[RaiToolName];
}

export enum RaiToolName {
  EchoMessage = "echo_message",
  WorkspaceSnapshot = "workspace_snapshot",
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

export interface RaiToolPayloadMap {
  [RaiToolName.EchoMessage]: EchoMessagePayload;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotPayload;
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

export interface RaiToolResultMap {
  [RaiToolName.EchoMessage]: EchoMessageResult;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotResult;
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

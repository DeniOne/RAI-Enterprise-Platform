export type FrontOfficeIntent =
  | "observation"
  | "deviation"
  | "consultation"
  | "context_update";

export type FrontOfficeChannel = "telegram" | "web_chat" | "internal";

export type FrontOfficeDraftStatus =
  | "NEEDS_LINK"
  | "NEEDS_MUST_CLARIFICATION"
  | "READY_TO_CONFIRM"
  | "COMMITTED";

export type FrontOfficeThreadClassification =
  | "free_chat"
  | "task_process"
  | "client_request"
  | "escalation_signal";

export type FrontOfficeHandoffStatus =
  | "NEW"
  | "ROUTED"
  | "PENDING_APPROVAL"
  | "MANUAL_REQUIRED"
  | "CLAIMED"
  | "COMPLETED"
  | "REJECTED";

export type FrontOfficeResolutionMode =
  | "AUTO_REPLY"
  | "REQUEST_CLARIFICATION"
  | "PROCESS_DRAFT"
  | "HUMAN_HANDOFF";

export type FrontOfficeResponseRisk =
  | "SAFE_INFORMATIONAL"
  | "RESPONSIBLE_ACTION"
  | "INSUFFICIENT_CONTEXT"
  | "OPERATIONAL_SIGNAL"
  | "ESCALATION_SIGNAL";

export type FrontOfficeReplyStatus =
  | "NOT_SENT"
  | "SENT"
  | "SKIPPED"
  | "FAILED";

export type FrontOfficeThreadMessageKind =
  | "client_message"
  | "manager_reply"
  | "auto_reply"
  | "clarification_request"
  | "handoff_receipt"
  | "system_event";

export type FrontOfficeThreadMessageAuthorType =
  | "farm_representative"
  | "back_office_operator"
  | "rai"
  | "system";

export type FrontOfficeThreadDeliveryStatus =
  | "RECEIVED"
  | "SENT"
  | "SKIPPED"
  | "FAILED";

export type FrontOfficeClientReplyMode =
  | "disabled"
  | "shadow"
  | "pilot"
  | "rollout";

export interface FrontOfficeIntakeInput {
  channel: "telegram" | "web_chat" | "internal";
  messageText: string;
  direction?: "inbound" | "outbound";
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
  recipientExternalId?: string;
  route?: string;
  targetOwnerRole?: string;
  taskId?: string;
  fieldId?: string;
  seasonId?: string;
  sourceMessageId?: string;
  chatId?: string;
  photoUrl?: string;
  voiceUrl?: string;
  coordinates?: any;
  telemetryJson?: any;
}

export interface FrontOfficeDraftAnchor {
  farmRef: string | null;
  fieldId: string | null;
  seasonId: string | null;
  taskId: string | null;
}

export interface FrontOfficeDraftRecord {
  id: string;
  companyId: string;
  userId: string;
  status: FrontOfficeDraftStatus;
  eventType: string;
  timestamp: string;
  anchor: FrontOfficeDraftAnchor;
  payload: Record<string, any>;
  evidence: any[];
  confidence: number;
  mustClarifications: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface FrontOfficeCommittedRecord {
  id: string;
  companyId: string;
  eventType: string;
  timestamp: string;
  committedAt: string;
  committedBy: string;
  provenanceHash: string;
  payload: Record<string, any>;
  evidence: any[];
  anchor: FrontOfficeDraftAnchor;
}

export interface FrontOfficeThreadRecord {
  id: string;
  companyId: string;
  threadKey: string;
  channel: FrontOfficeChannel;
  farmAccountId: string | null;
  farmNameSnapshot: string | null;
  representativeUserId: string | null;
  representativeTelegramId: string | null;
  threadExternalId: string | null;
  dialogExternalId: string | null;
  senderExternalId: string | null;
  recipientExternalId: string | null;
  route: string | null;
  currentClassification: FrontOfficeThreadClassification | null;
  currentOwnerRole: string | null;
  currentHandoffStatus: FrontOfficeHandoffStatus | null;
  lastDraftId: string | null;
  lastMessageDirection: "inbound" | "outbound" | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FrontOfficeMessageRecord {
  id: string;
  companyId: string;
  threadId: string;
  draftId: string | null;
  auditLogId: string | null;
  traceId: string | null;
  channel: FrontOfficeChannel;
  direction: "inbound" | "outbound";
  messageText: string;
  sourceMessageId: string | null;
  chatId: string | null;
  route: string | null;
  evidence: any[] | null;
  metadata: Record<string, any> | null;
  kind: FrontOfficeThreadMessageKind;
  authorType: FrontOfficeThreadMessageAuthorType;
  deliveryStatus: FrontOfficeThreadDeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FrontOfficeHandoffRecord {
  id: string;
  companyId: string;
  threadId: string;
  draftId: string | null;
  traceId: string | null;
  targetOwnerRole: string | null;
  sourceIntent: FrontOfficeIntent;
  status: FrontOfficeHandoffStatus;
  summary: string;
  ownerRoute: string | null;
  nextAction: string | null;
  ownerResultRef: string | null;
  rejectionReason: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  evidence: any[] | null;
  operatorNotes: Array<{
    at: string;
    by: string | null;
    note: string;
    kind: "manual_note" | "claim" | "reject" | "resolve";
  }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackOfficeFarmAssignmentRecord {
  id: string;
  companyId: string;
  userId: string;
  farmAccountId: string;
  farmName: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FrontOfficeThreadParticipantStateRecord {
  id: string;
  companyId: string;
  threadId: string;
  userId: string;
  lastReadMessageId: string | null;
  lastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FrontOfficeThreadListItemRecord {
  threadKey: string;
  threadId: string;
  farmAccountId: string | null;
  farmNameSnapshot: string | null;
  representativeTelegramId: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastMessageDirection: "inbound" | "outbound" | null;
  currentHandoffStatus: FrontOfficeHandoffStatus | null;
  currentOwnerRole: string | null;
  unreadCount: number;
  needsHumanAction: boolean;
}

export interface FrontOfficeManagerFarmInboxRecord {
  farmAccountId: string;
  farmName: string;
  unreadCount: number;
  threadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastHandoffStatus: FrontOfficeHandoffStatus | null;
  needsHumanAction: boolean;
}

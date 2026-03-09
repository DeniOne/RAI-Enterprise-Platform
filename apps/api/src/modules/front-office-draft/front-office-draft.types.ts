export type FrontOfficeIntent =
  | "observation"
  | "deviation"
  | "consultation"
  | "context_update";

export type FrontOfficeDraftStatus =
  | "NEEDS_LINK"
  | "NEEDS_MUST_CLARIFICATION"
  | "READY_TO_CONFIRM"
  | "COMMITTED";

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

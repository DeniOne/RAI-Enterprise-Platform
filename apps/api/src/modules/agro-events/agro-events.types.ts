export type AgroEventDraftStatus = "DRAFT" | "READY_FOR_CONFIRM" | "COMMITTED";

export interface AgroEventsActorContext {
  companyId: string;
  userId: string;
}

export interface AgroEventDraftRecord {
  id: string;
  companyId: string;
  userId: string;
  status: AgroEventDraftStatus;
  eventType: string;
  timestamp: string;
  farmRef: string | null;
  fieldRef: string | null;
  taskRef: string | null;
  payload: Record<string, any>;
  evidence: any[];
  confidence: number;
  missingMust: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface AgroEventCommittedRecord {
  id: string;
  companyId: string;
  farmRef: string | null;
  fieldRef: string | null;
  taskRef: string | null;
  eventType: string;
  payload: Record<string, any>;
  evidence: any[];
  timestamp: string;
  committedAt: string;
  committedBy: string;
  provenanceHash: string;
}

export interface AgroEventDraftPatch {
  timestamp?: string;
  farmRef?: string | null;
  fieldRef?: string | null;
  taskRef?: string | null;
  payload?: Record<string, any>;
  evidence?: any[];
  confidence?: number;
  description?: string;
}

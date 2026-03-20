import { EvidenceItem } from '../event-draft.schema';

export interface CommittedEvent {
    id: string;
    companyId: string;

    farmRef?: string;
    fieldRef?: string;
    taskRef?: string;

    eventType: string;

    payload: any;
    evidence: EvidenceItem[];

    timestamp: string;

    committedAt: string;
    committedBy: string;
    provenanceHash: string;
}

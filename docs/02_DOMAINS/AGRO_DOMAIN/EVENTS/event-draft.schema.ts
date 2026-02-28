// AGRO_DOMAIN / EVENTS / event-draft.schema.ts

export type EventType =
    | 'FIELD_OPERATION'
    | 'OBSERVATION'
    | 'RESOURCE_USAGE'
    | 'WEATHER_SIGNAL'
    | 'INCIDENT'
    | 'NOTE';

export type EvidenceKind =
    | 'PHOTO'
    | 'VIDEO'
    | 'AUDIO'
    | 'TRANSCRIPT'
    | 'MANUAL_TEXT';

export interface EvidenceItem {
    kind: EvidenceKind;
    uri?: string;               // storage link
    transcript?: string;        // for voice/video
    hash: string;               // content hash (immutability)
    capturedAt: string;         // ISO timestamp
}

export interface BaseEventPayload {
    description?: string;
}

export interface ObservationPayload extends BaseEventPayload {
    observationKind:
    | 'PHENOLOGY_STAGE'
    | 'WEED_PRESSURE'
    | 'PEST_PRESSURE'
    | 'DISEASE_SIGNAL'
    | 'NUTRIENT_DEFICIENCY'
    | 'SOIL_CONDITION'
    | 'OTHER';

    value?: string | number;
    unit?: string;
}

export interface FieldOperationPayload extends BaseEventPayload {
    operationType: string;      // e.g. SPRAYING / FERTILIZING
    areaHa?: number;
    rate?: number;
    rateUnit?: string;
}

export interface EventDraft {
    id: string;

    eventType: EventType;
    timestamp: string;          // detected event time

    farmRef?: string;
    fieldRef?: string;
    taskRef?: string;

    payload:
    | ObservationPayload
    | FieldOperationPayload
    | BaseEventPayload;

    evidence: EvidenceItem[];

    confidence: number;         // 0..1
    missingMust: string[];      // blocking fields

    status: 'DRAFT' | 'READY_FOR_CONFIRM' | 'COMMITTED';

    createdAt: string;
}

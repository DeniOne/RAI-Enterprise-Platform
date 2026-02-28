import { PartyType } from '@/shared/types/party-assets';

export type PartyLookupJurisdiction = 'RU' | 'BY' | 'KZ';
export type PartyLookupStatus = 'FOUND' | 'NOT_FOUND' | 'ERROR' | 'NOT_SUPPORTED';
export type IdentificationFieldKey = 'inn' | 'kpp' | 'unp' | 'bin';

export interface IdentificationSchemaField {
  key: IdentificationFieldKey;
  label: string;
  dataType: 'string';
  required: boolean;
  mask: 'digits' | 'text';
  minLength: number;
  maxLength: number;
}

export interface IdentificationLookupSchema {
  enabled: boolean;
  triggerKeys: IdentificationFieldKey[];
  buttonLabel: string;
  debounceMs: number;
}

export interface PartyIdentificationSchema {
  jurisdictionId: PartyLookupJurisdiction;
  partyType: PartyType;
  fields: IdentificationSchemaField[];
  lookup: IdentificationLookupSchema;
}

export type PartyLookupIdentifiers = Partial<Record<IdentificationFieldKey, string>>;

export interface PartyLookupRequest {
  jurisdictionId: PartyLookupJurisdiction;
  partyType: Extract<PartyType, 'LEGAL_ENTITY' | 'IP' | 'KFH'>;
  identifiers: PartyLookupIdentifiers;
}

export interface PartyLookupAddress {
  type: 'LEGAL' | string;
  full: string;
}

export interface PartyLookupResult {
  legalName: string;
  shortName?: string;
  requisites?: {
    inn?: string;
    kpp?: string;
    ogrn?: string;
    ogrnip?: string;
    unp?: string;
    bin?: string;
  };
  addresses?: PartyLookupAddress[];
  meta?: {
    status?: string;
    managerName?: string;
    okved?: string;
    registeredAt?: string;
  };
}

export interface PartyLookupResponse {
  status: PartyLookupStatus;
  source: 'DADATA' | 'STUB' | 'UNKNOWN';
  fetchedAt: string;
  requestKey: string;
  result?: PartyLookupResult;
  error?: string;
}

export interface PartyDataProvenance {
  lookupSource: string;
  fetchedAt: string;
  requestKey: string;
}

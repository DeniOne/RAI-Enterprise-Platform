import { PartyType } from '@/shared/types/party-assets';

export type PartyLookupJurisdiction = 'RU' | 'BY' | 'KZ';
export type PartyLookupStatus = 'FOUND' | 'NOT_FOUND' | 'ERROR' | 'NOT_SUPPORTED';

export interface PartyLookupQuery {
  inn?: string;
  kpp?: string;
  unp?: string;
  bin?: string;
}

export interface PartyLookupRequest {
  jurisdictionId: PartyLookupJurisdiction;
  partyType: Extract<PartyType, 'LEGAL_ENTITY' | 'IP' | 'KFH'>;
  query: PartyLookupQuery;
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

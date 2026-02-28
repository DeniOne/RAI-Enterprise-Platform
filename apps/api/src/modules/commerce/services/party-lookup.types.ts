export type PartyLookupJurisdiction = "RU" | "BY" | "KZ";
export type PartyLookupPartyType = "LEGAL_ENTITY" | "IP" | "KFH";
export type PartyLookupStatus =
  | "FOUND"
  | "NOT_FOUND"
  | "ERROR"
  | "NOT_SUPPORTED";

export interface PartyLookupRequest {
  jurisdictionId: PartyLookupJurisdiction;
  partyType: PartyLookupPartyType;
  identifiers: {
    inn?: string;
    kpp?: string;
    unp?: string;
    bin?: string;
  };
}

export interface PartyLookupResponse {
  status: PartyLookupStatus;
  source: "DADATA" | "STUB" | "UNKNOWN";
  fetchedAt: string;
  requestKey: string;
  result?: {
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
    addresses?: Array<{ type: "LEGAL" | string; full: string }>;
    meta?: {
      status?: string;
      managerName?: string;
      okved?: string;
      registeredAt?: string;
    };
  };
  error?: string;
}

export interface CounterpartyLookupProvider {
  supports(jurisdictionId: string): boolean;
  lookup(req: PartyLookupRequest): Promise<PartyLookupResponse>;
}

export type IdentificationFieldKey = "inn" | "kpp" | "unp" | "bin";

export interface IdentificationSchemaField {
  key: IdentificationFieldKey;
  label: string;
  dataType: "string";
  required: boolean;
  mask: "digits" | "text";
  minLength: number;
  maxLength: number;
}

export interface IdentificationSchemaResponse {
  jurisdictionId: PartyLookupJurisdiction;
  partyType: string;
  fields: IdentificationSchemaField[];
  lookup: {
    enabled: boolean;
    triggerKeys: IdentificationFieldKey[];
    buttonLabel: string;
    debounceMs: number;
  };
}

export function normalizeLookupQueryValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

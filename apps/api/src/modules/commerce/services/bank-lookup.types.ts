export type BankLookupStatus =
  | "FOUND"
  | "NOT_FOUND"
  | "ERROR"
  | "NOT_SUPPORTED";

export interface BankLookupRequest {
  bic: string;
}

export interface BankLookupResponse {
  status: BankLookupStatus;
  source: "DADATA" | "STUB" | "UNKNOWN";
  fetchedAt: string;
  requestKey: string;
  result?: {
    bic: string;
    swift?: string;
    corrAccount?: string;
    bankName: string;
    shortName?: string;
    paymentName?: string;
    inn?: string;
    kpp?: string;
    address?: string;
    status?: string;
    registrationDate?: string;
    liquidationDate?: string;
    opfType?: string;
    type?: string;
  };
  error?: string;
}

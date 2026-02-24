export interface TaxContext {
  sellerJurisdiction: string;
  buyerJurisdiction: string;
  supplyType: "GOODS" | "SERVICE" | "LEASE";
  vatPayerStatus: "PAYER" | "NON_PAYER";
  productTaxCode?: string;
}

export interface TaxResult {
  rate: number;
  taxAmount: number;
  metadata?: Record<string, unknown>;
}

export interface TaxEngine {
  calculate(context: TaxContext, subtotal: number): TaxResult;
}

export class NoopTaxEngine implements TaxEngine {
  calculate(_context: TaxContext, subtotal: number): TaxResult {
    return { rate: 0, taxAmount: 0, metadata: { subtotal } };
  }
}

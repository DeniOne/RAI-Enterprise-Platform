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

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export class RuleBasedTaxEngine implements TaxEngine {
  calculate(context: TaxContext, subtotal: number): TaxResult {
    const baseRate = this.resolveRate(context);
    const taxAmount = round2(subtotal * baseRate);

    return {
      rate: baseRate,
      taxAmount,
      metadata: {
        sameJurisdiction: context.sellerJurisdiction === context.buyerJurisdiction,
        supplyType: context.supplyType,
        vatPayerStatus: context.vatPayerStatus,
        productTaxCode: context.productTaxCode ?? null,
      },
    };
  }

  private resolveRate(context: TaxContext): number {
    if (context.vatPayerStatus === "NON_PAYER") {
      return 0;
    }

    const sameJurisdiction =
      context.sellerJurisdiction.trim().toUpperCase() ===
      context.buyerJurisdiction.trim().toUpperCase();

    if (!sameJurisdiction) {
      return 0;
    }

    if (context.productTaxCode?.startsWith("AGRO_REDUCED")) {
      return 0.1;
    }

    switch (context.supplyType) {
      case "GOODS":
      case "SERVICE":
      case "LEASE":
      default:
        return 0.2;
    }
  }
}

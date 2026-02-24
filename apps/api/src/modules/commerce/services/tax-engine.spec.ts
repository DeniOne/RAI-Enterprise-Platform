import { RuleBasedTaxEngine } from "../contracts/tax-engine";

describe("RuleBasedTaxEngine", () => {
  const engine = new RuleBasedTaxEngine();

  it("applies standard 20% for same-jurisdiction payer", () => {
    const result = engine.calculate(
      {
        sellerJurisdiction: "RU",
        buyerJurisdiction: "RU",
        supplyType: "GOODS",
        vatPayerStatus: "PAYER",
      },
      1000,
    );

    expect(result.rate).toBe(0.2);
    expect(result.taxAmount).toBe(200);
  });

  it("applies reduced 10% for AGRO_REDUCED tax code", () => {
    const result = engine.calculate(
      {
        sellerJurisdiction: "RU",
        buyerJurisdiction: "RU",
        supplyType: "GOODS",
        vatPayerStatus: "PAYER",
        productTaxCode: "AGRO_REDUCED_10",
      },
      1000,
    );

    expect(result.rate).toBe(0.1);
    expect(result.taxAmount).toBe(100);
  });

  it("applies 0% for non-payer or cross-jurisdiction", () => {
    const nonPayer = engine.calculate(
      {
        sellerJurisdiction: "RU",
        buyerJurisdiction: "RU",
        supplyType: "SERVICE",
        vatPayerStatus: "NON_PAYER",
      },
      1000,
    );

    const crossJurisdiction = engine.calculate(
      {
        sellerJurisdiction: "RU",
        buyerJurisdiction: "BY",
        supplyType: "LEASE",
        vatPayerStatus: "PAYER",
      },
      1000,
    );

    expect(nonPayer.taxAmount).toBe(0);
    expect(crossJurisdiction.taxAmount).toBe(0);
  });
});

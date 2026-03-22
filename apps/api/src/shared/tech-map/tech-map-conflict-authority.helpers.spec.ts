import {
  compareTechMapAuthoritySources,
  selectTechMapAuthorityWinner,
} from "./tech-map-conflict-authority.helpers";

describe("tech-map-conflict-authority.helpers", () => {
  it("отдаёт приоритет verified measurement над user declaration", () => {
    expect(
      compareTechMapAuthoritySources(
        "agronomic_measurement",
        {
          source_ref: "soil-lab",
          authority_class: "VERIFIED_MEASUREMENT",
          verified_at: "2026-03-20T00:00:00.000Z",
          scope_level: "field",
        },
        {
          source_ref: "user-input",
          authority_class: "USER_DECLARATION",
          verified_at: "2026-03-21T00:00:00.000Z",
          scope_level: "field",
        },
      ),
    ).toBe(1);
  });

  it("при равном authority class выбирает более свежий source", () => {
    expect(
      compareTechMapAuthoritySources(
        "economic_basis",
        {
          source_ref: "price-book-old",
          authority_class: "APPROVED_INTERNAL_MASTER",
          verified_at: "2026-02-20T00:00:00.000Z",
          scope_level: "company",
        },
        {
          source_ref: "price-book-new",
          authority_class: "APPROVED_INTERNAL_MASTER",
          verified_at: "2026-03-20T00:00:00.000Z",
          scope_level: "company",
        },
      ),
    ).toBe(-1);
  });

  it("при равном authority и времени выбирает более специфичный scope", () => {
    expect(
      compareTechMapAuthoritySources(
        "identity_scope",
        {
          source_ref: "company-default",
          authority_class: "APPROVED_INTERNAL_MASTER",
          verified_at: "2026-03-20T00:00:00.000Z",
          scope_level: "company",
        },
        {
          source_ref: "field-record",
          authority_class: "APPROVED_INTERNAL_MASTER",
          verified_at: "2026-03-20T00:00:00.000Z",
          scope_level: "field",
        },
      ),
    ).toBe(-1);
  });

  it("выбирает overall authority winner из массива кандидатов", () => {
    const winner = selectTechMapAuthorityWinner("identity_scope", [
      {
        source_ref: "user-input",
        authority_class: "USER_DECLARATION",
        verified_at: "2026-03-22T00:00:00.000Z",
        scope_level: "field",
      },
      {
        source_ref: "contract",
        authority_class: "REGULATORY_OR_SIGNED",
        verified_at: "2026-03-10T00:00:00.000Z",
        scope_level: "company",
      },
    ]);

    expect(winner?.source_ref).toBe("contract");
  });
});

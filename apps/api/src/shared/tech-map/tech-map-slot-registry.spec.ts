import {
  getTechMapSlotRegistryEntry,
  listTechMapPublicationCriticalSlots,
  listTechMapPublicationCriticalSlotEntries,
  listTechMapSlotsByGroup,
  listTechMapSlotRegistryEntriesRequiredFrom,
  TECH_MAP_SLOT_REGISTRY,
} from "./tech-map-slot-registry";

describe("tech-map-slot-registry", () => {
  it("регистрирует каждый slot_key ровно один раз", () => {
    const keys = TECH_MAP_SLOT_REGISTRY.map((entry) => entry.slot_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("возвращает S2-required slots для minimum computable readiness", () => {
    const s2Keys = listTechMapSlotRegistryEntriesRequiredFrom(
      "S2_MINIMUM_COMPUTABLE",
    ).map((entry) => entry.slot_key);

    expect(s2Keys).toContain("predecessor_crop");
    expect(s2Keys).toContain("soil_profile");
    expect(s2Keys).toContain("budget_policy");
    expect(s2Keys).toContain("methodology_profile_id");
    expect(s2Keys).not.toContain("contract_mode");
  });

  it("помечает publication-critical slots", () => {
    const publicationCriticalSlots = listTechMapPublicationCriticalSlots();
    expect(publicationCriticalSlots).toContain("allowed_input_catalog_version");
    expect(publicationCriticalSlots).toContain("budget_policy");
  });

  it("возвращает registry entry по slot key", () => {
    const entry = getTechMapSlotRegistryEntry("price_book_version");
    expect(entry?.group).toBe("economic_basis");
    expect(entry?.freshness_policy.mode).toBe("MAX_AGE_DAYS");
  });

  it("возвращает publication-critical entry list и group filtering", () => {
    const publicationCriticalEntries = listTechMapPublicationCriticalSlotEntries();
    expect(publicationCriticalEntries.length).toBeGreaterThan(0);
    expect(publicationCriticalEntries.every((entry) => entry.impact.publication_critical)).toBe(true);

    const agronomicSlots = listTechMapSlotsByGroup("agronomic_basis");
    expect(agronomicSlots.some((entry) => entry.slot_key === "soil_profile")).toBe(true);
  });
});

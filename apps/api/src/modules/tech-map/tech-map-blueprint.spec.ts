import {
  buildTechMapBlueprint,
  resolveBlueprintBaseDate,
  resolveOperationWindow,
} from "./tech-map-blueprint";

describe("tech-map-blueprint", () => {
  it("builds a non-empty rapeseed blueprint with supported units", () => {
    const blueprint = buildTechMapBlueprint({
      crop: "rapeseed",
      seasonYear: 2026,
      targetYieldTHa: 3.8,
    });

    expect(blueprint.crop).toBe("rapeseed");
    expect(blueprint.stages.length).toBeGreaterThanOrEqual(5);

    const operations = blueprint.stages.flatMap((stage) => stage.operations);
    expect(operations.length).toBeGreaterThanOrEqual(8);

    const resources = operations.flatMap((operation) => operation.resources);
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.every((resource) => resource.amount > 0)).toBe(true);
    expect(resources.every((resource) => ["kg", "l", "unit"].includes(resource.unit))).toBe(true);
  });

  it("derives deterministic operation windows from season base date", () => {
    const baseDate = resolveBlueprintBaseDate({
      crop: "rapeseed",
      seasonYear: 2026,
      seasonStartDate: new Date("2026-03-15T08:00:00.000Z"),
    });

    const window = resolveOperationWindow(baseDate, 12, 6);

    expect(window.plannedStartTime.toISOString()).toBe("2026-03-27T08:00:00.000Z");
    expect(window.plannedEndTime.toISOString()).toBe("2026-03-27T14:00:00.000Z");
  });
});

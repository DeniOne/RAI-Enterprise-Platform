import {
  buildDagNodesFromTechMap,
  buildOperationsSnapshot,
  buildResourceNormsSnapshot,
  buildValidationInputFromTechMap,
} from "./tech-map-mapping.helpers";

describe("tech-map mapping helpers", () => {
  const mapStub = {
    field: { protectedZoneFlags: { waterProtection: true } },
    cropZone: { targetYieldTHa: 4.2 },
    stages: [
      {
        name: "Посев",
        operations: [
          {
            id: "op-1",
            name: "Сев",
            requiredMachineryType: "SEEDER",
            plannedDurationHours: 6,
            isCritical: true,
            dependencies: [{ operationId: "op-0", lagDays: 1 }],
            resources: [
              {
                id: "res-1",
                name: "Семена",
                amount: 120,
                unit: "kg",
                plannedRate: 12,
                maxRate: 15,
                inputCatalogId: "input-1",
                tankMixGroupId: null,
                inputCatalog: { id: "input-1" },
              },
            ],
          },
        ],
      },
    ],
  };

  it("строит ValidationInput из техкарты", () => {
    const result = buildValidationInputFromTechMap(mapStub, 23);

    expect(result.currentBBCH).toBe(23);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toEqual(
      expect.objectContaining({
        id: "op-1",
        plannedDurationHours: 6,
        isCritical: true,
        dependencies: [{ operationId: "op-0", lagDays: 1 }],
      }),
    );
    expect(result.field.protectedZoneFlags).toEqual({ waterProtection: true });
    expect(result.cropZone.targetYieldTHa).toBe(4.2);
  });

  it("строит DAG nodes из операций", () => {
    const nodes = buildDagNodesFromTechMap(mapStub);

    expect(nodes).toEqual([
      {
        id: "op-1",
        plannedDurationHours: 6,
        isCritical: true,
        dependencies: [{ operationId: "op-0", lagDays: 1 }],
      },
    ]);
  });

  it("строит snapshots операций и ресурсов с нормализацией", () => {
    const operationsSnapshot = buildOperationsSnapshot(mapStub);
    const resourceNormsSnapshot = buildResourceNormsSnapshot(
      mapStub,
      (value, unit) => ({
        value: unit === "kg" ? value : value,
        unit: unit === "kg" ? "kg" : unit,
      }),
    );

    expect(operationsSnapshot).toEqual([
      {
        stage: "Посев",
        ops: [
          {
            id: "op-1",
            name: "Сев",
            machinery: "SEEDER",
          },
        ],
      },
    ]);
    expect(resourceNormsSnapshot).toEqual([
      {
        resourceId: "res-1",
        name: "Семена",
        originalAmount: 120,
        originalUnit: "kg",
        normalized: { value: 120, unit: "kg" },
      },
    ]);
  });
});

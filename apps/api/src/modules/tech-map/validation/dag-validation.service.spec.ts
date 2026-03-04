import { DAGValidationService, OperationNode } from "./dag-validation.service";

describe("DAGValidationService", () => {
    let service: DAGValidationService;

    beforeEach(() => {
        service = new DAGValidationService();
    });

    // ──────────────────────────────────────────────────────────────
    // validateAcyclicity
    // ──────────────────────────────────────────────────────────────

    describe("validateAcyclicity", () => {
        it("линейный граф A→B→C: нет циклов, valid=true", () => {
            const ops: OperationNode[] = [
                { id: "A", plannedDurationHours: 8, isCritical: true, dependencies: [] },
                {
                    id: "B",
                    plannedDurationHours: 8,
                    isCritical: false,
                    dependencies: [{ opId: "A", type: "FS", lagMinDays: 0, lagMaxDays: 0 }],
                },
                {
                    id: "C",
                    plannedDurationHours: 4,
                    isCritical: false,
                    dependencies: [{ opId: "B", type: "FS", lagMinDays: 0, lagMaxDays: 0 }],
                },
            ];

            const result = service.validateAcyclicity(ops);
            expect(result.valid).toBe(true);
            expect(result.cycles).toHaveLength(0);
        });

        it("граф с циклом A→B→A: valid=false, cycles содержит A и B", () => {
            const ops: OperationNode[] = [
                {
                    id: "A",
                    plannedDurationHours: 8,
                    isCritical: false,
                    dependencies: [{ opId: "B", type: "FS", lagMinDays: 0, lagMaxDays: 0 }],
                },
                {
                    id: "B",
                    plannedDurationHours: 8,
                    isCritical: false,
                    dependencies: [{ opId: "A", type: "FS", lagMinDays: 0, lagMaxDays: 0 }],
                },
            ];

            const result = service.validateAcyclicity(ops);
            expect(result.valid).toBe(false);
            expect(result.cycles.length).toBeGreaterThan(0);
            // Цикл должен содержать оба узла
            const allInCycles = result.cycles.flat();
            expect(allInCycles).toContain("A");
            expect(allInCycles).toContain("B");
        });
    });

    // ──────────────────────────────────────────────────────────────
    // calculateCriticalPath
    // ──────────────────────────────────────────────────────────────

    describe("calculateCriticalPath", () => {
        it("параллельные ветки: критический путь = длиннейшая ветка", () => {
            // A → C (длинный путь: 8h + 16h = 24h = 3 дня)
            // B → C (короткий путь: 4h + 16h = 20h = 2.5 дня)
            const ops: OperationNode[] = [
                { id: "A", plannedDurationHours: 8, isCritical: false, dependencies: [] },
                { id: "B", plannedDurationHours: 4, isCritical: false, dependencies: [] },
                {
                    id: "C",
                    plannedDurationHours: 16,
                    isCritical: false,
                    dependencies: [
                        { opId: "A", type: "FS", lagMinDays: 0, lagMaxDays: 0 },
                        { opId: "B", type: "FS", lagMinDays: 0, lagMaxDays: 0 },
                    ],
                },
            ];

            const result = service.calculateCriticalPath(ops);
            expect(result.criticalPath).toContain("A");
            expect(result.criticalPath).toContain("C");
            // B должен иметь float > 0
            expect(result.floats["B"]).toBeGreaterThan(0);
            // Общая длительность ≥ 3 дней (A=1д + C=2д = 3д)
            expect(result.totalDurationDays).toBeGreaterThanOrEqual(3);
        });

        it("FS с lagMinDays=2: общая длительность учитывает lag", () => {
            const ops: OperationNode[] = [
                { id: "A", plannedDurationHours: 8, isCritical: false, dependencies: [] },
                {
                    id: "B",
                    plannedDurationHours: 8,
                    isCritical: false,
                    dependencies: [{ opId: "A", type: "FS", lagMinDays: 2, lagMaxDays: 2 }],
                },
            ];

            const result = service.calculateCriticalPath(ops);
            // A = 1 день, lag = 2 дня, B = 1 день → итого ≥ 4 дней
            expect(result.totalDurationDays).toBeGreaterThanOrEqual(4);
        });
    });
});

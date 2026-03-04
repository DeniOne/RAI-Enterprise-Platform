import {
    TankMixCompatibilityService,
    InputCatalogItem,
} from "./tank-mix-compatibility.service";

describe("TankMixCompatibilityService", () => {
    let service: TankMixCompatibilityService;

    beforeEach(() => {
        service = new TankMixCompatibilityService();
    });

    it("3 совместимых препарата → COMPATIBLE", () => {
        const inputs: InputCatalogItem[] = [
            { id: "drug-1", name: "Препарат А", incompatibleWith: [] },
            { id: "drug-2", name: "Препарат Б", incompatibleWith: [] },
            { id: "drug-3", name: "Препарат В", incompatibleWith: null },
        ];

        const result = service.checkCompatibility(inputs);
        expect(result.status).toBe("COMPATIBLE");
        expect(result.conflictingPairs).toHaveLength(0);
    });

    it("A.incompatibleWith=['B'] → INCOMPATIBLE, conflictingPairs=[['A','B']]", () => {
        const inputs: InputCatalogItem[] = [
            { id: "A", name: "Препарат А", incompatibleWith: ["B"] },
            { id: "B", name: "Препарат Б", incompatibleWith: [] },
        ];

        const result = service.checkCompatibility(inputs);
        expect(result.status).toBe("INCOMPATIBLE");
        expect(result.conflictingPairs).toHaveLength(1);
        expect(result.conflictingPairs[0]).toEqual(["A", "B"]);
    });

    it("пустой список → COMPATIBLE", () => {
        const result = service.checkCompatibility([]);
        expect(result.status).toBe("COMPATIBLE");
        expect(result.conflictingPairs).toHaveLength(0);
    });
});

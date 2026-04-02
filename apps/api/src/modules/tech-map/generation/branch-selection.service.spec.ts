import { BranchSelectionService } from "./branch-selection.service";

describe("BranchSelectionService", () => {
  const service = new BranchSelectionService();

  it("использует явный cropForm из cropZone как единственный canonical key", () => {
    const result = service.select({
      cropZone: {
        cropForm: "RAPESEED_WINTER",
      } as any,
      season: {} as any,
      regionProfile: null,
    });

    expect(result.cropForm).toBe("RAPESEED_WINTER");
    expect(result.canonicalBranch).toBe("winter_rapeseed");
    expect(result.source).toBe("explicit");
  });

  it("выбирает spring branch по низкому SAT_avg", () => {
    const result = service.select({
      cropZone: {
        cropForm: null,
      } as any,
      season: {} as any,
      regionProfile: {
        satAvg: 1800,
      } as any,
    });

    expect(result.cropForm).toBe("RAPESEED_SPRING");
    expect(result.canonicalBranch).toBe("spring_rapeseed");
  });
});

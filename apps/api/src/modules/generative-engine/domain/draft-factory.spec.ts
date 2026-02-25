import { Test, TestingModule } from "@nestjs/testing";
import { DraftFactory } from "./draft-factory";
import { TechMapStatus } from "@rai/prisma-client";

describe("DraftFactory", () => {
  let factory: DraftFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DraftFactory],
    }).compile();

    factory = module.get<DraftFactory>(DraftFactory);
  });

  describe("createDraft", () => {
    const params: any = {
      strategyId: "s1",
      cropId: "wheat",
      companyId: "c1",
      seasonId: "season1",
      fieldId: "field1",
    };

    const templates: any[] = [
      {
        stageName: "Stage B",
        stageSequence: 2,
        name: "Op 2",
        sequence: 1,
        resources: [],
      },
      {
        stageName: "Stage A",
        stageSequence: 1,
        name: "Op 1",
        sequence: 1,
        resources: [],
      },
    ];

    const metadata: any = {
      modelId: "m1",
      modelVersion: "1.0.0",
      generatedAt: "2026-01-01T00:00:00Z",
      seed: "12345",
      hash: "h1",
    };

    it("должен создавать черновик со статусом GENERATED_DRAFT (I15)", () => {
      const draft = factory.createDraft(params, templates, metadata, 1);
      expect(draft.status).toBe(TechMapStatus.GENERATED_DRAFT);
    });

    it("должен детерминированно сортировать стадии по sequence", () => {
      const draft = factory.createDraft(params, templates, metadata, 1);
      expect(draft.stages[0].name).toBe("Stage A");
      expect(draft.stages[1].name).toBe("Stage B");
    });

    it("должен сохранять метаданные генерации (I16)", () => {
      const draft = factory.createDraft(params, templates, metadata, 1);
      expect(draft.generationMetadata).toEqual(metadata);
    });
  });

  describe("assertHumanApproval (I17)", () => {
    it("должен позволять AGRONOMIST утверждать", () => {
      expect(() =>
        factory.assertHumanApproval("AGRONOMIST" as any),
      ).not.toThrow();
    });

    it("должен запрещать SYSTEM утверждать", () => {
      expect(() => factory.assertHumanApproval("SYSTEM" as any)).toThrow(
        /Human Override/,
      );
    });
  });
});

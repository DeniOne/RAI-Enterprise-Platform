import { Test, TestingModule } from "@nestjs/testing";
import { ClimateType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { RegionProfileService } from "./region-profile.service";

describe("RegionProfileService", () => {
  let service: RegionProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionProfileService,
        {
          provide: PrismaService,
          useValue: {
            techMap: { findFirst: jest.fn() },
            regionProfile: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(RegionProfileService);
  });

  it("calculateSowingWindow MARITIME_HUMID: windowDays = 14", () => {
    const result = service.calculateSowingWindow(
      {
        climateType: ClimateType.MARITIME_HUMID,
        gddBaseTempC: 5,
      } as any,
      50,
      new Date("2026-03-04T00:00:00.000Z"),
    );

    expect(result.windowDays).toBe(14);
  });

  it("calculateSowingWindow CONTINENTAL_COLD: windowDays = 7", () => {
    const result = service.calculateSowingWindow(
      {
        climateType: ClimateType.CONTINENTAL_COLD,
        gddBaseTempC: 5,
      } as any,
      50,
      new Date("2026-03-04T00:00:00.000Z"),
    );

    expect(result.windowDays).toBe(7);
  });

  it("suggestOperationTypes CONTINENTAL_COLD: включает DESICCATION mandatory", () => {
    const result = service.suggestOperationTypes(
      {
        climateType: ClimateType.CONTINENTAL_COLD,
      } as any,
      "RAPESEED",
    );

    expect(result).toContainEqual(
      expect.objectContaining({
        operationType: "DESICCATION",
        isMandatory: true,
      }),
    );
  });

  it("suggestOperationTypes MARITIME_HUMID: включает минимум 2 FUNGICIDE_APP mandatory", () => {
    const result = service.suggestOperationTypes(
      {
        climateType: ClimateType.MARITIME_HUMID,
      } as any,
      "RAPESEED",
    );

    expect(
      result.filter(
        (item) =>
          item.operationType === "FUNGICIDE_APP" && item.isMandatory,
      ),
    ).toHaveLength(2);
  });
});

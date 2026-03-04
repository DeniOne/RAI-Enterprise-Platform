import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { HybridPhenologyService } from "./hybrid-phenology.service";

describe("HybridPhenologyService", () => {
  let service: HybridPhenologyService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      hybridPhenologyModel: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridPhenologyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(HybridPhenologyService);
  });

  it("predictBBCH: gdd=0 -> BBCH_00", async () => {
    prisma.hybridPhenologyModel.findFirst.mockResolvedValue({
      gddToStage: {
        BBCH_00: 0,
        BBCH_09: 80,
        BBCH_51: 600,
      },
    });

    await expect(
      service.predictBBCH("PX128", 0, "company-1"),
    ).resolves.toEqual({
      bbchCode: "BBCH_00",
      bbchValue: 0,
      nextStage: "BBCH_09",
      gddToNextStage: 80,
    });
  });

  it("predictBBCH: gdd=500 -> правильная промежуточная фаза", async () => {
    prisma.hybridPhenologyModel.findFirst.mockResolvedValue({
      gddToStage: {
        BBCH_00: 0,
        BBCH_09: 80,
        BBCH_51: 600,
      },
    });

    await expect(
      service.predictBBCH("PX128", 500, "company-1"),
    ).resolves.toEqual({
      bbchCode: "BBCH_09",
      bbchValue: 9,
      nextStage: "BBCH_51",
      gddToNextStage: 100,
    });
  });

  it("predictBBCH: gdd > max -> последняя фаза, nextStage=null", async () => {
    prisma.hybridPhenologyModel.findFirst.mockResolvedValue({
      gddToStage: {
        BBCH_00: 0,
        BBCH_09: 80,
        BBCH_89: 1450,
      },
    });

    await expect(
      service.predictBBCH("PX128", 1600, "company-1"),
    ).resolves.toEqual({
      bbchCode: "BBCH_89",
      bbchValue: 89,
      nextStage: null,
      gddToNextStage: null,
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { SeasonBusinessRulesService } from "./season-business-rules.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { AgroAuditService } from "../../agro-audit/agro-audit.service";
import { RapeseedType } from "@rai/prisma-client";
import { BadRequestException } from "@nestjs/common";

describe("SeasonBusinessRulesService", () => {
  let service: SeasonBusinessRulesService;

  const prismaMock = {
    rapeseed: {
      findUnique: jest.fn(),
    },
    season: {
      findMany: jest.fn(),
    },
  };

  const auditMock = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonBusinessRulesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AgroAuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<SeasonBusinessRulesService>(
      SeasonBusinessRulesService,
    );

    jest.clearAllMocks();
  });

  describe("validateRapeseedSeasonDates", () => {
    it("should throw if WINTER rapeseed is sown in Spring", () => {
      const springDate = new Date("2026-04-15");
      expect(() =>
        service.validateRapeseedSeasonDates(springDate, RapeseedType.WINTER),
      ).toThrow(BadRequestException);
    });

    it("should pass if WINTER rapeseed is sown in August", () => {
      const autumnDate = new Date("2026-08-20");
      expect(() =>
        service.validateRapeseedSeasonDates(autumnDate, RapeseedType.WINTER),
      ).not.toThrow();
    });

    it("should throw if SPRING rapeseed is sown in Autumn", () => {
      const autumnDate = new Date("2026-09-10");
      expect(() =>
        service.validateRapeseedSeasonDates(autumnDate, RapeseedType.SPRING),
      ).toThrow(BadRequestException);
    });
  });

  describe("validateCropRotation", () => {
    it("should throw if rapeseed was grown in last 4 years", async () => {
      prismaMock.season.findMany.mockResolvedValue([{ year: 2024 }]);

      await expect(
        service.validateCropRotation("field-1", 2026, "rapeseed-1"),
      ).rejects.toThrow(BadRequestException);

      expect(auditMock.log).toHaveBeenCalled();
    });

    it("should pass if no rapeseed in last 4 years", async () => {
      prismaMock.season.findMany.mockResolvedValue([]);

      await expect(
        service.validateCropRotation("field-1", 2026, "rapeseed-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("validateYieldTarget", () => {
    it("should throw if target is too low", () => {
      expect(() => service.validateYieldTarget(0.5)).toThrow(
        BadRequestException,
      );
    });

    it("should throw if target is too high", () => {
      expect(() => service.validateYieldTarget(10)).toThrow(
        BadRequestException,
      );
    });

    it("should pass if target is 3.5", () => {
      expect(() => service.validateYieldTarget(3.5)).not.toThrow();
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { ConsultingDomainRules } from "./consulting.domain-rules.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";
import { TechMapStatus, DeviationStatus } from "@rai/prisma-client";

/**
 * ConsultingDomainRules — тесты FSM-гардов.
 * Проверяет кросс-доменные бизнес-правила Consulting домена.
 */
describe("ConsultingDomainRules", () => {
  let service: ConsultingDomainRules;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      techMap: { findMany: jest.fn() },
      deviationReview: { count: jest.fn() },
      harvestPlan: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultingDomainRules,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConsultingDomainRules>(ConsultingDomainRules);
  });

  // --- canActivate ---

  describe("canActivate", () => {
    it("РАЗРЕШАЕТ активацию при наличии ACTIVE TechMap и отсутствии открытых Deviation", async () => {
      prisma.techMap.findMany.mockResolvedValue([
        { id: "tm-1", status: TechMapStatus.ACTIVE },
      ]);
      prisma.deviationReview.count.mockResolvedValue(0);

      await expect(service.canActivate("plan-1")).resolves.toBeUndefined();
    });

    it("ЗАПРЕЩАЕТ активацию при TechMap в статусе REVIEW или APPROVED (Production Gate)", async () => {
      prisma.techMap.findMany.mockResolvedValue([
        { id: "tm-1", status: TechMapStatus.REVIEW },
        { id: "tm-2", status: TechMapStatus.APPROVED },
      ]);
      prisma.deviationReview.count.mockResolvedValue(0);

      await expect(service.canActivate("plan-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.canActivate("plan-1")).rejects.toThrow(
        "Production Gate",
      );
    });

    it("ЗАПРЕЩАЕТ активацию без TechMap", async () => {
      prisma.techMap.findMany.mockResolvedValue([]);

      await expect(service.canActivate("plan-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.canActivate("plan-1")).rejects.toThrow(
        "Невозможно активировать план без привязанной Технологической Карты",
      );
    });

    it("ЗАПРЕЩАЕТ активацию если все TechMaps в DRAFT", async () => {
      prisma.techMap.findMany.mockResolvedValue([
        { id: "tm-1", status: TechMapStatus.DRAFT },
      ]);

      await expect(service.canActivate("plan-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.canActivate("plan-1")).rejects.toThrow(
        "Production Gate",
      );
    });

    it("ЗАПРЕЩАЕТ активацию при открытых Deviation (DETECTED)", async () => {
      prisma.techMap.findMany.mockResolvedValue([
        { id: "tm-1", status: TechMapStatus.ACTIVE },
      ]);
      prisma.deviationReview.count.mockResolvedValue(2);

      await expect(service.canActivate("plan-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.canActivate("plan-1")).rejects.toThrow(
        "незакрытых отклонений",
      );
    });
  });

  // --- canCreateDeviation ---

  describe("canCreateDeviation", () => {
    it("РАЗРЕШАЕТ создание Deviation для ACTIVE плана", async () => {
      prisma.harvestPlan.findFirst.mockResolvedValue({
        id: "plan-1",
        status: "ACTIVE",
        companyId: "comp-1",
      });

      await expect(
        service.canCreateDeviation("plan-1", "comp-1"),
      ).resolves.toBeUndefined();
    });

    it("ЗАПРЕЩАЕТ создание Deviation для DRAFT плана", async () => {
      prisma.harvestPlan.findFirst.mockResolvedValue({
        id: "plan-1",
        status: "DRAFT",
        companyId: "comp-1",
      });

      await expect(
        service.canCreateDeviation("plan-1", "comp-1"),
      ).rejects.toThrow("ACTIVE планов");
    });

    it("ЗАПРЕЩАЕТ создание Deviation для несуществующего плана", async () => {
      prisma.harvestPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.canCreateDeviation("no-plan", "comp-1"),
      ).rejects.toThrow("План уборки не найден");
    });
  });

  // --- canArchive ---

  describe("canArchive", () => {
    it("РАЗРЕШАЕТ архивацию если все Deviation закрыты", async () => {
      prisma.deviationReview.count.mockResolvedValue(0);

      await expect(service.canArchive("plan-1")).resolves.toBeUndefined();
    });

    it("ЗАПРЕЩАЕТ архивацию при незакрытых Deviation", async () => {
      prisma.deviationReview.count.mockResolvedValue(3);

      await expect(service.canArchive("plan-1")).rejects.toThrow(
        "незакрытых отклонений",
      );
    });
  });
});

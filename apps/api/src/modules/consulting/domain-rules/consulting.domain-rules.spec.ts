import { Test, TestingModule } from "@nestjs/testing";
import { ConsultingDomainRules } from "./consulting.domain-rules.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";
import { DeviationStatus } from "@rai/prisma-client";

/**
 * ConsultingDomainRules — тесты FSM-гардов.
 * Проверяет кросс-доменные бизнес-правила Consulting домена.
 */
describe("ConsultingDomainRules", () => {
  let service: ConsultingDomainRules;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      deviationReview: { count: jest.fn() },
      harvestPlan: { findFirst: jest.fn(), findUnique: jest.fn() },
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
    it("РАЗРЕШАЕТ активацию при activeTechMapId и LOCKED бюджете без открытых Deviation", async () => {
      prisma.harvestPlan.findUnique
        .mockResolvedValueOnce({
          id: "plan-1",
          activeTechMapId: "tm-1",
        })
        .mockResolvedValueOnce({
          id: "plan-1",
          activeBudgetPlanId: "budget-1",
          activeBudgetPlan: { status: "LOCKED" },
        });
      prisma.deviationReview.count.mockResolvedValue(0);

      await expect(service.canActivate("plan-1")).resolves.toBeUndefined();
    });

    it("ЗАПРЕЩАЕТ активацию без activeTechMapId (Production Gate)", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValueOnce({
        id: "plan-1",
        activeTechMapId: null,
      });

      const activationPromise = service.canActivate("plan-1");

      await expect(activationPromise).rejects.toThrow(
        BadRequestException,
      );
      await expect(activationPromise).rejects.toThrow(
        "Production Gate",
      );
    });

    it("ЗАПРЕЩАЕТ активацию без существующего плана", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValueOnce(null);

      await expect(service.canActivate("plan-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.canActivate("plan-1")).rejects.toThrow(
        "План уборки не найден",
      );
    });

    it("ЗАПРЕЩАЕТ активацию при незаблокированном бюджете (Financial Gate)", async () => {
      prisma.harvestPlan.findUnique
        .mockResolvedValueOnce({
          id: "plan-1",
          activeTechMapId: "tm-1",
        })
        .mockResolvedValueOnce({
          id: "plan-1",
          activeBudgetPlanId: "budget-1",
          activeBudgetPlan: { status: "DRAFT" },
        });
      prisma.deviationReview.count.mockResolvedValue(0);

      const activationPromise = service.canActivate("plan-1");

      await expect(activationPromise).rejects.toThrow(
        BadRequestException,
      );
      await expect(activationPromise).rejects.toThrow(
        "Financial Gate",
      );
    });

    it("ЗАПРЕЩАЕТ активацию при открытых Deviation (DETECTED)", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValueOnce({
        id: "plan-1",
        activeTechMapId: "tm-1",
      });
      prisma.deviationReview.count.mockResolvedValue(2);

      const activationPromise = service.canActivate("plan-1");

      await expect(activationPromise).rejects.toThrow(
        BadRequestException,
      );
      await expect(activationPromise).rejects.toThrow(
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

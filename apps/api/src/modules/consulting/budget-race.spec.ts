import { Test, TestingModule } from "@nestjs/testing";
import { BudgetPlanService } from "./budget-plan.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { BudgetStatus, Prisma } from "@rai/prisma-client";

// Mock DeviationService
const mockDeviationService = {
  createReview: jest.fn(),
};

describe("BudgetPlanService Concurrency", () => {
  let service: BudgetPlanService;
  let prisma: any; // Use any to avoid complex Prisma types in testing

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetPlanService,
        {
          provide: PrismaService,
          useValue: {
            budgetPlan: {
              updateMany: jest.fn(),
              findFirst: jest.fn(),
            },
            $disconnect: jest.fn(),
          },
        },
        { provide: DeviationService, useValue: mockDeviationService },
      ],
    }).compile();

    service = module.get<BudgetPlanService>(BudgetPlanService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Clean up or ensure DB connection
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should handle concurrent updates with Optimistic Locking", async () => {
    // Let's spy on prisma.budgetPlan.update
    // Since prisma.budgetPlan were defined in useValue, they are already mocks
    const updateSpy = prisma.budgetPlan.updateMany;
    const findFirstSpy = prisma.budgetPlan.findFirst;

    findFirstSpy.mockResolvedValue({
      id: "test-budget",
      version: 1,
      status: BudgetStatus.LOCKED,
      companyId: "test-company",
      harvestPlanId: "plan-1",
      seasonId: "season-1",
      items: [
        {
          actualAmount: 0,
          plannedAmount: 0,
          category: "SEEDS",
        },
      ],
    });

    let attempt = 0;
    updateSpy.mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Record to update not found.",
          {
            code: "P2025",
            clientVersion: "test",
          },
        );
      }
      return { count: 1 };
    });

    const context = {
      userId: "u1",
      companyId: "test-company",
      role: "ADMIN" as any,
    };

    // Run syncActuals
    await service.syncActuals("test-budget", context);

    // Assertions
    expect(updateSpy).toHaveBeenCalledTimes(2); // Initial try + 1 retry
    expect(findFirstSpy).toHaveBeenCalledTimes(2);
  });
});

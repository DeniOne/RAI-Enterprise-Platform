import { Test, TestingModule } from "@nestjs/testing";
import { ExpertReviewService } from "./expert-review.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ChiefAgronomistService } from "./expert/chief-agronomist.service";
import { TaskService } from "../task/task.service";

describe("ExpertReviewService", () => {
  let service: ExpertReviewService;

  const mockExpertReviewCreate = jest.fn();
  const mockAuditLogCreate = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpertReviewService,
        {
          provide: PrismaService,
          useValue: {
            expertReview: {
              create: mockExpertReviewCreate,
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              create: mockAuditLogCreate,
            },
          },
        },
        {
          provide: ChiefAgronomistService,
          useValue: {
            deepExpertise: jest.fn(),
          },
        },
        {
          provide: TaskService,
          useValue: {
            createExpertReviewTask: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExpertReviewService);
  });

  it("returns needs_more_context and persists review when fieldId/seasonId are missing", async () => {
    const response = await service.runChiefAgronomistReview("company-1", "user-1", {
      entityType: "techmap",
      entityId: "tm-1",
      reason: "Нужна проверка",
    });

    expect(response.status).toBe("needs_more_context");
    expect(response.requiresHumanDecision).toBe(true);
    expect(response.missingContext).toEqual(["fieldId", "seasonId"]);
    expect(mockExpertReviewCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "company-1",
        entityType: "techmap",
        entityId: "tm-1",
        status: "NEEDS_MORE_CONTEXT",
        requiresHumanDecision: true,
      }),
    });
    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "CHIEF_AGRONOMIST_REVIEW_NEEDS_CONTEXT",
        companyId: "company-1",
        userId: "user-1",
      }),
    });
  });
});

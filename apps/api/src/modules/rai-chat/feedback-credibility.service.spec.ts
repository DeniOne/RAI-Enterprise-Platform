import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { FeedbackCredibilityService } from "./feedback-credibility.service";

describe("FeedbackCredibilityService", () => {
  let service: FeedbackCredibilityService;

  const userCredibilityProfileMock = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const prisma = {
    userCredibilityProfile: userCredibilityProfileMock,
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackCredibilityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(FeedbackCredibilityService);
  });

  it("дефолтный юзер имеет множитель 1.0", async () => {
    userCredibilityProfileMock.findUnique.mockResolvedValue(null);
    userCredibilityProfileMock.create.mockResolvedValue({
      id: "uc1",
      companyId: "c1",
      userId: "u1",
      credibilityScore: 100,
      totalFeedbacks: 0,
      invalidatedFeedbacks: 0,
    });

    const multiplier = await service.getMultiplier("u1", "c1");

    expect(multiplier).toBe(1.0);
  });

  it("invalidateFeedback снижает credibilityScore и мультипликатор", async () => {
    userCredibilityProfileMock.findUnique.mockResolvedValue({
      id: "uc2",
      companyId: "c1",
      userId: "u1",
      credibilityScore: 100,
      totalFeedbacks: 1,
      invalidatedFeedbacks: 0,
    });
    userCredibilityProfileMock.update.mockResolvedValue({
      id: "uc2",
      companyId: "c1",
      userId: "u1",
      credibilityScore: 50,
      totalFeedbacks: 2,
      invalidatedFeedbacks: 1,
    });

    const result = await service.invalidateFeedback("u1", "c1");

    expect(result.credibilityScore).toBe(50);
    expect(result.totalFeedbacks).toBe(2);
    expect(result.invalidatedFeedbacks).toBe(1);

    userCredibilityProfileMock.findUnique.mockResolvedValue({
      id: "uc2",
      companyId: "c1",
      userId: "u1",
      credibilityScore: 50,
      totalFeedbacks: 2,
      invalidatedFeedbacks: 1,
    });

    const multiplier = await service.getMultiplier("u1", "c1");
    expect(multiplier).toBe(0.5);
  });

  it("изоляция по companyId: профиль ищется по compound ключу companyId+userId", async () => {
    userCredibilityProfileMock.findUnique.mockResolvedValue({
      id: "uc3",
      companyId: "cA",
      userId: "user-1",
      credibilityScore: 80,
      totalFeedbacks: 10,
      invalidatedFeedbacks: 2,
    });

    await service.getMultiplier("user-1", "cA");

    expect(userCredibilityProfileMock.findUnique).toHaveBeenCalledWith({
      where: {
        user_credibility_company_user_unique: {
          companyId: "cA",
          userId: "user-1",
        },
      },
    });
  });
});


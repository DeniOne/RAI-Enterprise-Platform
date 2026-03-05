import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

const MIN_MULTIPLIER = 0.1;
const MAX_MULTIPLIER = 1.0;

@Injectable()
export class FeedbackCredibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getMultiplier(
    userId: string,
    companyId: string,
  ): Promise<number> {
    const profile = await this.getOrCreateProfile(userId, companyId);
    const score = profile.credibilityScore ?? 100;
    const raw = score / 100;
    return Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, raw));
  }

  async invalidateFeedback(
    userId: string,
    companyId: string,
  ): Promise<{
    credibilityScore: number;
    totalFeedbacks: number;
    invalidatedFeedbacks: number;
  }> {
    const profile = await this.getOrCreateProfile(userId, companyId);
    const totalFeedbacks = profile.totalFeedbacks + 1;
    const invalidatedFeedbacks = profile.invalidatedFeedbacks + 1;
    const ratio =
      totalFeedbacks > 0 ? invalidatedFeedbacks / totalFeedbacks : 0;
    const credibilityScore = Math.max(
      0,
      Math.round(100 * (1 - ratio)),
    );

    const updated = await this.prisma.userCredibilityProfile.update({
      where: {
        user_credibility_company_user_unique: {
          companyId,
          userId,
        },
      },
      data: {
        totalFeedbacks,
        invalidatedFeedbacks,
        credibilityScore,
      },
    });

    return {
      credibilityScore: updated.credibilityScore,
      totalFeedbacks: updated.totalFeedbacks,
      invalidatedFeedbacks: updated.invalidatedFeedbacks,
    };
  }

  private async getOrCreateProfile(
    userId: string,
    companyId: string,
  ): Promise<{
    id: string;
    credibilityScore: number;
    totalFeedbacks: number;
    invalidatedFeedbacks: number;
  }> {
    const existing = await this.prisma.userCredibilityProfile.findUnique({
      where: {
        user_credibility_company_user_unique: {
          companyId,
          userId,
        },
      },
    });
    if (existing) {
      return existing;
    }
    const created = await this.prisma.userCredibilityProfile.create({
      data: {
        companyId,
        userId,
        credibilityScore: 100,
        totalFeedbacks: 0,
        invalidatedFeedbacks: 0,
      },
    });
    return created;
  }
}


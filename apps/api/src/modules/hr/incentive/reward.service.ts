import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class RewardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reward events are append-only.
   */
  async recordReward(
    data: {
      employeeId: string;
      type: "BONUS" | "EQUITY" | "PERK";
      amount?: number;
      reason: string;
    },
    companyId: string,
  ) {
    // Validation: verify employee belongs to company
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id: data.employeeId, companyId },
    });
    if (!employee) throw new Error("Employee not found in company");

    return this.prisma.hrRewardEvent.create({
      data: {
        employee: { connect: { id: data.employeeId } },
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        // companyId, // Not in schema, derived via employee
      },
    });
  }

  async getEmployeeRewards(employeeId: string, companyId: string) {
    // Validation: verify employee belongs to company
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) return [];

    return this.prisma.hrRewardEvent.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
  }
}

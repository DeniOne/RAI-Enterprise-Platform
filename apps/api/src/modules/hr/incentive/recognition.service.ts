import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class RecognitionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recognition events are append-only.
   */
  async recordRecognition(
    data: {
      employeeId: string;
      type: "PEER" | "MANAGER" | "SYSTEM";
      message: string;
    },
    companyId: string,
  ) {
    // Verify employee belongs to company
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id: data.employeeId, companyId },
    });
    if (!employee) throw new Error("Employee not found in company");

    return this.prisma.hrRecognitionEvent.create({
      data: {
        employee: { connect: { id: data.employeeId } },
        type: data.type,
        message: data.message,
        // companyId, // Not in schema
      },
    });
  }

  async getEmployeeRecognitions(employeeId: string, companyId: string) {
    // Verify employee belongs to company
    const employee = await this.prisma.employeeProfile.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) return [];

    return this.prisma.hrRecognitionEvent.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
  }
}

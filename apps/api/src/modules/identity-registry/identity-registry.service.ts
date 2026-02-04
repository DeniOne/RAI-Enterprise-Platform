import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  EmployeeProfile,
  RoleDefinition,
  LifecycleStatus,
} from "@prisma/client";

@Injectable()
export class IdentityRegistryService {
  constructor(private readonly prisma: PrismaService) { }

  // --- Role Definitions (Organizational Positions) ---

  async createRole(
    data: { name: string; description?: string },
    companyId: string,
  ): Promise<RoleDefinition> {
    return this.prisma.roleDefinition.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findRoles(companyId: string): Promise<RoleDefinition[]> {
    return this.prisma.roleDefinition.findMany({
      where: { companyId },
    });
  }

  // --- Employee Profiles ---

  async createProfile(
    data: {
      externalId?: string;
      userId?: string;
      roleId: string;
      orgUnitId?: string;
      clientId?: string;
      holdingId?: string;
    },
    companyId: string,
  ): Promise<EmployeeProfile> {
    // 1. Verify Role belongs to Company
    const role = await this.prisma.roleDefinition.findFirst({
      where: { id: data.roleId, companyId },
    });
    if (!role) {
      throw new ForbiddenException(
        `Role ${data.roleId} not found or access denied`,
      );
    }

    // 2. Verify Client/Holding boundary if provided
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, companyId },
      });
      if (!client) {
        throw new ForbiddenException(
          `Client ${data.clientId} not found or access denied`,
        );
      }
    }

    return this.prisma.employeeProfile.create({
      data: {
        externalId: data.externalId,
        user: data.userId ? { connect: { id: data.userId } } : undefined,
        role: { connect: { id: data.roleId } },
        orgUnitId: data.orgUnitId,
        company: { connect: { id: companyId } },
        client: data.clientId ? { connect: { id: data.clientId } } : undefined,
        holding: data.holdingId ? { connect: { id: data.holdingId } } : undefined,
        status: LifecycleStatus.ACTIVE,
      },
    });
  }

  async updateProfileStatus(
    id: string,
    status: LifecycleStatus,
    companyId: string,
  ): Promise<EmployeeProfile> {
    const profile = await this.prisma.employeeProfile.findFirst({
      where: { id, companyId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found or access denied`);
    }

    return this.prisma.employeeProfile.update({
      where: { id },
      data: { status },
    });
  }

  async findProfiles(
    companyId: string,
    filters?: { clientId?: string; holdingId?: string },
  ): Promise<EmployeeProfile[]> {
    return this.prisma.employeeProfile.findMany({
      where: {
        companyId,
        ...filters,
      },
      include: { role: true },
    });
  }
}

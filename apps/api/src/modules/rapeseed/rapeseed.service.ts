import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgroAuditService } from "../agro-audit/agro-audit.service";
import { CreateRapeseedInput } from "./dto/create-rapeseed.input";
import { UpdateRapeseedInput } from "./dto/update-rapeseed.input";
import { Rapeseed, RapeseedHistory, User } from '@rai/prisma-client';
import { AgriculturalAuditEvent } from "../agro-audit/enums/audit-events.enum";

@Injectable()
export class RapeseedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AgroAuditService,
  ) { }

  async create(
    input: CreateRapeseedInput,
    user: User,
    companyId: string,
  ): Promise<Rapeseed> {
    // Check uniqueness
    const existing = await this.prisma.rapeseed.findFirst({
      where: {
        name: input.name,
        companyId,
        isLatest: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Rapeseed with name ${input.name} already exists for this company`,
      );
    }

    const rapeseed = await this.prisma.rapeseed.create({
      data: {
        ...input,
        companyId,
        version: 1,
        isLatest: true,
      },
    });

    await this.auditService.log(AgriculturalAuditEvent.RAPESEED_CREATED, user, {
      rapeseedId: rapeseed.id,
      name: rapeseed.name,
    });

    return rapeseed;
  }

  async update(
    input: UpdateRapeseedInput,
    user: User,
    companyId: string,
  ): Promise<Rapeseed> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current latest version ensuring tenancy
      const currentRapeseed = await tx.rapeseed.findFirst({
        where: {
          id: input.id,
          companyId,
        },
      });

      if (!currentRapeseed) {
        throw new NotFoundException("Rapeseed not found");
      }

      if (!currentRapeseed.isLatest) {
        throw new BadRequestException(
          "You can only update the latest version of a Rapeseed",
        );
      }

      // 2. Deactivate old version
      await tx.rapeseed.update({
        where: { id: currentRapeseed.id },
        data: { isLatest: false },
      });

      // 3. Prepare new version data
      const { changeReason, ...updateData } = input;
      const newVersion = currentRapeseed.version + 1;

      // 4. Create new version
      const newRapeseed = await tx.rapeseed.create({
        data: {
          name: currentRapeseed.name,
          variety: updateData.variety ?? currentRapeseed.variety,
          reproduction: updateData.reproduction ?? currentRapeseed.reproduction,
          type: updateData.type ?? currentRapeseed.type,
          oilContent:
            updateData.oilContent ?? (currentRapeseed as any).oilContent,
          erucicAcid:
            updateData.erucicAcid ?? (currentRapeseed as any).erucicAcid,
          glucosinolates:
            updateData.glucosinolates ??
            (currentRapeseed as any).glucosinolates,
          vegetationPeriod:
            updateData.vegetationPeriod ?? currentRapeseed.vegetationPeriod,
          sowingNormMin:
            updateData.sowingNormMin ?? currentRapeseed.sowingNormMin,
          sowingNormMax:
            updateData.sowingNormMax ?? currentRapeseed.sowingNormMax,
          sowingDepthMin:
            updateData.sowingDepthMin ?? currentRapeseed.sowingDepthMin,
          sowingDepthMax:
            updateData.sowingDepthMax ?? currentRapeseed.sowingDepthMax,

          companyId,
          version: newVersion,
          isLatest: true,
        },
      });

      // 5. Create History Record
      await tx.rapeseedHistory.create({
        data: {
          rapeseedId: newRapeseed.id,
          version: newVersion,
          changeReason: changeReason || "Update",
          changedBy: user.id,
          snapshot: newRapeseed as any,
        },
      });

      // 6. Audit
      // Calculate diff for audit
      const diff: Record<string, any> = {};
      for (const key of Object.keys(updateData)) {
        if (
          updateData[key] !== currentRapeseed[key] &&
          updateData[key] !== undefined
        ) {
          diff[key] = { from: currentRapeseed[key], to: updateData[key] };
        }
      }

      await this.auditService.logRapeseedChange(
        newRapeseed.id,
        newVersion,
        user.id,
        user.companyId,
        diff,
      );

      return newRapeseed;
    });
  }

  async findAll(companyId: string): Promise<Rapeseed[]> {
    return this.prisma.rapeseed.findMany({
      where: {
        companyId,
        isLatest: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async getActiveRapeseedsByCompany(companyId: string): Promise<Rapeseed[]> {
    return this.findAll(companyId);
  }

  async getHistory(name: string, companyId: string): Promise<Rapeseed[]> {
    return this.prisma.rapeseed.findMany({
      where: {
        name,
        companyId,
      },
      orderBy: { version: "desc" },
    });
  }

  async getRapeseedVersionHistory(
    rapeseedId: string,
    companyId: string,
  ): Promise<Rapeseed[]> {
    const rapeseed = await this.prisma.rapeseed.findFirst({
      where: { id: rapeseedId, companyId },
    });
    if (!rapeseed) throw new NotFoundException("Rapeseed not found");

    return this.prisma.rapeseed.findMany({
      where: { name: rapeseed.name, companyId },
      orderBy: { version: "desc" },
    });
  }

  async getRapeseedVarieties(companyId: string): Promise<string[]> {
    const rapeseeds = await this.prisma.rapeseed.findMany({
      where: { companyId, isLatest: true },
      distinct: ["variety"],
      select: { variety: true },
    });
    return rapeseeds.map((r) => r.variety).filter((v): v is string => !!v);
  }

  /**
   * Calculates theoretical oil yield based on acreage and oil content.
   */
  async calculateOilYield(
    rapeseedId: string,
    area: number,
    companyId: string,
  ): Promise<number> {
    const rapeseed = await this.prisma.rapeseed.findFirst({
      where: {
        id: rapeseedId,
        OR: [{ companyId }, { companyId: null }],
      },
    });
    if (!rapeseed || !(rapeseed as any).oilContent) return 0;

    // Formula: Area (ha) * Potential Yield (t/ha) * Oil Content (%)
    // Simplified for this task: Area * OilContent * 0.4 (assuming 40% extraction efficiency of total content)
    return area * ((rapeseed as any).oilContent / 100) * 0.4;
  }

  validateRapeseedParameters(
    input: CreateRapeseedInput | UpdateRapeseedInput,
  ): void {
    if (
      input.sowingNormMin &&
      input.sowingNormMax &&
      input.sowingNormMin > input.sowingNormMax
    ) {
      throw new BadRequestException(
        "Min sowing norm cannot be greater than Max",
      );
    }
    if (
      input.sowingDepthMin &&
      input.sowingDepthMax &&
      input.sowingDepthMin > input.sowingDepthMax
    ) {
      throw new BadRequestException(
        "Min sowing depth cannot be greater than Max",
      );
    }
  }
}

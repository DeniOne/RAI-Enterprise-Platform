import { ClimateType, RegionProfile } from "@rai/prisma-client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

type SuggestedOperation = {
  operationType: string;
  isMandatory: boolean;
  rationale: string;
};

@Injectable()
export class RegionProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileForField(
    fieldId: string,
    companyId: string,
  ): Promise<RegionProfile | null> {
    const latestTechMap = await this.prisma.techMap.findFirst({
      where: {
        fieldId,
        companyId,
      },
      select: {
        cropZone: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (latestTechMap?.cropZone?.id) {
      const regionProfile = await (this.prisma as any).cropZone?.findFirst?.({
        where: {
          id: latestTechMap.cropZone.id,
          companyId,
        },
        select: {
          regionProfile: true,
        },
      });

      if (regionProfile?.regionProfile) {
        return regionProfile.regionProfile as RegionProfile;
      }
    }

    return this.prisma.regionProfile.findFirst({
      where: {
        OR: [{ companyId }, { companyId: null }],
      },
      orderBy: [
        { companyId: "desc" },
        { updatedAt: "desc" },
      ],
    });
  }

  calculateSowingWindow(
    profile: RegionProfile,
    targetGDD: number,
    referenceDate: Date,
  ): { earliestDate: Date; latestDate: Date; windowDays: number } {
    const offsets: Record<
      ClimateType,
      { gddOffset: number; windowDays: number; reverse: boolean }
    > = {
      MARITIME_HUMID: { gddOffset: 0, windowDays: 14, reverse: true },
      STEPPE_DRY: { gddOffset: 10, windowDays: 10, reverse: false },
      CONTINENTAL_COLD: { gddOffset: 0, windowDays: 7, reverse: false },
    };

    const offset = offsets[profile.climateType] ?? {
      gddOffset: 0,
      windowDays: 10,
      reverse: false,
    };
    const baseTemp = profile.gddBaseTempC ?? 5;
    const daysToSowing = (targetGDD + offset.gddOffset) / baseTemp;
    const direction = offset.reverse ? -1 : 1;
    const earliestDate = new Date(
      referenceDate.getTime() + direction * daysToSowing * 86400000,
    );
    const latestDate = new Date(
      earliestDate.getTime() + offset.windowDays * 86400000,
    );

    return {
      earliestDate,
      latestDate,
      windowDays: offset.windowDays,
    };
  }

  suggestOperationTypes(
    profile: RegionProfile,
    _cropType: string,
  ): SuggestedOperation[] {
    const operations: SuggestedOperation[] = [
      {
        operationType: "TILLAGE",
        isMandatory: true,
        rationale: "Базовая подготовка почвы для любого региона",
      },
      {
        operationType: "SEEDING",
        isMandatory: true,
        rationale: "Посев обязателен для любой техкарты",
      },
      {
        operationType: "HERBICIDE_APP",
        isMandatory: true,
        rationale: "Базовый контроль сорняков",
      },
      {
        operationType: "HARVEST",
        isMandatory: true,
        rationale: "Уборка обязательна для завершения цикла",
      },
    ];

    if (profile.climateType === ClimateType.CONTINENTAL_COLD) {
      operations.push(
        {
          operationType: "SEED_TREATMENT",
          isMandatory: true,
          rationale: "Холодный континентальный профиль требует усиленной защиты семян",
        },
        {
          operationType: "DESICCATION",
          isMandatory: true,
          rationale: "Короткий безморозный период требует обязательной десикации",
        },
      );
    }

    if (profile.climateType === ClimateType.MARITIME_HUMID) {
      operations.push(
        {
          operationType: "FUNGICIDE_APP",
          isMandatory: true,
          rationale: "Влажный морской профиль требует первой обязательной фунгицидной обработки",
        },
        {
          operationType: "FUNGICIDE_APP",
          isMandatory: true,
          rationale: "Влажный морской профиль требует второй обязательной фунгицидной обработки",
        },
      );
    }

    if (profile.climateType === ClimateType.STEPPE_DRY) {
      operations.push({
        operationType: "SOIL_MOISTURE_CHECK",
        isMandatory: false,
        rationale: "Сухой степной профиль усиливает контроль влаги",
      });
    }

    return operations;
  }
}

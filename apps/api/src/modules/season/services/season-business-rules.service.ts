import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { AgroAuditService } from "../../agro-audit/agro-audit.service";
import { AgriculturalAuditEvent } from "../../agro-audit/enums/audit-events.enum";
import { Season, RapeseedType } from "@rai/prisma-client";

@Injectable()
export class SeasonBusinessRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AgroAuditService,
  ) { }

  /**
   * entry point for all rapeseed specific validations
   */
  async validateRapeseedSeason(season: any): Promise<void> {
    const rapeseed = await this.prisma.rapeseed.findFirst({
      where: { id: season.rapeseedId, companyId: season.companyId },
    });

    if (!rapeseed) return;

    // 1. Validate Dates based on Rapeseed Type
    this.validateRapeseedSeasonDates(season.startDate, rapeseed.type, season.companyId);

    // 2. Validate Yield Target
    this.validateYieldTarget(season.expectedYield);

    // 3. Validate Crop Rotation
    await this.validateCropRotation(
      season.fieldId,
      season.year,
      season.rapeseedId,
      season.companyId,
    );
  }

  /**
   * Validates sowing dates for Rapeseed.
   */
  validateRapeseedSeasonDates(
    startDate: Date | null,
    type: RapeseedType,
    companyId: string,
  ): void {
    if (!startDate) return;

    const date = new Date(startDate);
    const month = date.getMonth() + 1; // 1-indexed

    if (type === RapeseedType.WINTER) {
      if (month < 8 || month > 9) {
        const message = "Озимый рапс должен высеваться в августе-сентябре";
        this._logViolation(message, { type, month }, companyId);
        throw new BadRequestException(message);
      }
    } else if (type === RapeseedType.SPRING) {
      if (month < 4 || month > 5) {
        const message = "Яровой рапс должен высеваться в апреле-мае";
        this._logViolation(message, { type, month }, companyId);
        throw new BadRequestException(message);
      }
    }
  }

  /**
   * Validates that Rapeseed was not grown on the same field for the last 4 years.
   */
  async validateCropRotation(
    fieldId: string,
    currentYear: number,
    rapeseedId: string,
    companyId: string,
  ): Promise<void> {
    const previousSeasons = await this.prisma.season.findMany({
      where: {
        companyId,
        fieldId,
        year: {
          gte: currentYear - 4,
          lt: currentYear,
        },
        rapeseedId,
      },
    });

    if (previousSeasons.length > 0) {
      const message = `Нарушение севооборота: Рапс уже выращивался на этом поле в последние 4 года (года: ${previousSeasons.map((s) => s.year).join(", ")})`;
      this._logViolation(message, {
        fieldId,
        currentYear,
        previousYears: previousSeasons.map((s) => s.year),
      }, companyId);
      throw new BadRequestException(message);
    }
  }

  private _logViolation(message: string, context: any, companyId: string): void {
    this.auditService
      .log(
        AgriculturalAuditEvent.RAPESEED_ROTATION_VIOLATION,
        { id: "SYSTEM", companyId } as any,
        { message, ...context },
      )
      .catch(() => { });
  }

  /**
   * Placeholder for yield target validation.
   */
  validateYieldTarget(expectedYield: number | null): void {
    if (expectedYield && (expectedYield < 1 || expectedYield > 6)) {
      throw new BadRequestException(
        "Целевая урожайность рапса должна быть в диапазоне 1-6 т/га",
      );
    }
  }
}

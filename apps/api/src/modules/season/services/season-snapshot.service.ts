import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { AgroAuditService } from "../../agro-audit/agro-audit.service";
import { AgriculturalAuditEvent } from "../../agro-audit/enums/audit-events.enum";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class SeasonSnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AgroAuditService,
  ) {}

  /**
   * Creates a physical snapshot of the season data inside a transaction.
   */
  async createSnapshotTransaction(
    tx: Prisma.TransactionClient,
    seasonId: string,
    user: User,
  ): Promise<void> {
    const season = await tx.season.findUnique({
      where: { id: seasonId },
      include: {
        field: true,
        rapeseed: true,
        technologyCard: {
          include: {
            operations: true,
          },
        },
      },
    });

    if (!season) return;

    await tx.seasonSnapshot.create({
      data: {
        seasonId: season.id,
        year: season.year,
        status: season.status,
        fieldId: season.fieldId,
        rapeseedId: season.rapeseedId,
        expectedYield: season.expectedYield,
        actualYield: season.actualYield,
        startDate: season.startDate,
        endDate: season.endDate,
        companyId: season.companyId,
        createdBy: user.id,
        snapshotData: season as any,
      },
    });
  }

  /**
   * Creates a physical snapshot of the season data.
   * Supports external transactions and independent use.
   */
  async createSnapshot(
    seasonId: string,
    user: User,
    companyId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (tx) {
      return this.createSnapshotTransaction(tx, seasonId, user);
    }

    return this.prisma.$transaction(async (innerTx) => {
      await this.createSnapshotTransaction(innerTx, seasonId, user);

      await this.auditService.logWithRetry(
        AgriculturalAuditEvent.SEASON_SNAPSHOT_CREATED,
        user,
        { seasonId },
      );
    });
  }
}

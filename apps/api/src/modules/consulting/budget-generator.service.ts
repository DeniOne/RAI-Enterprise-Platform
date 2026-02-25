import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { UnitNormalizationService } from "./unit-normalization.service";
import {
  TechMap,
  TechMapStatus,
  BudgetType,
  BudgetStatus,
} from "@rai/prisma-client";
import * as crypto from "crypto";

@Injectable()
export class BudgetGeneratorService {
  private readonly logger = new Logger(BudgetGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitService: UnitNormalizationService,
  ) {}

  /**
   * Generates an OPERATIONAL budget from an Active TechMap.
   * Enforces deterministic calculation and complete traceability.
   */
  async generateOperationalBudget(
    techMapId: string,
    userId: string,
    companyId: string,
  ) {
    // 1. Fetch TechMap with full hierarchy
    const techMap = await this.prisma.techMap.findFirst({
      where: { id: techMapId, companyId },
      include: {
        stages: {
          include: {
            operations: {
              include: {
                resources: true,
              },
            },
          },
        },
        field: true, // Need area
      },
    });

    if (!techMap) throw new NotFoundException("TechMap not found");
    if (techMap.status !== TechMapStatus.ACTIVE) {
      throw new BadRequestException(
        "Budget can only be generated from an ACTIVE TechMap",
      );
    }

    // 2. Fetch Prices (Mock/Phase 2.1: Use costPerUnit from TechMap as "Planned Price" snapshot)
    // In Phase 3, this would fetch from a PriceBook or Procurement Contract.
    // For Phase 2, we respect the 'costPerUnit' defined in the TechMap as the "Standard Cost".

    // 3. Calculation & Deterministic Structure
    const budgetLines = this.calculateBudgetLines(techMap);

    // 4. Calculate Hash
    const derivationHash = this.calculateDerivationHash(
      techMap.id,
      techMap.version,
      budgetLines,
    );

    // 5. Transactional Creation
    return this.prisma.$transaction(async (tx) => {
      // Check if exists for this version?
      const existing = await tx.budgetPlan.findFirst({
        where: {
          harvestPlanId: techMap.harvestPlanId,
          version: techMap.version, // Link version to version? Or just strict link?
          type: BudgetType.OPERATIONAL,
          companyId: techMap.companyId,
        },
      });

      if (existing) {
        // If exists and DRAFT, update? Or throwing error?
        // Phase 2 strict: One Budget per TechMap Version.
        throw new BadRequestException(
          `Operational Budget already exists for TechMap v${techMap.version}`,
        );
      }

      const header = await tx.budgetPlan.create({
        data: {
          harvestPlanId: techMap.harvestPlanId,
          seasonId: techMap.seasonId,
          companyId: techMap.companyId,
          version: techMap.version,
          type: BudgetType.OPERATIONAL,
          status: BudgetStatus.DRAFT,
          derivationHash: derivationHash,
          techMapSnapshotId: techMap.id,
          totalPlannedAmount: budgetLines.reduce(
            (sum, l) => sum + l.totalCost,
            0,
          ),
        },
      });

      if (budgetLines.length > 0) {
        await tx.budgetItem.createMany({
          data: budgetLines.map((l) => ({
            budgetPlanId: header.id,
            companyId: techMap.companyId, // Fix: Missing required field
            category: l.category,
            plannedNorm: l.plannedNorm,
            plannedPrice: l.plannedPrice,
            plannedAmount: l.totalCost,
            actualAmount: 0,
          })),
        });
      }

      return header;
    });
  }

  private calculateBudgetLines(techMap: any) {
    const fieldArea = techMap.field.area;
    const fieldUnit = "ha"; // Assume Field.area is always HA in DB per policy

    const lines = [];

    for (const stage of techMap.stages) {
      for (const op of stage.operations) {
        for (const res of op.resources) {
          // Normalize Norm (Resource amount) to base unit
          const normalizedNorm = this.unitService.normalize(
            res.amount,
            res.unit,
          );

          // Normalize Area (redundant but safe)
          const normalizedArea = this.unitService.normalize(
            fieldArea,
            fieldUnit,
          );

          // Formula: Norm * Area * Price (Norm is per Ha)
          const quantity = normalizedNorm.value * normalizedArea.value;
          const price = res.costPerUnit || 0;
          const totalCost = quantity * price;

          lines.push({
            resourceId: res.id,
            name: res.name,
            category: this.mapResourceToCategory(res.type),
            plannedNorm: normalizedNorm.value,
            plannedPrice: price,
            totalCost,
          });
        }
      }
    }
    return lines;
  }

  private mapResourceToCategory(type: string): any {
    const t = type.toUpperCase();
    if (t.includes("SEED")) return "SEEDS";
    if (t.includes("FERT")) return "FERTILIZER";
    if (t.includes("FUEL")) return "FUEL";
    if (t.includes("LABOR")) return "LABOR";
    if (t.includes("MACH")) return "MACHINERY";
    return "OTHER";
  }

  /**
   * Deterministic hashing with stable key ordering.
   */
  private calculateDerivationHash(
    mapId: string,
    version: number,
    lines: any[],
  ): string {
    // 1. Sort lines by resourceId (Stable)
    const sortedLines = [...lines].sort((a, b) =>
      a.resourceId.localeCompare(b.resourceId),
    );

    // 2. Build canonical payload (Fixed key order)
    const payload = {
      mapId: mapId,
      version: version,
      lines: sortedLines.map((l) => ({
        id: l.resourceId,
        c: l.category,
        n: l.plannedNorm,
        p: l.plannedPrice,
        t: l.totalCost,
      })),
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
  }
}

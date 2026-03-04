import { createHash } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

export interface ContractCorePayload {
  techMapId: string;
  companyId: string;
  fieldId: string;
  cropType: string;
  targetYieldTHa: number;
  budgetCapRubHa: number;
  criticalOperations: Array<{
    id: string;
    operationType: string;
    bbchWindowFrom: number | null;
  }>;
  sealedAt: string;
  version: number;
}

@Injectable()
export class ContractCoreService {
  constructor(private readonly prisma: PrismaService) {}

  async generateContractCore(
    techMapId: string,
    companyId: string,
  ): Promise<ContractCorePayload> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      include: {
        cropZone: {
          select: {
            targetYieldTHa: true,
          },
        },
        stages: {
          include: {
            operations: {
              select: {
                id: true,
                operationType: true,
                bbchWindowFrom: true,
                isCritical: true,
              },
            },
          },
        },
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }

    const criticalOperations = techMap.stages
      .flatMap((stage) => stage.operations)
      .filter((operation) => operation.isCritical)
      .map((operation) => ({
        id: operation.id,
        operationType: operation.operationType ?? "UNSPECIFIED",
        bbchWindowFrom: this.parseBbchWindow(operation.bbchWindowFrom),
      }))
      .sort((left, right) => left.id.localeCompare(right.id));

    return {
      techMapId: techMap.id,
      companyId,
      fieldId: techMap.fieldId,
      cropType: techMap.crop,
      targetYieldTHa: techMap.cropZone?.targetYieldTHa ?? 0,
      budgetCapRubHa: techMap.budgetCapRubHa ?? 0,
      criticalOperations,
      sealedAt: (techMap.approvedAt ?? techMap.createdAt).toISOString(),
      version: techMap.version,
    };
  }

  hashContractCore(core: ContractCorePayload): string {
    const canonical = this.stableStringify(core);
    return createHash("sha256").update(canonical).digest("hex");
  }

  async sealContractCore(
    techMapId: string,
    companyId: string,
  ): Promise<{ hash: string; sealedAt: Date }> {
    const core = await this.generateContractCore(techMapId, companyId);
    const hash = this.hashContractCore(core);
    const sealedAt = new Date(core.sealedAt);

    await this.prisma.techMap.update({
      where: {
        id: techMapId,
      },
      data: {
        basePlanHash: hash,
      },
    });

    return { hash, sealedAt };
  }

  async verifyIntegrity(
    techMapId: string,
    companyId: string,
  ): Promise<{ valid: boolean; storedHash: string; currentHash: string }> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      select: {
        basePlanHash: true,
      },
    });

    if (!techMap?.basePlanHash) {
      throw new NotFoundException("Stored contract hash not found");
    }

    const core = await this.generateContractCore(techMapId, companyId);
    const currentHash = this.hashContractCore({
      ...core,
      sealedAt: core.sealedAt,
    });

    return {
      valid: techMap.basePlanHash === currentHash,
      storedHash: techMap.basePlanHash,
      currentHash,
    };
  }

  private parseBbchWindow(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private stableStringify(value: unknown): string {
    if (value == null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );

    return `{${entries
      .map(
        ([key, nestedValue]) =>
          `${JSON.stringify(key)}:${this.stableStringify(nestedValue)}`,
      )
      .join(",")}}`;
  }
}

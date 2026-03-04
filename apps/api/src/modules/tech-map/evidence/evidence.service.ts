import { Injectable, NotFoundException } from "@nestjs/common";
import { Evidence, EvidenceType, Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { EvidenceCreateDto } from "../dto/evidence.dto";

type CompletionResult = {
  isComplete: boolean;
  missingEvidenceTypes: EvidenceType[];
  presentEvidenceTypes: EvidenceType[];
};

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async attachEvidence(
    dto: EvidenceCreateDto,
    companyId: string,
  ): Promise<Evidence> {
    return this.prisma.evidence.create({
      data: {
        operationId: dto.operationId,
        observationId: dto.observationId,
        evidenceType: dto.evidenceType,
        fileUrl: dto.fileUrl,
        geoPoint: dto.geoPoint as Prisma.InputJsonValue | undefined,
        capturedAt: dto.capturedAt,
        capturedByUserId: dto.capturedByUserId,
        checksum: dto.checksum,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        companyId,
      },
    });
  }

  async validateOperationCompletion(
    operationId: string,
    companyId: string,
  ): Promise<CompletionResult> {
    const operation = await this.prisma.mapOperation.findFirst({
      where: {
        id: operationId,
        mapStage: {
          techMap: {
            companyId,
          },
        },
      },
      select: {
        evidenceRequired: true,
      },
    });

    if (!operation) {
      throw new NotFoundException("MapOperation not found");
    }

    const required = this.extractEvidenceTypes(operation.evidenceRequired);
    if (required.length === 0) {
      return {
        isComplete: true,
        missingEvidenceTypes: [],
        presentEvidenceTypes: [],
      };
    }

    const evidence = await this.prisma.evidence.findMany({
      where: {
        operationId,
        companyId,
      },
      select: {
        evidenceType: true,
      },
    });

    const presentEvidenceTypes = Array.from(
      new Set(evidence.map((item) => item.evidenceType)),
    );
    const missingEvidenceTypes = required.filter(
      (type) => !presentEvidenceTypes.includes(type),
    );

    return {
      isComplete: missingEvidenceTypes.length === 0,
      missingEvidenceTypes,
      presentEvidenceTypes,
    };
  }

  async getByOperation(operationId: string, companyId: string): Promise<Evidence[]> {
    return this.prisma.evidence.findMany({
      where: {
        operationId,
        companyId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  private extractEvidenceTypes(value: unknown): EvidenceType[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is EvidenceType =>
      Object.values(EvidenceType).includes(item as EvidenceType),
    );
  }
}

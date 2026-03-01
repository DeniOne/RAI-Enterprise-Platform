import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  AgroEventCommittedRecord,
  AgroEventDraftPatch,
  AgroEventDraftRecord,
  AgroEventDraftStatus,
} from "./agro-events.types";

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AgroEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(data: {
    companyId: string;
    userId: string;
    status: AgroEventDraftStatus;
    eventType: string;
    timestamp: string;
    farmRef?: string | null;
    fieldRef?: string | null;
    taskRef?: string | null;
    payload: Record<string, any>;
    evidence: any[];
    confidence: number;
    missingMust: string[];
  }): Promise<AgroEventDraftRecord> {
    const created = await this.prisma.agroEventDraft.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        status: data.status,
        eventType: data.eventType,
        timestamp: new Date(data.timestamp),
        farmRef: data.farmRef ?? null,
        fieldRef: data.fieldRef ?? null,
        taskRef: data.taskRef ?? null,
        payloadJson: data.payload as any,
        evidenceJson: data.evidence as any,
        confidence: data.confidence,
        missingMust: data.missingMust,
        expiresAt: this.buildExpiresAt(),
      },
    });

    return this.mapDraft(created);
  }

  async getDraft(
    companyId: string,
    userId: string,
    draftId: string,
  ): Promise<AgroEventDraftRecord> {
    const draft = await this.prisma.agroEventDraft.findFirst({
      where: { id: draftId, companyId, userId },
    });

    if (!draft) {
      throw new NotFoundException("Черновик не найден");
    }

    return this.mapDraft(draft);
  }

  async updateDraft(
    companyId: string,
    userId: string,
    draftId: string,
    patch: AgroEventDraftPatch & {
      status?: AgroEventDraftStatus;
      missingMust?: string[];
    },
  ): Promise<AgroEventDraftRecord> {
    const result = await this.prisma.agroEventDraft.updateMany({
      where: { id: draftId, companyId, userId },
      data: {
        status: patch.status,
        timestamp: patch.timestamp ? new Date(patch.timestamp) : undefined,
        farmRef:
          patch.farmRef !== undefined ? (patch.farmRef ?? null) : undefined,
        fieldRef:
          patch.fieldRef !== undefined ? (patch.fieldRef ?? null) : undefined,
        taskRef:
          patch.taskRef !== undefined ? (patch.taskRef ?? null) : undefined,
        payloadJson: patch.payload as any,
        evidenceJson: patch.evidence as any,
        confidence: patch.confidence,
        missingMust: patch.missingMust,
        expiresAt: this.buildExpiresAt(),
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException("Черновик не найден");
    }

    return this.getDraft(companyId, userId, draftId);
  }

  async findCommitted(
    companyId: string,
    draftId: string,
  ): Promise<AgroEventCommittedRecord | null> {
    const committed = await this.prisma.agroEventCommitted.findFirst({
      where: { id: draftId, companyId },
    });

    return committed ? this.mapCommitted(committed) : null;
  }

  async commitDraft(data: {
    companyId: string;
    userId: string;
    draftId: string;
    provenanceHash: string;
  }): Promise<{
    draft: AgroEventDraftRecord;
    committed: AgroEventCommittedRecord;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.agroEventDraft.findFirst({
        where: {
          id: data.draftId,
          companyId: data.companyId,
          userId: data.userId,
        },
      });

      if (!draft) {
        throw new NotFoundException("Черновик не найден");
      }

      const existingCommitted = await tx.agroEventCommitted.findFirst({
        where: { id: data.draftId, companyId: data.companyId },
      });

      let committed = existingCommitted;
      if (!committed) {
        committed = await tx.agroEventCommitted.create({
          data: {
            id: draft.id,
            companyId: data.companyId,
            farmRef: draft.farmRef,
            fieldRef: draft.fieldRef,
            taskRef: draft.taskRef,
            eventType: draft.eventType,
            payloadJson: draft.payloadJson as any,
            evidenceJson: draft.evidenceJson as any,
            timestamp: draft.timestamp,
            committedBy: data.userId,
            provenanceHash: data.provenanceHash,
          },
        });
      }

      const draftUpdate = await tx.agroEventDraft.updateMany({
        where: {
          id: data.draftId,
          companyId: data.companyId,
          userId: data.userId,
        },
        data: {
          status: "COMMITTED",
          missingMust: [],
          expiresAt: this.buildExpiresAt(),
        },
      });

      if (draftUpdate.count !== 1) {
        throw new ConflictException("Не удалось обновить статус черновика");
      }

      const finalDraft = await tx.agroEventDraft.findFirst({
        where: {
          id: data.draftId,
          companyId: data.companyId,
          userId: data.userId,
        },
      });

      if (!finalDraft) {
        throw new NotFoundException("Черновик не найден после commit");
      }

      return {
        draft: this.mapDraft(finalDraft),
        committed: this.mapCommitted(committed),
      };
    });
  }

  private buildExpiresAt() {
    return new Date(Date.now() + DRAFT_TTL_MS);
  }

  private mapDraft(db: any): AgroEventDraftRecord {
    return {
      id: db.id,
      companyId: db.companyId,
      userId: db.userId,
      status: db.status,
      eventType: db.eventType,
      timestamp: db.timestamp.toISOString(),
      farmRef: db.farmRef,
      fieldRef: db.fieldRef,
      taskRef: db.taskRef,
      payload: (db.payloadJson ?? {}) as Record<string, any>,
      evidence: Array.isArray(db.evidenceJson) ? db.evidenceJson : [],
      confidence: db.confidence,
      missingMust: db.missingMust ?? [],
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString(),
      expiresAt: db.expiresAt.toISOString(),
    };
  }

  private mapCommitted(db: any): AgroEventCommittedRecord {
    return {
      id: db.id,
      companyId: db.companyId,
      farmRef: db.farmRef,
      fieldRef: db.fieldRef,
      taskRef: db.taskRef,
      eventType: db.eventType,
      payload: (db.payloadJson ?? {}) as Record<string, any>,
      evidence: Array.isArray(db.evidenceJson) ? db.evidenceJson : [],
      timestamp: db.timestamp.toISOString(),
      committedAt: db.committedAt.toISOString(),
      committedBy: db.committedBy,
      provenanceHash: db.provenanceHash,
    };
  }
}

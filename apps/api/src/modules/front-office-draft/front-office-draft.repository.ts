import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  FrontOfficeCommittedRecord,
  FrontOfficeDraftRecord,
  FrontOfficeDraftStatus,
} from "./front-office-draft.types";

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class FrontOfficeDraftRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get draftModel() {
    return (this.prisma as any).frontOfficeDraft;
  }

  private get committedModel() {
    return (this.prisma as any).frontOfficeCommittedEvent;
  }

  async createDraft(data: {
    companyId: string;
    userId: string;
    status: FrontOfficeDraftStatus;
    eventType: string;
    timestamp: string;
    farmRef?: string | null;
    fieldId?: string | null;
    taskId?: string | null;
    payload: Record<string, any>;
    evidence: any[];
    confidence: number;
    mustClarifications: string[];
  }): Promise<FrontOfficeDraftRecord> {
    const created = await this.draftModel.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        status: data.status,
        eventType: data.eventType,
        timestamp: new Date(data.timestamp),
        threadKey: this.normalizeOptional(data.payload.threadKey),
        farmRef: data.farmRef ?? null,
        fieldRef: data.fieldId ?? null,
        seasonRef: this.normalizeOptional(data.payload.seasonId),
        taskRef: data.taskId ?? null,
        payloadJson: data.payload as any,
        evidenceJson: data.evidence as any,
        confidence: data.confidence,
        missingMust: data.mustClarifications,
        expiresAt: this.buildExpiresAt(),
      },
    });

    return this.mapDraft(created);
  }

  async getDraft(companyId: string, draftId: string): Promise<FrontOfficeDraftRecord> {
    const draft = await this.draftModel.findFirst({
      where: { id: draftId, companyId },
    });

    if (!draft) {
      throw new NotFoundException("Front-office draft not found");
    }

    return this.mapDraft(draft);
  }

  async updateDraft(
    companyId: string,
    draftId: string,
    patch: {
      status?: FrontOfficeDraftStatus;
      timestamp?: string;
      farmRef?: string | null;
      fieldId?: string | null;
      taskId?: string | null;
      payload?: Record<string, any>;
      evidence?: any[];
      confidence?: number;
      mustClarifications?: string[];
    },
  ): Promise<FrontOfficeDraftRecord> {
    const result = await this.draftModel.updateMany({
      where: { id: draftId, companyId },
      data: {
        status: patch.status,
        timestamp: patch.timestamp ? new Date(patch.timestamp) : undefined,
        threadKey:
          patch.payload !== undefined
            ? this.normalizeOptional(patch.payload?.threadKey)
            : undefined,
        farmRef: patch.farmRef !== undefined ? (patch.farmRef ?? null) : undefined,
        fieldRef: patch.fieldId !== undefined ? (patch.fieldId ?? null) : undefined,
        seasonRef:
          patch.payload !== undefined
            ? this.normalizeOptional(patch.payload?.seasonId)
            : undefined,
        taskRef: patch.taskId !== undefined ? (patch.taskId ?? null) : undefined,
        payloadJson: patch.payload as any,
        evidenceJson: patch.evidence as any,
        confidence: patch.confidence,
        missingMust: patch.mustClarifications,
        expiresAt: this.buildExpiresAt(),
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException("Front-office draft not found");
    }

    return this.getDraft(companyId, draftId);
  }

  async listDrafts(companyId: string, params?: { statuses?: FrontOfficeDraftStatus[]; take?: number }) {
    const drafts = await this.draftModel.findMany({
      where: {
        companyId,
        ...(params?.statuses?.length ? { status: { in: params.statuses } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: params?.take ?? 100,
    });

    return drafts.map((draft) => this.mapDraft(draft));
  }

  async listCommitted(companyId: string, take = 25) {
    const committed = await this.committedModel.findMany({
      where: { companyId },
      orderBy: { committedAt: "desc" },
      take,
    });

    return committed.map((entry) => this.mapCommitted(entry));
  }

  async findCommitted(
    companyId: string,
    draftId: string,
  ): Promise<FrontOfficeCommittedRecord | null> {
    const committed = await this.committedModel.findFirst({
      where: { id: draftId, companyId },
    });

    return committed ? this.mapCommitted(committed) : null;
  }

  async commitDraft(data: {
    companyId: string;
    draftId: string;
    committedBy: string;
    provenanceHash: string;
  }): Promise<{
    draft: FrontOfficeDraftRecord;
    committed: FrontOfficeCommittedRecord;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const draftModel = (tx as any).frontOfficeDraft;
      const committedModel = (tx as any).frontOfficeCommittedEvent;
      const draft = await draftModel.findFirst({
        where: { id: data.draftId, companyId: data.companyId },
      });

      if (!draft) {
        throw new NotFoundException("Front-office draft not found");
      }

      const existingCommitted = await committedModel.findFirst({
        where: { id: data.draftId, companyId: data.companyId },
      });

      let committed = existingCommitted;
      if (!committed) {
        committed = await committedModel.create({
          data: {
            id: draft.id,
            companyId: data.companyId,
            threadKey: draft.threadKey ?? null,
            farmRef: draft.farmRef,
            fieldRef: draft.fieldRef,
            seasonRef: draft.seasonRef ?? null,
            taskRef: draft.taskRef,
            eventType: draft.eventType,
            payloadJson: draft.payloadJson as any,
            evidenceJson: draft.evidenceJson as any,
            timestamp: draft.timestamp,
            committedBy: data.committedBy,
            provenanceHash: data.provenanceHash,
          },
        });
      }

      const draftUpdate = await draftModel.updateMany({
        where: { id: data.draftId, companyId: data.companyId },
        data: {
          status: "COMMITTED",
          missingMust: [],
          expiresAt: this.buildExpiresAt(),
        },
      });

      if (draftUpdate.count !== 1) {
        throw new ConflictException("Failed to update front-office draft status");
      }

      const finalDraft = await draftModel.findFirst({
        where: { id: data.draftId, companyId: data.companyId },
      });

      if (!finalDraft) {
        throw new NotFoundException("Front-office draft disappeared after commit");
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

  private mapDraft(db: any): FrontOfficeDraftRecord {
    const payload = (db.payloadJson ?? {}) as Record<string, any>;
    return {
      id: db.id,
      companyId: db.companyId,
      userId: db.userId,
      status: db.status,
      eventType: db.eventType,
      timestamp: db.timestamp.toISOString(),
      anchor: {
        farmRef: db.farmRef ?? null,
        fieldId: db.fieldRef ?? null,
        seasonId: db.seasonRef ?? payload.seasonId ?? null,
        taskId: db.taskRef ?? null,
      },
      payload,
      evidence: Array.isArray(db.evidenceJson) ? db.evidenceJson : [],
      confidence: db.confidence,
      mustClarifications: db.missingMust ?? [],
      createdAt: db.createdAt.toISOString(),
      updatedAt: db.updatedAt.toISOString(),
      expiresAt: db.expiresAt.toISOString(),
    };
  }

  private mapCommitted(db: any): FrontOfficeCommittedRecord {
    const payload = (db.payloadJson ?? {}) as Record<string, any>;
    return {
      id: db.id,
      companyId: db.companyId,
      eventType: db.eventType,
      timestamp: db.timestamp.toISOString(),
      committedAt: db.committedAt.toISOString(),
      committedBy: db.committedBy,
      provenanceHash: db.provenanceHash,
      payload,
      evidence: Array.isArray(db.evidenceJson) ? db.evidenceJson : [],
      anchor: {
        farmRef: db.farmRef ?? null,
        fieldId: db.fieldRef ?? null,
        seasonId: db.seasonRef ?? payload.seasonId ?? null,
        taskId: db.taskRef ?? null,
      },
    };
  }

  private normalizeOptional(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { createHash } from "crypto";
import {
  CommitAgroEventDto,
  CreateAgroEventDraftDto,
  FixAgroEventDto,
  LinkAgroEventDto,
} from "./dto/agro-events.dto";
import { AgroEventsRepository } from "./agro-events.repository";
import { AgroEventsMustValidator } from "./agro-events.validator";
import {
  AgroEventCommittedRecord,
  AgroEventDraftPatch,
  AgroEventDraftRecord,
  AgroEventsActorContext,
} from "./agro-events.types";

@Injectable()
export class AgroEventsOrchestratorService {
  private readonly logger = new Logger(AgroEventsOrchestratorService.name);

  constructor(
    private readonly repository: AgroEventsRepository,
    private readonly validator: AgroEventsMustValidator,
  ) {}

  async createDraft(
    actor: AgroEventsActorContext,
    dto: CreateAgroEventDraftDto,
  ) {
    const draft = this.buildDraft(actor, dto);
    const missingMust = this.validator.validateMust(draft);

    const created = await this.repository.createDraft({
      companyId: actor.companyId,
      userId: actor.userId,
      status: missingMust.length === 0 ? "READY_FOR_CONFIRM" : "DRAFT",
      eventType: draft.eventType,
      timestamp: draft.timestamp,
      farmRef: draft.farmRef,
      fieldRef: draft.fieldRef,
      taskRef: draft.taskRef,
      payload: draft.payload,
      evidence: draft.evidence,
      confidence: draft.confidence,
      missingMust,
    });

    return { draft: created, ui: this.buildUi(created) };
  }

  async fix(actor: AgroEventsActorContext, dto: FixAgroEventDto) {
    const current = await this.repository.getDraft(
      actor.companyId,
      actor.userId,
      dto.draftId,
    );

    const patch = this.sanitizePatch(dto.patch);
    const payload = {
      ...current.payload,
      ...(patch.payload ?? {}),
    };
    if (patch.description) {
      payload.description = patch.description;
    }

    const candidate: AgroEventDraftRecord = {
      ...current,
      timestamp: patch.timestamp ?? current.timestamp,
      farmRef:
        patch.farmRef !== undefined ? (patch.farmRef ?? null) : current.farmRef,
      fieldRef:
        patch.fieldRef !== undefined
          ? (patch.fieldRef ?? null)
          : current.fieldRef,
      taskRef:
        patch.taskRef !== undefined ? (patch.taskRef ?? null) : current.taskRef,
      payload,
      evidence: patch.evidence ?? current.evidence,
      confidence: patch.confidence ?? current.confidence,
    };

    const missingMust = this.validator.validateMust(candidate);
    const updated = await this.repository.updateDraft(
      actor.companyId,
      actor.userId,
      dto.draftId,
      {
        timestamp: candidate.timestamp,
        farmRef: candidate.farmRef,
        fieldRef: candidate.fieldRef,
        taskRef: candidate.taskRef,
        payload: candidate.payload,
        evidence: candidate.evidence,
        confidence: candidate.confidence,
        missingMust,
        status: missingMust.length === 0 ? "READY_FOR_CONFIRM" : "DRAFT",
      },
    );

    return { draft: updated, ui: this.buildUi(updated) };
  }

  async link(
    actor: AgroEventsActorContext,
    dto: LinkAgroEventDto,
  ) {
    const current = await this.repository.getDraft(
      actor.companyId,
      actor.userId,
      dto.draftId,
    );

    const candidate: AgroEventDraftRecord = {
      ...current,
      farmRef: dto.farmRef ?? current.farmRef,
      fieldRef: dto.fieldRef ?? current.fieldRef,
      taskRef: dto.taskRef ?? current.taskRef,
    };

    const missingMust = this.validator.validateMust(candidate);
    const updated = await this.repository.updateDraft(
      actor.companyId,
      actor.userId,
      dto.draftId,
      {
        farmRef: candidate.farmRef,
        fieldRef: candidate.fieldRef,
        taskRef: candidate.taskRef,
        missingMust,
        status: missingMust.length === 0 ? "READY_FOR_CONFIRM" : "DRAFT",
      },
    );

    return { draft: updated, ui: this.buildUi(updated) };
  }

  async confirm(actor: AgroEventsActorContext, draftId: string) {
    const draft = await this.repository.getDraft(
      actor.companyId,
      actor.userId,
      draftId,
    );

    if (draft.status === "COMMITTED") {
      const committed = await this.repository.findCommitted(
        actor.companyId,
        draftId,
      );
      return {
        draft,
        committed,
        ui: {
          message: "Событие уже закоммичено",
          buttons: ["CONFIRM", "FIX", "LINK"],
        },
      };
    }

    const missingMust = this.validator.validateMust(draft);
    if (missingMust.length > 0) {
      const updated = await this.repository.updateDraft(
        actor.companyId,
        actor.userId,
        draftId,
        {
          missingMust,
          status: "DRAFT",
        },
      );

      return { draft: updated, ui: this.buildUi(updated) };
    }

    return this.commit(actor, { draftId });
  }

  async commit(actor: AgroEventsActorContext, dto: CommitAgroEventDto) {
    const draft = await this.repository.getDraft(
      actor.companyId,
      actor.userId,
      dto.draftId,
    );

    const missingMust = this.validator.validateMust(draft);
    if (missingMust.length > 0) {
      await this.repository.updateDraft(
        actor.companyId,
        actor.userId,
        dto.draftId,
        {
          missingMust,
          status: "DRAFT",
        },
      );
      throw new BadRequestException(
        "Commit запрещён: MUST-поля заполнены не полностью",
      );
    }

    const provenanceHash = this.buildProvenanceHash(draft);
    const result = await this.repository.commitDraft({
      companyId: actor.companyId,
      userId: actor.userId,
      draftId: dto.draftId,
      provenanceHash,
    });

    this.logger.log(
      `Agro draft committed: ${dto.draftId} (${provenanceHash.slice(0, 8)})`,
    );

    return {
      draft: result.draft,
      committed: result.committed,
      ui: {
        message: "Событие успешно закоммичено",
        buttons: ["CONFIRM", "FIX", "LINK"],
      },
    };
  }

  private buildDraft(
    actor: AgroEventsActorContext,
    dto: CreateAgroEventDraftDto,
  ): AgroEventDraftRecord {
    return {
      id: "",
      companyId: actor.companyId,
      userId: actor.userId,
      status: "DRAFT",
      eventType: dto.eventType.trim().toUpperCase(),
      timestamp: dto.timestamp ?? new Date().toISOString(),
      farmRef: dto.farmRef ?? null,
      fieldRef: dto.fieldRef ?? null,
      taskRef: dto.taskRef ?? null,
      payload: dto.payload ?? {},
      evidence: dto.evidence ?? [],
      confidence: dto.confidence ?? 0.5,
      missingMust: [],
      createdAt: "",
      updatedAt: "",
      expiresAt: "",
    };
  }

  private sanitizePatch(patch: Record<string, any>): AgroEventDraftPatch {
    const sanitized: AgroEventDraftPatch = {};

    if (typeof patch.timestamp === "string") {
      sanitized.timestamp = patch.timestamp;
    }
    if (typeof patch.farmRef === "string" || patch.farmRef === null) {
      sanitized.farmRef = patch.farmRef;
    }
    if (typeof patch.fieldRef === "string" || patch.fieldRef === null) {
      sanitized.fieldRef = patch.fieldRef;
    }
    if (typeof patch.taskRef === "string" || patch.taskRef === null) {
      sanitized.taskRef = patch.taskRef;
    }
    if (patch.payload && typeof patch.payload === "object") {
      sanitized.payload = patch.payload;
    }
    if (Array.isArray(patch.evidence)) {
      sanitized.evidence = patch.evidence;
    }
    if (typeof patch.confidence === "number") {
      sanitized.confidence = patch.confidence;
    }
    if (typeof patch.description === "string") {
      sanitized.description = patch.description;
    }

    return sanitized;
  }

  private buildProvenanceHash(draft: AgroEventDraftRecord) {
    const canonicalPayload = this.toCanonicalJson({
      draftId: draft.id,
      eventType: draft.eventType,
      timestamp: draft.timestamp,
      refs: {
        farmRef: draft.farmRef,
        fieldRef: draft.fieldRef,
        taskRef: draft.taskRef,
      },
      payload: draft.payload,
      evidence: draft.evidence,
    });

    return createHash("sha256").update(canonicalPayload).digest("hex");
  }

  private toCanonicalJson(value: unknown): string {
    if (value === null || value === undefined) {
      return "null";
    }

    if (typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.toCanonicalJson(item)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, item]) =>
          `${JSON.stringify(key)}:${this.toCanonicalJson(item)}`,
      );

    return `{${entries.join(",")}}`;
  }

  private buildUi(draft: AgroEventDraftRecord) {
    const mustQuestions = draft.missingMust
      .slice(0, 3)
      .map((item) => `Пожалуйста, укажи ${item}`);

    return {
      message:
        draft.status === "READY_FOR_CONFIRM"
          ? "Все MUST-поля закрыты. Можно подтверждать."
          : "Черновику нужны уточнения.",
      buttons: ["CONFIRM", "FIX", "LINK"],
      mustQuestions: mustQuestions.length > 0 ? mustQuestions : undefined,
    };
  }
}

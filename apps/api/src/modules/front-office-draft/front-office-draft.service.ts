import { Injectable, NotFoundException } from "@nestjs/common";
import {
  DeviationType,
  IntegrityStatus,
  ObservationIntent,
  ObservationType,
} from "@rai/prisma-client";
import { createHash } from "crypto";
import { AuditService } from "../../shared/audit/audit.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import {
  FrontOfficeAgent,
  FrontOfficeAgentInput,
} from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import {
  FrontOfficeDraftAnchor,
  FrontOfficeDraftRecord,
  FrontOfficeDraftStatus,
  FrontOfficeIntent,
} from "./front-office-draft.types";

interface ResolvedContext {
  fieldId?: string;
  seasonId?: string;
  taskId?: string;
}

interface FrontOfficeIntakeInput {
  channel: "telegram" | "web_chat" | "internal";
  messageText: string;
  direction?: "inbound" | "outbound";
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
  recipientExternalId?: string;
  route?: string;
  targetOwnerRole?: string;
  taskId?: string;
  fieldId?: string;
  seasonId?: string;
  sourceMessageId?: string;
  chatId?: string;
  photoUrl?: string;
  voiceUrl?: string;
  coordinates?: any;
  telemetryJson?: any;
}

@Injectable()
export class FrontOfficeDraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly fieldObservationService: FieldObservationService,
    private readonly deviationService: DeviationService,
    private readonly frontOfficeAgent: FrontOfficeAgent,
    private readonly repository: FrontOfficeDraftRepository,
  ) {}

  async intakeMessage(
    companyId: string,
    traceId: string,
    user: { id?: string; role?: string },
    input: FrontOfficeIntakeInput,
  ) {
    const actorUserId = user.id ?? "SYSTEM";
    const agentResult = await this.classify(companyId, traceId, user, input);
    const classification = this.extractClassification(agentResult.data);
    const resolved = await this.resolveContext(companyId, {
      taskId: input.taskId,
      fieldId: input.fieldId,
      seasonId: input.seasonId,
    });
    const anchor = this.toAnchor(resolved);
    const suggestedIntent = this.mapClassificationToIntent(
      classification?.classification,
    );
    const mustClarifications = this.computeMustClarifications(
      suggestedIntent,
      anchor,
      classification?.confidence ?? 0,
    );
    const status = this.resolveStatus(mustClarifications);
    const threadKey =
      classification?.threadKey ??
      (agentResult.data as any)?.log?.threadKey ??
      this.buildFallbackThreadKey(companyId, input);

    const payload = {
      traceId,
      threadKey,
      classification: classification?.classification ?? null,
      confidence: classification?.confidence ?? null,
      suggestedIntent,
      channel: input.channel,
      direction: input.direction ?? "inbound",
      messageText: input.messageText,
      sourceMessageId: input.sourceMessageId ?? null,
      chatId: input.chatId ?? null,
      threadExternalId: input.threadExternalId ?? null,
      dialogExternalId: input.dialogExternalId ?? null,
      senderExternalId: input.senderExternalId ?? null,
      recipientExternalId: input.recipientExternalId ?? null,
      route: input.route ?? null,
      targetOwnerRole: classification?.targetOwnerRole ?? null,
      seasonId: anchor.seasonId,
      photoUrl: input.photoUrl ?? null,
      voiceUrl: input.voiceUrl ?? null,
      coordinates: input.coordinates ?? null,
      telemetryJson: input.telemetryJson ?? null,
    };
    const evidence = this.buildEvidence(input);

    const draft = await this.repository.createDraft({
      companyId,
      userId: actorUserId,
      status,
      eventType: this.mapIntentToEventType(suggestedIntent),
      timestamp: new Date().toISOString(),
      farmRef: anchor.farmRef,
      fieldId: anchor.fieldId,
      taskId: anchor.taskId,
      payload,
      evidence,
      confidence: classification?.confidence ?? 0,
      mustClarifications,
    });

    await this.audit.log({
      action: "FRONT_OFFICE_INGRESS_DRAFTED",
      companyId,
      userId: user.id,
      metadata: {
        traceId,
        draftId: draft.id,
        threadKey,
        channel: input.channel,
        direction: input.direction ?? "inbound",
        messageText: input.messageText,
        sourceMessageId: input.sourceMessageId ?? null,
        chatId: input.chatId ?? null,
        classification: classification?.classification ?? null,
        confidence: classification?.confidence ?? null,
        suggestedIntent,
        fieldId: anchor.fieldId,
        seasonId: anchor.seasonId,
        taskId: anchor.taskId,
      },
    });

    return this.presentDraft(draft, await this.repository.findCommitted(companyId, draft.id));
  }

  async getDraft(companyId: string, draftId: string) {
    const draft = await this.repository.getDraft(companyId, draftId);
    const committed = await this.repository.findCommitted(companyId, draft.id);
    return this.presentDraft(draft, committed);
  }

  async fixDraft(
    companyId: string,
    traceId: string,
    user: { id?: string; role?: string },
    draftId: string,
    patch: Partial<FrontOfficeIntakeInput>,
  ) {
    const current = await this.repository.getDraft(companyId, draftId);
    const merged = {
      channel: (patch.channel ?? current.payload.channel ?? "telegram") as
        | "telegram"
        | "web_chat"
        | "internal",
      messageText: patch.messageText ?? current.payload.messageText ?? "",
      direction: patch.direction ?? current.payload.direction ?? "inbound",
      threadExternalId:
        patch.threadExternalId ?? current.payload.threadExternalId ?? undefined,
      dialogExternalId:
        patch.dialogExternalId ?? current.payload.dialogExternalId ?? undefined,
      senderExternalId:
        patch.senderExternalId ?? current.payload.senderExternalId ?? undefined,
      recipientExternalId:
        patch.recipientExternalId ?? current.payload.recipientExternalId ?? undefined,
      route: patch.route ?? current.payload.route ?? undefined,
      targetOwnerRole:
        patch.targetOwnerRole ?? current.payload.targetOwnerRole ?? undefined,
      taskId: patch.taskId ?? current.anchor.taskId ?? undefined,
      fieldId: patch.fieldId ?? current.anchor.fieldId ?? undefined,
      seasonId: patch.seasonId ?? current.anchor.seasonId ?? undefined,
      sourceMessageId:
        patch.sourceMessageId ?? current.payload.sourceMessageId ?? undefined,
      chatId: patch.chatId ?? current.payload.chatId ?? undefined,
      photoUrl: patch.photoUrl ?? current.payload.photoUrl ?? undefined,
      voiceUrl: patch.voiceUrl ?? current.payload.voiceUrl ?? undefined,
      coordinates: patch.coordinates ?? current.payload.coordinates ?? undefined,
      telemetryJson:
        patch.telemetryJson ?? current.payload.telemetryJson ?? undefined,
    };

    const agentResult = await this.classify(companyId, traceId, user, merged);
    const classification = this.extractClassification(agentResult.data);
    const resolved = await this.resolveContext(companyId, {
      taskId: merged.taskId,
      fieldId: merged.fieldId,
      seasonId: merged.seasonId,
    });
    const anchor = this.toAnchor(resolved);
    const suggestedIntent = this.mapClassificationToIntent(
      classification?.classification,
    );
    const mustClarifications = this.computeMustClarifications(
      suggestedIntent,
      anchor,
      classification?.confidence ?? current.confidence,
    );
    const status = this.resolveStatus(mustClarifications);
    const updated = await this.repository.updateDraft(companyId, draftId, {
      status,
      farmRef: anchor.farmRef,
      fieldId: anchor.fieldId,
      taskId: anchor.taskId,
      payload: {
        ...current.payload,
        ...merged,
        traceId,
        threadKey:
          classification?.threadKey ??
          current.payload.threadKey ??
          this.buildFallbackThreadKey(companyId, merged),
        classification: classification?.classification ?? current.payload.classification,
        confidence: classification?.confidence ?? current.confidence,
        suggestedIntent,
        seasonId: anchor.seasonId,
        targetOwnerRole:
          classification?.targetOwnerRole ?? current.payload.targetOwnerRole ?? null,
      },
      evidence: this.buildEvidence(merged),
      confidence: classification?.confidence ?? current.confidence,
      mustClarifications,
    });

    await this.audit.log({
      action: "FRONT_OFFICE_DRAFT_FIXED",
      companyId,
      userId: user.id,
      metadata: {
        traceId,
        draftId,
        threadKey: updated.payload.threadKey ?? null,
        patch,
      },
    });

    return this.presentDraft(updated, await this.repository.findCommitted(companyId, updated.id));
  }

  async linkDraft(
    companyId: string,
    userId: string | undefined,
    draftId: string,
    link: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
  ) {
    const current = await this.repository.getDraft(companyId, draftId);
    const resolved = await this.resolveContext(companyId, {
      taskId: link.taskId ?? current.anchor.taskId ?? undefined,
      fieldId: link.fieldId ?? current.anchor.fieldId ?? undefined,
      seasonId: link.seasonId ?? current.anchor.seasonId ?? undefined,
    });
    const anchor = this.toAnchor(resolved, link.farmRef ?? current.anchor.farmRef);
    const suggestedIntent = (current.payload.suggestedIntent ??
      this.mapEventTypeToIntent(current.eventType)) as FrontOfficeIntent;
    const mustClarifications = this.computeMustClarifications(
      suggestedIntent,
      anchor,
      current.confidence,
    );
    const status = this.resolveStatus(mustClarifications);

    const updated = await this.repository.updateDraft(companyId, draftId, {
      status,
      farmRef: anchor.farmRef,
      fieldId: anchor.fieldId,
      taskId: anchor.taskId,
      payload: {
        ...current.payload,
        seasonId: anchor.seasonId,
      },
      mustClarifications,
    });

    await this.audit.log({
      action: "FRONT_OFFICE_DRAFT_LINKED",
      companyId,
      userId,
      metadata: {
        draftId,
        threadKey: updated.payload.threadKey ?? null,
        anchor,
      },
    });

    return this.presentDraft(updated, await this.repository.findCommitted(companyId, updated.id));
  }

  async confirmDraft(
    companyId: string,
    user: { id?: string; role?: string },
    draftId: string,
  ) {
    const current = await this.repository.getDraft(companyId, draftId);
    const alreadyCommitted = await this.repository.findCommitted(companyId, draftId);
    if (current.status === "COMMITTED" && alreadyCommitted) {
      return this.presentDraft(current, alreadyCommitted);
    }

    const intent = (current.payload.suggestedIntent ??
      this.mapEventTypeToIntent(current.eventType)) as FrontOfficeIntent;
    const mustClarifications = this.computeMustClarifications(
      intent,
      current.anchor,
      current.confidence,
    );
    if (mustClarifications.length > 0) {
      const updated = await this.repository.updateDraft(companyId, draftId, {
        status: this.resolveStatus(mustClarifications),
        mustClarifications,
      });
      return this.presentDraft(updated, null);
    }

    const commitResult = await this.commitToDomain(companyId, user.id, current, intent);
    const updated = await this.repository.updateDraft(companyId, draftId, {
      payload: {
        ...current.payload,
        commitResult,
      },
    });
    const committed = await this.repository.commitDraft({
      companyId,
      draftId,
      committedBy: user.id ?? current.userId,
      provenanceHash: this.buildProvenanceHash(updated),
    });

    await this.audit.log({
      action: "FRONT_OFFICE_DRAFT_CONFIRMED",
      companyId,
      userId: user.id,
      metadata: {
        draftId,
        threadKey: committed.draft.payload.threadKey ?? null,
        intent,
        commitResult,
      },
    });

    return this.presentDraft(committed.draft, committed.committed);
  }

  async getQueues(companyId: string) {
    const [drafts, recentCommits] = await Promise.all([
      this.repository.listDrafts(companyId, { take: 100 }),
      this.repository.listCommitted(companyId, 12),
    ]);
    const activeDrafts = drafts.filter((item) => item.status !== "COMMITTED");

    return {
      counts: {
        newIngress: activeDrafts.length,
        needsLink: activeDrafts.filter((item) => item.status === "NEEDS_LINK").length,
        needsClarification: activeDrafts.filter(
          (item) => item.status === "NEEDS_MUST_CLARIFICATION",
        ).length,
        readyToConfirm: activeDrafts.filter(
          (item) => item.status === "READY_TO_CONFIRM",
        ).length,
      },
      newIngress: activeDrafts,
      needsLink: activeDrafts.filter((item) => item.status === "NEEDS_LINK"),
      needsClarification: activeDrafts.filter(
        (item) => item.status === "NEEDS_MUST_CLARIFICATION",
      ),
      readyToConfirm: activeDrafts.filter(
        (item) => item.status === "READY_TO_CONFIRM",
      ),
      recentCommits,
    };
  }

  async getThread(companyId: string, threadKey: string) {
    const [messageLogs, drafts] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          action: {
            in: [
              "FRONT_OFFICE_DIALOG_MESSAGE_LOGGED",
              "FRONT_OFFICE_INGRESS_DRAFTED",
              "FRONT_OFFICE_DRAFT_FIXED",
              "FRONT_OFFICE_DRAFT_LINKED",
              "FRONT_OFFICE_DRAFT_CONFIRMED",
            ],
          },
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      this.repository.listDrafts(companyId, { take: 100 }),
    ]);

    return {
      threadKey,
      messages: messageLogs.filter(
        (entry) => (entry.metadata as any)?.threadKey === threadKey,
      ),
      drafts: drafts.filter((draft) => draft.payload.threadKey === threadKey),
    };
  }

  private async classify(
    companyId: string,
    traceId: string,
    user: { id?: string; role?: string },
    input: FrontOfficeIntakeInput,
  ) {
    return this.frontOfficeAgent.run({
      companyId,
      traceId,
      userId: user.id,
      userRole: user.role,
      userConfirmed: true,
      intent: "classify_dialog_thread",
      channel: input.channel,
      messageText: input.messageText,
      direction: input.direction,
      threadExternalId: input.threadExternalId,
      dialogExternalId: input.dialogExternalId,
      senderExternalId: input.senderExternalId,
      recipientExternalId: input.recipientExternalId,
      route: input.route,
      targetOwnerRole: input.targetOwnerRole,
    });
  }

  private presentDraft(draft: FrontOfficeDraftRecord, committed: any) {
    return {
      status: draft.status === "COMMITTED" ? "COMMITTED" : "DRAFT_RECORDED",
      confirmationRequired: draft.status !== "COMMITTED",
      draftId: draft.id,
      threadKey: draft.payload.threadKey ?? null,
      classification: {
        classification: draft.payload.classification ?? null,
        confidence: draft.payload.confidence ?? draft.confidence,
        targetOwnerRole: draft.payload.targetOwnerRole ?? null,
        threadKey: draft.payload.threadKey ?? null,
      },
      suggestedIntent:
        (draft.payload.suggestedIntent as FrontOfficeIntent | undefined) ??
        this.mapEventTypeToIntent(draft.eventType),
      anchor: draft.anchor,
      mustClarifications: draft.mustClarifications,
      allowedActions:
        draft.status === "COMMITTED" ? [] : ["CONFIRM", "FIX", "LINK"],
      draft,
      committed,
      commitResult:
        draft.payload.commitResult ?? committed?.payload?.commitResult ?? null,
    };
  }

  private extractClassification(data: unknown) {
    return (data as any)?.classification?.classification
      ? (data as any).classification
      : (data as any)?.classification ?? (data as any);
  }

  private buildEvidence(input: Partial<FrontOfficeIntakeInput>) {
    return [
      input.photoUrl ? { type: "photo", url: input.photoUrl } : null,
      input.voiceUrl ? { type: "voice", url: input.voiceUrl } : null,
      input.coordinates ? { type: "geo", value: input.coordinates } : null,
      input.telemetryJson ? { type: "telemetry", value: input.telemetryJson } : null,
    ].filter(Boolean);
  }

  private toAnchor(
    resolved: ResolvedContext,
    farmRef: string | null = null,
  ): FrontOfficeDraftAnchor {
    return {
      farmRef,
      fieldId: resolved.fieldId ?? null,
      seasonId: resolved.seasonId ?? null,
      taskId: resolved.taskId ?? null,
    };
  }

  private resolveStatus(mustClarifications: string[]): FrontOfficeDraftStatus {
    if (mustClarifications.some((item) => item.includes("LINK"))) {
      return "NEEDS_LINK";
    }
    if (mustClarifications.length > 0) {
      return "NEEDS_MUST_CLARIFICATION";
    }
    return "READY_TO_CONFIRM";
  }

  private computeMustClarifications(
    intent: FrontOfficeIntent,
    anchor: FrontOfficeDraftAnchor,
    confidence: number,
  ) {
    const musts = new Set<string>();

    if (confidence < 0.72) {
      musts.add("CONFIRM_INTENT");
    }

    if (intent === "observation" || intent === "deviation") {
      if (!anchor.fieldId && !anchor.taskId) {
        musts.add("LINK_FIELD_OR_TASK");
      }
      if (!anchor.seasonId) {
        musts.add("LINK_SEASON");
      }
    }

    if (intent === "consultation") {
      if (!anchor.fieldId && !anchor.taskId && !anchor.seasonId) {
        musts.add("LINK_OBJECT");
      }
    }

    return Array.from(musts);
  }

  private mapIntentToEventType(intent: FrontOfficeIntent) {
    return `FRONT_OFFICE_${intent.toUpperCase()}`;
  }

  private mapEventTypeToIntent(eventType: string): FrontOfficeIntent {
    switch (eventType) {
      case "FRONT_OFFICE_DEVIATION":
        return "deviation";
      case "FRONT_OFFICE_CONSULTATION":
        return "consultation";
      case "FRONT_OFFICE_CONTEXT_UPDATE":
        return "context_update";
      case "FRONT_OFFICE_OBSERVATION":
      default:
        return "observation";
    }
  }

  private mapClassificationToIntent(
    classification?:
      | "free_chat"
      | "task_process"
      | "client_request"
      | "escalation_signal",
  ): FrontOfficeIntent {
    switch (classification) {
      case "escalation_signal":
        return "deviation";
      case "client_request":
        return "consultation";
      case "task_process":
        return "observation";
      case "free_chat":
      default:
        return "context_update";
    }
  }

  private async resolveContext(
    companyId: string,
    context: ResolvedContext,
  ): Promise<ResolvedContext> {
    if (!context.taskId) {
      return context;
    }

    const task = await this.prisma.task.findFirst({
      where: { id: context.taskId, companyId },
      select: { id: true, fieldId: true, seasonId: true },
    });

    if (!task) {
      throw new NotFoundException(`Task ${context.taskId} not found`);
    }

    return {
      taskId: task.id,
      fieldId: context.fieldId ?? task.fieldId,
      seasonId: context.seasonId ?? task.seasonId,
    };
  }

  private buildFallbackThreadKey(
    companyId: string,
    input: Pick<
      FrontOfficeIntakeInput,
      "channel" | "threadExternalId" | "dialogExternalId" | "senderExternalId"
    >,
  ) {
    return [
      companyId,
      input.channel,
      input.threadExternalId ??
        input.dialogExternalId ??
        input.senderExternalId ??
        "unknown",
    ].join(":");
  }

  private buildProvenanceHash(draft: FrontOfficeDraftRecord) {
    return createHash("sha256")
      .update(
        JSON.stringify({
          id: draft.id,
          eventType: draft.eventType,
          timestamp: draft.timestamp,
          anchor: draft.anchor,
          payload: draft.payload,
          evidence: draft.evidence,
        }),
      )
      .digest("hex");
  }

  private async commitToDomain(
    companyId: string,
    userId: string | undefined,
    draft: FrontOfficeDraftRecord,
    intent: FrontOfficeIntent,
  ) {
    const input = {
      messageText: String(draft.payload.messageText ?? ""),
      taskId: draft.anchor.taskId ?? undefined,
      fieldId: draft.anchor.fieldId ?? undefined,
      seasonId: draft.anchor.seasonId ?? undefined,
      traceId: draft.payload.traceId,
      channel: draft.payload.channel,
      sourceMessageId: draft.payload.sourceMessageId,
      chatId: draft.payload.chatId,
      photoUrl: draft.payload.photoUrl,
      voiceUrl: draft.payload.voiceUrl,
      coordinates: draft.payload.coordinates,
      telemetryJson: draft.payload.telemetryJson,
    };

    switch (intent) {
      case "deviation": {
        const review = await this.createDeviation(companyId, userId, input);
        return {
          kind: "deviation",
          id: review.id,
          createdAt: review.createdAt,
          anchor: draft.anchor,
        };
      }
      case "consultation": {
        const consultation = await this.createConsultation(companyId, userId, input);
        return consultation;
      }
      case "context_update": {
        const contextUpdate = await this.createContextUpdate(companyId, userId, input);
        return contextUpdate;
      }
      case "observation":
      default: {
        const observation = await this.createObservation(companyId, userId, input);
        return {
          kind: "observation",
          id: observation.id,
          createdAt: observation.createdAt,
          anchor: draft.anchor,
        };
      }
    }
  }

  private async createConsultation(
    companyId: string,
    userId: string | undefined,
    input: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
    },
  ) {
    const auditLog = await this.audit.log({
      action: "FRONT_OFFICE_CONSULTATION_REQUESTED",
      companyId,
      userId,
      metadata: {
        traceId: input.traceId,
        taskId: input.taskId ?? null,
        fieldId: input.fieldId ?? null,
        seasonId: input.seasonId ?? null,
        channel: input.channel ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        chatId: input.chatId ?? null,
        messageText: input.messageText,
        photoUrl: input.photoUrl ?? null,
        voiceUrl: input.voiceUrl ?? null,
        coordinates: input.coordinates ?? null,
      },
    });

    return {
      id: auditLog.id,
      kind: "consultation",
      createdAt: auditLog.createdAt,
      anchor: {
        taskId: input.taskId ?? null,
        fieldId: input.fieldId ?? null,
        seasonId: input.seasonId ?? null,
      },
      messageText: input.messageText,
    };
  }

  private async createContextUpdate(
    companyId: string,
    userId: string | undefined,
    input: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
    },
  ) {
    const auditLog = await this.audit.log({
      action: "FRONT_OFFICE_CONTEXT_UPDATED",
      companyId,
      userId,
      metadata: {
        traceId: input.traceId,
        taskId: input.taskId ?? null,
        fieldId: input.fieldId ?? null,
        seasonId: input.seasonId ?? null,
        channel: input.channel ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        chatId: input.chatId ?? null,
        messageText: input.messageText,
        photoUrl: input.photoUrl ?? null,
        voiceUrl: input.voiceUrl ?? null,
        coordinates: input.coordinates ?? null,
        telemetryJson: input.telemetryJson ?? null,
      },
    });

    return {
      id: auditLog.id,
      kind: "context_update",
      createdAt: auditLog.createdAt,
      anchor: {
        taskId: input.taskId ?? null,
        fieldId: input.fieldId ?? null,
        seasonId: input.seasonId ?? null,
      },
      messageText: input.messageText,
    };
  }

  private async createDeviation(
    companyId: string,
    userId: string | undefined,
    input: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
    },
  ) {
    if (!input.seasonId) {
      throw new NotFoundException("Season context is required for deviation");
    }

    const review = await this.deviationService.createReview({
      companyId,
      userId,
      seasonId: input.seasonId,
      type: DeviationType.AGRONOMIC,
      deviationSummary: input.messageText,
      aiImpactAssessment: `Front-office draft confirm via ${input.channel ?? "unknown"}`,
    });

    if (input.fieldId && input.seasonId) {
      const observation = await this.fieldObservationService.createObservation({
        companyId,
        authorId: userId || "SYSTEM",
        fieldId: input.fieldId,
        seasonId: input.seasonId,
        taskId: input.taskId,
        type: this.detectObservationType(input),
        intent: ObservationIntent.INCIDENT,
        integrityStatus: this.detectIntegrityStatus(input),
        content: input.messageText,
        photoUrl: input.photoUrl,
        voiceUrl: input.voiceUrl,
        coordinates: input.coordinates,
        telemetryJson: {
          ...(input.telemetryJson ?? {}),
          frontOfficeTraceId: input.traceId,
          sourceMessageId: input.sourceMessageId,
          chatId: input.chatId,
          channel: input.channel,
        },
      });

      await this.prisma.fieldObservation.update({
        where: { id: observation.id },
        data: { deviationReviewId: review.id },
      });
    }

    return review;
  }

  private async createObservation(
    companyId: string,
    userId: string | undefined,
    input: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
    },
  ) {
    if (!input.fieldId || !input.seasonId) {
      throw new NotFoundException(
        "Field and season context are required for observation",
      );
    }

    return this.fieldObservationService.createObservation({
      companyId,
      authorId: userId || "SYSTEM",
      fieldId: input.fieldId,
      seasonId: input.seasonId,
      taskId: input.taskId,
      type: this.detectObservationType(input),
      intent: this.detectObservationIntent(input.messageText),
      integrityStatus: this.detectIntegrityStatus(input),
      content: input.messageText,
      photoUrl: input.photoUrl,
      voiceUrl: input.voiceUrl,
      coordinates: input.coordinates,
      telemetryJson: {
        ...(input.telemetryJson ?? {}),
        frontOfficeTraceId: input.traceId,
        sourceMessageId: input.sourceMessageId,
        chatId: input.chatId,
        channel: input.channel,
      },
    });
  }

  private detectObservationType(input: {
    photoUrl?: string;
    voiceUrl?: string;
    coordinates?: any;
    messageText: string;
  }): ObservationType {
    if (input.photoUrl) return ObservationType.PHOTO;
    if (input.voiceUrl) return ObservationType.VOICE_NOTE;
    if (input.coordinates) return ObservationType.GEO_WALK;
    if (/sos|авар|критич|срочно/i.test(input.messageText)) {
      return ObservationType.SOS_SIGNAL;
    }
    return ObservationType.CALL_LOG;
  }

  private detectObservationIntent(messageText: string): ObservationIntent {
    if (/задерж|опозд|перенос/i.test(messageText)) {
      return ObservationIntent.DELAY;
    }
    if (/подтверж|выполн|сделан|готово/i.test(messageText)) {
      return ObservationIntent.CONFIRMATION;
    }
    if (/консультац|вопрос|подскаж/i.test(messageText)) {
      return ObservationIntent.CONSULTATION;
    }
    return ObservationIntent.MONITORING;
  }

  private detectIntegrityStatus(input: {
    photoUrl?: string;
    voiceUrl?: string;
    coordinates?: any;
    telemetryJson?: any;
  }): IntegrityStatus {
    const score = [
      input.photoUrl,
      input.voiceUrl,
      input.coordinates,
      input.telemetryJson,
    ].filter(Boolean).length;

    if (score >= 3) return IntegrityStatus.STRONG_EVIDENCE;
    if (score >= 1) return IntegrityStatus.WEAK_EVIDENCE;
    return IntegrityStatus.NO_EVIDENCE;
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
} from "../rai-chat/agents/front-office-agent.service";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { FrontOfficeClientResponseOrchestrator } from "./front-office-client-response.orchestrator.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "./front-office-handoff.orchestrator.service";
import { FrontOfficeOutboundService } from "./front-office-outbound.service";
import {
  FrontOfficeReplyDecision,
  FrontOfficeReplyPolicyService,
} from "./front-office-reply-policy.service";
import {
  BackOfficeFarmAssignmentRecord,
  FrontOfficeDraftAnchor,
  FrontOfficeDraftRecord,
  FrontOfficeReplyStatus,
  FrontOfficeDraftStatus,
  FrontOfficeIntent,
  FrontOfficeManagerFarmInboxRecord,
  FrontOfficeResolutionMode,
  FrontOfficeThreadListItemRecord,
  FrontOfficeThreadRecord,
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
    private readonly communicationRepository: FrontOfficeCommunicationRepository,
    private readonly replyPolicy: FrontOfficeReplyPolicyService,
    private readonly outboundService: FrontOfficeOutboundService,
    private readonly clientResponseOrchestrator: FrontOfficeClientResponseOrchestrator,
    private readonly handoffOrchestrator: FrontOfficeHandoffOrchestrator,
    private readonly repository: FrontOfficeDraftRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
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

    const auditLog = await this.audit.log({
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

    const synced = await this.syncInboundThreadState({
      companyId,
      draft,
      input,
      traceId,
      actorUserId: user.id,
      auditLogId: auditLog.id,
      classification: classification?.classification,
      targetOwnerRole: classification?.targetOwnerRole ?? null,
      evidence,
    });
    const decision = this.replyPolicy.evaluate({
      companyId,
      messageText: input.messageText,
      direction: input.direction,
      classification: classification?.classification ?? null,
      targetOwnerRole: classification?.targetOwnerRole ?? null,
      confidence: classification?.confidence ?? 0,
      anchor,
      thread: synced.thread,
      evidenceCount: evidence.length,
    });

    let resolvedDraft = draft;
    let committed = await this.repository.findCommitted(companyId, draft.id);
    if ((input.direction ?? "inbound") === "inbound") {
      const routed = await this.handleInboundRouting({
        companyId,
        traceId,
        user,
        draft,
        thread: synced.thread,
        decision,
      });
      resolvedDraft = routed.draft;
      committed = routed.committed;
    }

    return this.presentDraft(resolvedDraft, committed);
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

    const auditLog = await this.audit.log({
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

    await this.syncInboundThreadState({
      companyId,
      draft: updated,
      input: merged,
      traceId,
      actorUserId: user.id,
      auditLogId: auditLog.id,
      classification: updated.payload.classification ?? null,
      targetOwnerRole: updated.payload.targetOwnerRole ?? null,
      evidence: this.buildEvidence(merged),
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

    await this.syncSystemThreadState(companyId, updated, {
      messageText: `LINK applied: field=${anchor.fieldId ?? "-"} season=${anchor.seasonId ?? "-"} task=${anchor.taskId ?? "-"}`,
      metadata: { anchor, event: "draft_linked" },
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

    const auditLog = await this.audit.log({
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

    const handoffCommitResult =
      commitResult && (commitResult as any).kind === "handoff"
        ? (commitResult as any)
        : null;
    await this.syncSystemThreadState(companyId, committed.draft, {
      messageText: handoffCommitResult
        ? `HANDOFF ${handoffCommitResult.targetOwnerRole ?? "manual"}: ${handoffCommitResult.handoffStatus ?? "ROUTED"}`
        : `COMMIT ${(commitResult as any)?.kind ?? intent}: ${(commitResult as any)?.id ?? committed.draft.id}`,
      auditLogId: auditLog.id,
      metadata: { intent, commitResult },
      handoffStatus: handoffCommitResult?.handoffStatus ?? null,
      targetOwnerRole:
        handoffCommitResult?.targetOwnerRole ??
        committed.draft.payload.targetOwnerRole ??
        null,
      ownerResultRef: handoffCommitResult?.ownerResultRef ?? null,
    });

    return this.presentDraft(committed.draft, committed.committed);
  }

  async getQueues(companyId: string) {
    const [drafts, recentCommits, handoffs, threads] = await Promise.all([
      this.repository.listDrafts(companyId, { take: 100 }),
      this.repository.listCommitted(companyId, 12),
      this.handoffOrchestrator.listHandoffs(companyId),
      this.communicationRepository.listThreads(companyId, { take: 20 }),
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
        openHandoffs: handoffs.filter((item) =>
          ["ROUTED", "PENDING_APPROVAL", "MANUAL_REQUIRED", "CLAIMED"].includes(
            item.status,
          ),
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
      threads,
      handoffs,
      recentCommits,
    };
  }

  async getThread(companyId: string, threadKey: string) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    const [messages, drafts, handoffs] = await Promise.all([
      this.communicationRepository.listMessages(companyId, thread.id),
      this.repository.listDrafts(companyId, { take: 100 }),
      this.handoffOrchestrator.listHandoffs(companyId),
    ]);

    return {
      thread,
      threadKey,
      messages,
      drafts: drafts.filter((draft) => draft.payload.threadKey === threadKey),
      handoffs: handoffs.filter((handoff) => handoff.threadId === thread.id),
    };
  }

  async listThreads(companyId: string) {
    return this.communicationRepository.listThreads(companyId);
  }

  async listHandoffs(companyId: string) {
    return this.handoffOrchestrator.listHandoffs(companyId);
  }

  async getHandoff(companyId: string, handoffId: string) {
    return this.handoffOrchestrator.getHandoff(companyId, handoffId);
  }

  async claimHandoff(companyId: string, handoffId: string, userId?: string) {
    return this.handoffOrchestrator.claimHandoff(companyId, handoffId, userId);
  }

  async rejectHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    reason: string,
  ) {
    return this.handoffOrchestrator.rejectHandoff(companyId, handoffId, userId, reason);
  }

  async resolveHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    ownerResultRef?: string,
    note?: string,
  ) {
    return this.handoffOrchestrator.resolveHandoff(
      companyId,
      handoffId,
      userId,
      ownerResultRef,
      note,
    );
  }

  async addManualNote(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    note: string,
  ) {
    return this.handoffOrchestrator.addManualNote(companyId, handoffId, userId, note);
  }

  async listMessages(companyId: string, threadKey: string) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    return this.communicationRepository.listMessages(companyId, thread.id);
  }

  async listMessagesForViewer(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    await this.assertThreadAccess(companyId, viewer, thread);
    return this.communicationRepository.listMessages(companyId, thread.id);
  }

  async listManagerFarms(
    companyId: string,
    userId: string,
  ): Promise<FrontOfficeManagerFarmInboxRecord[]> {
    const assignments = await this.communicationRepository.listAssignments(companyId, {
      userId,
      status: "ACTIVE",
    });
    if (assignments.length === 0) {
      return [];
    }

    const farmIds = assignments.map((item) => item.farmAccountId);
    const threads = await this.communicationRepository.listThreads(companyId, {
      farmAccountIds: farmIds,
      boundOnly: true,
      take: 500,
    });
    const threadItems = await this.buildThreadList(companyId, userId, threads);
    const byFarmId = new Map<string, FrontOfficeManagerFarmInboxRecord>();

    for (const assignment of assignments) {
      byFarmId.set(assignment.farmAccountId, {
        farmAccountId: assignment.farmAccountId,
        farmName: assignment.farmName ?? assignment.farmAccountId,
        unreadCount: 0,
        threadCount: 0,
        lastMessagePreview: null,
        lastMessageAt: null,
        lastHandoffStatus: null,
        needsHumanAction: false,
      });
    }

    for (const item of threadItems) {
      if (!item.farmAccountId) {
        continue;
      }
      const current = byFarmId.get(item.farmAccountId);
      if (!current) {
        continue;
      }

      current.unreadCount += item.unreadCount;
      current.threadCount += 1;
      current.needsHumanAction = current.needsHumanAction || item.needsHumanAction;
      if (
        !current.lastMessageAt ||
        (item.lastMessageAt && item.lastMessageAt > current.lastMessageAt)
      ) {
        current.lastMessageAt = item.lastMessageAt;
        current.lastMessagePreview = item.lastMessagePreview;
        current.lastHandoffStatus = item.currentHandoffStatus;
      }
    }

    return Array.from(byFarmId.values()).sort((left, right) => {
      const rightTs = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
      const leftTs = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      return rightTs - leftTs;
    });
  }

  async listManagerFarmThreads(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ): Promise<FrontOfficeThreadListItemRecord[]> {
    await this.assertAssignment(companyId, userId, farmAccountId);
    const threads = await this.communicationRepository.listThreads(companyId, {
      farmAccountId,
      boundOnly: true,
      take: 200,
    });

    return this.buildThreadList(companyId, userId, threads);
  }

  async replyToThread(
    companyId: string,
    user: { id: string; role?: string },
    threadKey: string,
    messageText: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    if (!thread.farmAccountId) {
      throw new ForbiddenException("Thread is not bound to a farm account");
    }
    await this.assertAssignment(companyId, user.id, thread.farmAccountId);

    const chatId = this.normalizeTelegramChatId(
      thread.threadExternalId ?? thread.representativeTelegramId,
      thread.representativeTelegramId,
    );
    if (!chatId) {
      throw new NotFoundException("Telegram chat is not available for this thread");
    }
    const outbound = await this.outboundService.sendToThread({
      companyId,
      thread,
      messageText,
      kind: "manager_reply",
      authorType: "back_office_operator",
      route: "/telegram/workspace/farms",
      currentOwnerRole: user.role ?? thread.currentOwnerRole,
      currentHandoffStatus: thread.currentHandoffStatus,
      actorUserId: user.id,
      actorUserRole: user.role ?? null,
    });

    return {
      thread: outbound.thread,
      message: outbound.message,
      delivery: outbound.delivery,
    };
  }

  async markThreadRead(
    companyId: string,
    userId: string,
    threadKey: string,
    lastMessageId?: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    if (!thread.farmAccountId) {
      throw new ForbiddenException("Thread is not bound to a farm account");
    }
    await this.assertAssignment(companyId, userId, thread.farmAccountId);

    const messages = await this.communicationRepository.listMessages(companyId, thread.id);
    const targetMessage =
      (lastMessageId
        ? messages.find((item) => item.id === lastMessageId)
        : messages.at(-1)) ?? null;

    return this.communicationRepository.upsertParticipantState({
      companyId,
      threadId: thread.id,
      userId,
      lastReadMessageId: targetMessage?.id ?? null,
      lastReadAt: targetMessage?.createdAt ?? new Date().toISOString(),
    });
  }

  async listAssignments(companyId: string) {
    return this.communicationRepository.listAssignments(companyId);
  }

  async createAssignment(companyId: string, input: {
    userId: string;
    farmAccountId: string;
    status?: string;
    priority?: number;
  }): Promise<BackOfficeFarmAssignmentRecord> {
    const [user, farm] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: input.userId, companyId },
        select: { id: true },
      }),
      this.prisma.account.findFirst({
        where: { id: input.farmAccountId, companyId },
        select: { id: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }
    if (!farm) {
      throw new NotFoundException(`Farm ${input.farmAccountId} not found`);
    }

    return this.communicationRepository.createAssignment({
      companyId,
      userId: input.userId,
      farmAccountId: input.farmAccountId,
      status: input.status,
      priority: input.priority,
    });
  }

  async deleteAssignment(companyId: string, assignmentId: string) {
    await this.communicationRepository.deleteAssignment(companyId, assignmentId);
    return { success: true };
  }

  private async syncInboundThreadState(params: {
    companyId: string;
    draft: FrontOfficeDraftRecord;
    input: FrontOfficeIntakeInput;
    traceId: string;
    actorUserId?: string;
    auditLogId?: string | null;
    classification?: string | null;
    targetOwnerRole?: string | null;
    evidence?: any[] | null;
  }): Promise<{
    thread: FrontOfficeThreadRecord;
    message: {
      id: string;
      createdAt: string;
    };
  }> {
    const binding = await this.resolveThreadBinding(
      params.companyId,
      params.actorUserId,
      params.draft.anchor,
      params.input,
    );
    const thread = await this.communicationRepository.upsertThread({
      companyId: params.companyId,
      threadKey: String(params.draft.payload.threadKey),
      channel: params.input.channel,
      farmAccountId: binding.farmAccountId,
      farmNameSnapshot: binding.farmNameSnapshot,
      representativeUserId: binding.representativeUserId,
      representativeTelegramId: binding.representativeTelegramId,
      threadExternalId: params.input.threadExternalId ?? null,
      dialogExternalId: params.input.dialogExternalId ?? null,
      senderExternalId: params.input.senderExternalId ?? null,
      recipientExternalId: params.input.recipientExternalId ?? null,
      route: params.input.route ?? null,
      currentClassification: (params.classification as any) ?? null,
      currentOwnerRole: params.targetOwnerRole ?? null,
      currentHandoffStatus:
        (params.draft.payload.commitResult?.handoffStatus as any) ?? null,
      lastDraftId: params.draft.id,
      lastMessageDirection: params.input.direction ?? "inbound",
      lastMessagePreview: String(params.input.messageText).slice(0, 240),
      lastMessageAt: new Date(),
      messageCountIncrement: 1,
    });

    const message = await this.communicationRepository.createMessage({
      companyId: params.companyId,
      threadId: thread.id,
      draftId: params.draft.id,
      auditLogId: params.auditLogId ?? null,
      traceId: params.traceId,
      channel: params.input.channel,
      direction: params.input.direction ?? "inbound",
      messageText: params.input.messageText,
      sourceMessageId: params.input.sourceMessageId ?? null,
      chatId: params.input.chatId ?? null,
      route: params.input.route ?? null,
      evidence: params.evidence ?? null,
      kind: "client_message",
      authorType: "farm_representative",
      deliveryStatus: "RECEIVED",
      metadata: {
        classification: params.classification ?? null,
        targetOwnerRole: params.targetOwnerRole ?? null,
        farmAccountId: binding.farmAccountId,
      },
    });

    return {
      thread,
      message: {
        id: message.id,
        createdAt: message.createdAt,
      },
    };
  }

  private async syncSystemThreadState(
    companyId: string,
    draft: FrontOfficeDraftRecord,
    params: {
      messageText: string;
      auditLogId?: string | null;
      metadata?: Record<string, any>;
      handoffStatus?: string | null;
      targetOwnerRole?: string | null;
      ownerResultRef?: string | null;
    },
  ) {
    const existingThread = await this.communicationRepository
      .getThreadByKey(companyId, String(draft.payload.threadKey))
      .catch(() => null);
    const anchorBinding =
      existingThread?.farmAccountId ||
      existingThread?.farmNameSnapshot ||
      existingThread?.representativeUserId ||
      existingThread?.representativeTelegramId
        ? null
        : await this.resolveBindingFromAnchor(companyId, draft.anchor);
    const thread = await this.communicationRepository.upsertThread({
      companyId,
      threadKey: String(draft.payload.threadKey),
      channel: draft.payload.channel,
      farmAccountId: existingThread?.farmAccountId ?? anchorBinding?.farmAccountId ?? null,
      farmNameSnapshot:
        existingThread?.farmNameSnapshot ?? anchorBinding?.farmNameSnapshot ?? null,
      representativeUserId:
        existingThread?.representativeUserId ?? anchorBinding?.representativeUserId ?? null,
      representativeTelegramId:
        existingThread?.representativeTelegramId ??
        anchorBinding?.representativeTelegramId ??
        null,
      threadExternalId: draft.payload.threadExternalId ?? existingThread?.threadExternalId ?? null,
      dialogExternalId: draft.payload.dialogExternalId ?? existingThread?.dialogExternalId ?? null,
      senderExternalId: draft.payload.senderExternalId ?? existingThread?.senderExternalId ?? null,
      recipientExternalId: draft.payload.recipientExternalId ?? existingThread?.recipientExternalId ?? null,
      route: draft.payload.route ?? null,
      currentClassification: (draft.payload.classification as any) ?? null,
      currentOwnerRole: params.targetOwnerRole ?? draft.payload.targetOwnerRole ?? null,
      currentHandoffStatus: (params.handoffStatus as any) ?? null,
      lastDraftId: draft.id,
      lastMessageDirection: "outbound",
      lastMessagePreview: params.messageText.slice(0, 240),
      lastMessageAt: new Date(),
    });

    await this.communicationRepository.createMessage({
      companyId,
      threadId: thread.id,
      draftId: draft.id,
      auditLogId: params.auditLogId ?? null,
      traceId: draft.payload.traceId ?? null,
      channel: draft.payload.channel,
      direction: "outbound",
      messageText: params.messageText,
      sourceMessageId: draft.payload.sourceMessageId ?? null,
      chatId: draft.payload.chatId ?? null,
      route: draft.payload.route ?? null,
      evidence: draft.evidence,
      kind: "system_event",
      authorType: "system",
      deliveryStatus: "SKIPPED",
      metadata: {
        ...(params.metadata ?? {}),
        ownerResultRef: params.ownerResultRef ?? null,
      },
    });
  }

  private async resolveBindingFromAnchor(
    companyId: string,
    anchor: FrontOfficeDraftAnchor,
  ) {
    let farmAccountId: string | null = null;
    let farmNameSnapshot: string | null = null;

    if (anchor.farmRef) {
      const farm = await this.resolveFarmAccount(companyId, anchor.farmRef);
      if (farm) {
        farmAccountId = farm.id;
        farmNameSnapshot = farm.name;
      }
    }

    if (!farmAccountId && anchor.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: { id: anchor.fieldId, companyId },
        select: {
          clientId: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });
      if (field?.clientId) {
        farmAccountId = field.clientId;
        farmNameSnapshot = field.client?.name ?? null;
      }
    }

    return {
      farmAccountId,
      farmNameSnapshot,
      representativeUserId: null,
      representativeTelegramId: null,
    };
  }

  private async buildThreadList(
    companyId: string,
    userId: string,
    threads: FrontOfficeThreadRecord[],
  ): Promise<FrontOfficeThreadListItemRecord[]> {
    if (threads.length === 0) {
      return [];
    }

    const [states, messages] = await Promise.all([
      this.communicationRepository.listParticipantStates(
        companyId,
        userId,
        threads.map((item) => item.id),
      ),
      this.communicationRepository.listMessagesForThreads(
        companyId,
        threads.map((item) => item.id),
      ),
    ]);

    const stateByThreadId = new Map(states.map((item) => [item.threadId, item]));
    const messagesByThreadId = new Map<string, typeof messages>();
    for (const message of messages) {
      const current = messagesByThreadId.get(message.threadId) ?? [];
      current.push(message);
      messagesByThreadId.set(message.threadId, current);
    }

    return threads.map((thread) => {
      const state = stateByThreadId.get(thread.id);
      const threadMessages = messagesByThreadId.get(thread.id) ?? [];
      const lastReadAtTs = state?.lastReadAt
        ? new Date(state.lastReadAt).getTime()
        : null;
      const unreadCount = threadMessages.filter((message) => {
        if (message.direction !== "inbound") {
          return false;
        }
        if (lastReadAtTs === null) {
          return true;
        }
        return new Date(message.createdAt).getTime() > lastReadAtTs;
      }).length;

      return {
        threadKey: thread.threadKey,
        threadId: thread.id,
        farmAccountId: thread.farmAccountId,
        farmNameSnapshot: thread.farmNameSnapshot,
        representativeTelegramId: thread.representativeTelegramId,
        lastMessagePreview: thread.lastMessagePreview,
        lastMessageAt: thread.lastMessageAt,
        lastMessageDirection: thread.lastMessageDirection,
        currentHandoffStatus: thread.currentHandoffStatus,
        currentOwnerRole: thread.currentOwnerRole,
        unreadCount,
        needsHumanAction: this.threadNeedsHumanAction(thread),
      };
    });
  }

  private async assertAssignment(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ) {
    const assignment = await this.communicationRepository.findAssignment(
      companyId,
      userId,
      farmAccountId,
    );

    if (!assignment) {
      throw new ForbiddenException(
        `User ${userId} is not assigned to farm ${farmAccountId}`,
      );
    }

    return assignment;
  }

  private async assertThreadAccess(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    thread: FrontOfficeThreadRecord,
  ) {
    if (!thread.farmAccountId) {
      return;
    }

    if (viewer.role === "ADMIN") {
      return;
    }

    if (viewer.accountId && viewer.accountId === thread.farmAccountId) {
      return;
    }

    await this.assertAssignment(companyId, viewer.id, thread.farmAccountId);
  }

  private normalizeTelegramChatId(
    rawChatId?: string | null,
    fallbackChatId?: string | null,
  ): string | null {
    const candidate = rawChatId ?? fallbackChatId ?? null;
    if (!candidate) {
      return null;
    }
    if (candidate.startsWith("telegram:")) {
      return candidate.slice("telegram:".length);
    }
    return candidate;
  }

  private async resolveThreadBinding(
    companyId: string,
    actorUserId: string | undefined,
    anchor: FrontOfficeDraftAnchor,
    input: FrontOfficeIntakeInput,
  ) {
    const existingThread = input.threadExternalId
      ? await this.communicationRepository
          .getThreadByKey(
            companyId,
            this.buildFallbackThreadKey(companyId, {
              channel: input.channel,
              threadExternalId: input.threadExternalId,
              dialogExternalId: input.dialogExternalId,
              senderExternalId: input.senderExternalId,
            }),
          )
          .catch(() => null)
      : null;

    let farmAccountId = existingThread?.farmAccountId ?? null;
    let farmNameSnapshot = existingThread?.farmNameSnapshot ?? null;
    let representativeUserId = existingThread?.representativeUserId ?? null;
    let representativeTelegramId =
      existingThread?.representativeTelegramId ??
      input.senderExternalId ??
      null;

    if (actorUserId && (input.direction ?? "inbound") === "inbound") {
      const user = await this.prisma.user.findFirst({
        where: { id: actorUserId, companyId },
        select: {
          id: true,
          telegramId: true,
          accountId: true,
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (user) {
        representativeUserId = user.id;
        representativeTelegramId = user.telegramId ?? representativeTelegramId;
        if (user.accountId) {
          farmAccountId = user.accountId;
          farmNameSnapshot = user.account?.name ?? farmNameSnapshot;
        }
      }
    }

    if (!farmAccountId && anchor.farmRef) {
      const farm = await this.resolveFarmAccount(companyId, anchor.farmRef);
      if (farm) {
        farmAccountId = farm.id;
        farmNameSnapshot = farm.name;
      }
    }

    if (!farmAccountId && anchor.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: { id: anchor.fieldId, companyId },
        select: {
          clientId: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });
      if (field?.clientId) {
        farmAccountId = field.clientId;
        farmNameSnapshot = field.client?.name ?? farmNameSnapshot;
      }
    }

    return {
      farmAccountId,
      farmNameSnapshot,
      representativeUserId,
      representativeTelegramId,
    };
  }

  private async resolveFarmAccount(companyId: string, farmRef: string) {
    return this.prisma.account.findFirst({
      where: {
        companyId,
        OR: [
          { id: farmRef },
          { name: { equals: farmRef, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private async notifyAssignedManagers(thread: FrontOfficeThreadRecord) {
    if (!thread.farmAccountId) {
      return;
    }

    const assignmentModel = (this.prisma as any).backOfficeFarmAssignment;
    if (!assignmentModel?.findMany) {
      return;
    }

    try {
      const rows = await assignmentModel.findMany({
        where: {
          companyId: thread.companyId,
          farmAccountId: thread.farmAccountId,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              telegramId: true,
            },
          },
        },
      });
      const telegramIds = rows
        .map((item: any) => item.user?.telegramId)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0);

      if (telegramIds.length === 0) {
        return;
      }

      await this.telegramNotificationService.notifyFrontOfficeThread({
        telegramIds,
        farmName: thread.farmNameSnapshot ?? "Хозяйство",
        threadKey: thread.threadKey,
        preview: thread.lastMessagePreview ?? "Новое сообщение во Front Office",
      });
    } catch {
      // Best-effort notification path. Do not fail ingress on manager push errors.
    }
  }

  private async handleInboundRouting(params: {
    companyId: string;
    traceId: string;
    user: { id?: string; role?: string };
    draft: FrontOfficeDraftRecord;
    thread: FrontOfficeThreadRecord;
    decision: FrontOfficeReplyDecision;
  }): Promise<{
    draft: FrontOfficeDraftRecord;
    committed: any;
  }> {
    const effectiveResolutionMode = this.resolveEffectiveResolutionMode(
      params.decision,
    );
    const preparedDraft = await this.updateDraftDecision(
      params.companyId,
      params.draft,
      params.decision,
      effectiveResolutionMode,
    );

    switch (effectiveResolutionMode) {
      case "PROCESS_DRAFT":
        return {
          draft: preparedDraft,
          committed: await this.repository.findCommitted(
            params.companyId,
            preparedDraft.id,
          ),
        };
      case "REQUEST_CLARIFICATION":
        return this.handleClarificationRouting({
          companyId: params.companyId,
          draft: preparedDraft,
          thread: params.thread,
          decision: params.decision,
        });
      case "AUTO_REPLY":
        return this.handleAutoReplyRouting({
          companyId: params.companyId,
          user: params.user,
          draft: preparedDraft,
          thread: params.thread,
          decision: params.decision,
        });
      case "HUMAN_HANDOFF":
      default:
        return this.handleHumanHandoffRouting({
          companyId: params.companyId,
          user: params.user,
          draft: preparedDraft,
          thread: params.thread,
          decision: params.decision,
        });
    }
  }

  private async handleClarificationRouting(params: {
    companyId: string;
    draft: FrontOfficeDraftRecord;
    thread: FrontOfficeThreadRecord;
    decision: FrontOfficeReplyDecision;
  }) {
    let replyStatus: FrontOfficeReplyStatus = "FAILED";
    let clarificationText: string | null = null;
    try {
      const clarification =
        await this.clientResponseOrchestrator.sendClarification({
          companyId: params.companyId,
          thread: params.thread,
          draft: params.draft,
          missingContext: params.decision.missingContext,
          targetOwnerRole: params.decision.targetOwnerRole,
        });
      replyStatus = clarification.replyStatus;
      clarificationText = clarification.text;
    } catch {
      replyStatus = "FAILED";
    }

    return this.commitResolvedDraft({
      companyId: params.companyId,
      draft: params.draft,
      committedBy: params.draft.userId,
      payloadPatch: {
        resolutionMode: "REQUEST_CLARIFICATION",
        responseRisk: params.decision.responseRisk,
        replyStatus,
        prohibitedReason: params.decision.prohibitedReason,
        missingContext: params.decision.missingContext,
        managerNotified: false,
        commitResult: {
          kind: "clarification_request",
          id: params.draft.id,
          replyStatus,
          missingContext: params.decision.missingContext,
          text: clarificationText,
        },
      },
    });
  }

  private async handleAutoReplyRouting(params: {
    companyId: string;
    user: { id?: string; role?: string };
    draft: FrontOfficeDraftRecord;
    thread: FrontOfficeThreadRecord;
    decision: FrontOfficeReplyDecision;
  }) {
    try {
      const autoReply = await this.clientResponseOrchestrator.sendAutoReply({
        companyId: params.companyId,
        userId: params.user.id,
        thread: params.thread,
        draft: params.draft,
        targetOwnerRole: params.decision.targetOwnerRole,
        responseRisk: params.decision.responseRisk,
      });

      if (autoReply.replyStatus === "SENT") {
        return this.commitResolvedDraft({
          companyId: params.companyId,
          draft: params.draft,
          committedBy: params.user.id ?? params.draft.userId,
          payloadPatch: {
            resolutionMode: "AUTO_REPLY",
            responseRisk: params.decision.responseRisk,
            replyStatus: autoReply.replyStatus,
            prohibitedReason: null,
            autoReplyTraceId: autoReply.autoReplyTraceId,
            managerNotified: false,
            commitResult: {
              kind: "auto_reply",
              id: autoReply.messageId ?? autoReply.autoReplyTraceId ?? params.draft.id,
              replyStatus: autoReply.replyStatus,
              autoReplyTraceId: autoReply.autoReplyTraceId,
              targetOwnerRole: autoReply.ownerRole ?? params.decision.targetOwnerRole,
            },
          },
        });
      }

      return this.handleHumanHandoffRouting({
        companyId: params.companyId,
        user: params.user,
        draft: params.draft,
        thread: params.thread,
        decision: {
          ...params.decision,
          resolutionMode: "HUMAN_HANDOFF",
          managerShouldBeNotified: true,
          needsHumanAction: true,
          prohibitedReason: this.describeAutoReplyFailure(
            autoReply.failureReason ?? autoReply.replyStatus,
          ),
        },
      });
    } catch (error) {
      return this.handleHumanHandoffRouting({
        companyId: params.companyId,
        user: params.user,
        draft: params.draft,
        thread: params.thread,
        decision: {
          ...params.decision,
          resolutionMode: "HUMAN_HANDOFF",
          managerShouldBeNotified: true,
          needsHumanAction: true,
          prohibitedReason: this.describeAutoReplyFailure(
            (error as Error).message,
          ),
        },
      });
    }
  }

  private async handleHumanHandoffRouting(params: {
    companyId: string;
    user: { id?: string; role?: string };
    draft: FrontOfficeDraftRecord;
    thread: FrontOfficeThreadRecord;
    decision: FrontOfficeReplyDecision;
  }) {
    const intent = (params.draft.payload.suggestedIntent ??
      this.mapEventTypeToIntent(params.draft.eventType)) as FrontOfficeIntent;
    const handoff = await this.handoffOrchestrator.routeDraftHandoff({
      companyId: params.companyId,
      userId: params.user.id,
      threadId: params.thread.id,
      draftId: params.draft.id,
      traceId: params.draft.payload.traceId,
      targetOwnerRole: params.decision.targetOwnerRole ?? null,
      sourceIntent: intent,
      summary: params.decision.dialogSummary,
      evidence: params.draft.evidence,
    });

    let replyStatus: FrontOfficeReplyStatus = "FAILED";
    try {
      const receipt = await this.clientResponseOrchestrator.sendHandoffReceipt({
        companyId: params.companyId,
        thread: params.thread,
        draft: params.draft,
        targetOwnerRole: handoff.targetOwnerRole,
        handoffId: handoff.id,
        handoffStatus: handoff.status,
      });
      replyStatus = receipt.replyStatus;
    } catch {
      replyStatus = "FAILED";
    }

    const managerNotified =
      params.decision.managerShouldBeNotified || handoff.status !== "COMPLETED";
    if (managerNotified) {
      await this.notifyAssignedManagers(params.thread);
    }

    return this.commitResolvedDraft({
      companyId: params.companyId,
      draft: params.draft,
      committedBy: params.user.id ?? params.draft.userId,
      payloadPatch: {
        resolutionMode: "HUMAN_HANDOFF",
        responseRisk: params.decision.responseRisk,
        replyStatus,
        prohibitedReason: params.decision.prohibitedReason,
        managerNotified,
        commitResult: {
          kind: "handoff",
          id: handoff.id,
          handoffId: handoff.id,
          handoffStatus: handoff.status,
          targetOwnerRole: handoff.targetOwnerRole,
          ownerRoute: handoff.ownerRoute,
          nextAction: handoff.nextAction,
          ownerResultRef: handoff.ownerResultRef,
          createdAt: handoff.createdAt,
          replyStatus,
        },
      },
    });
  }

  private async updateDraftDecision(
    companyId: string,
    draft: FrontOfficeDraftRecord,
    decision: FrontOfficeReplyDecision,
    resolutionMode: FrontOfficeResolutionMode,
  ) {
    return this.repository.updateDraft(companyId, draft.id, {
      payload: {
        ...draft.payload,
        targetOwnerRole: decision.targetOwnerRole ?? draft.payload.targetOwnerRole ?? null,
        resolutionMode,
        responseRisk: decision.responseRisk,
        missingContext: decision.missingContext,
        directReplyAllowed: decision.directReplyAllowed,
        prohibitedReason: decision.prohibitedReason,
        dialogSummary: decision.dialogSummary,
        managerNotified: false,
        replyStatus: "NOT_SENT",
      },
    });
  }

  private async commitResolvedDraft(params: {
    companyId: string;
    draft: FrontOfficeDraftRecord;
    committedBy: string;
    payloadPatch: Record<string, any>;
  }) {
    const updated = await this.repository.updateDraft(
      params.companyId,
      params.draft.id,
      {
        payload: {
          ...params.draft.payload,
          ...params.payloadPatch,
        },
      },
    );
    const committed = await this.repository.commitDraft({
      companyId: params.companyId,
      draftId: updated.id,
      committedBy: params.committedBy,
      provenanceHash: this.buildProvenanceHash(updated),
    });
    return committed;
  }

  private resolveEffectiveResolutionMode(
    decision: FrontOfficeReplyDecision,
  ): FrontOfficeResolutionMode {
    if (decision.resolutionMode !== "AUTO_REPLY") {
      return decision.resolutionMode;
    }
    return decision.directReplyAllowed ? "AUTO_REPLY" : "HUMAN_HANDOFF";
  }

  private describeAutoReplyFailure(reason?: string | null): string {
    if (!reason) {
      return "Автоматический ответ недоступен, запрос передан консультанту.";
    }
    if (reason === "NO_EVIDENCE") {
      return "Для безопасного ответа не хватило подтверждённых данных.";
    }
    if (reason === "EMPTY_RESPONSE") {
      return "Сервис ответа не вернул содержательный результат.";
    }
    return `Автоматический ответ недоступен: ${reason}.`;
  }

  private threadNeedsHumanAction(thread: FrontOfficeThreadRecord): boolean {
    return ["ROUTED", "PENDING_APPROVAL", "MANUAL_REQUIRED", "CLAIMED"].includes(
      thread.currentHandoffStatus ?? "",
    );
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
    const commitResult =
      draft.payload.commitResult ?? committed?.payload?.commitResult ?? null;
    const resolutionMode =
      draft.payload.resolutionMode ?? committed?.payload?.resolutionMode ?? null;
    const responseRisk =
      draft.payload.responseRisk ?? committed?.payload?.responseRisk ?? null;
    const replyStatus =
      draft.payload.replyStatus ??
      committed?.payload?.replyStatus ??
      commitResult?.replyStatus ??
      "NOT_SENT";
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
      targetOwnerRole: draft.payload.targetOwnerRole ?? null,
      handoffId: commitResult?.handoffId ?? null,
      handoffStatus: commitResult?.handoffStatus ?? null,
      ownerResultRef: commitResult?.ownerResultRef ?? null,
      resolutionMode,
      responseRisk,
      replyStatus,
      prohibitedReason:
        draft.payload.prohibitedReason ??
        committed?.payload?.prohibitedReason ??
        null,
      autoReplyTraceId:
        draft.payload.autoReplyTraceId ??
        committed?.payload?.autoReplyTraceId ??
        null,
      managerNotified: Boolean(
        draft.payload.managerNotified ?? committed?.payload?.managerNotified ?? false,
      ),
      draft,
      committed,
      commitResult,
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

  private shouldCreateHandoff(
    intent: FrontOfficeIntent,
    draft: FrontOfficeDraftRecord,
  ): boolean {
    const targetOwnerRole = draft.payload.targetOwnerRole;
    if (!targetOwnerRole) {
      return false;
    }
    return intent === "consultation" || intent === "context_update";
  }

  private buildHandoffSummary(draft: FrontOfficeDraftRecord, intent: FrontOfficeIntent) {
    const anchor = [
      draft.anchor.fieldId ? `field=${draft.anchor.fieldId}` : null,
      draft.anchor.seasonId ? `season=${draft.anchor.seasonId}` : null,
      draft.anchor.taskId ? `task=${draft.anchor.taskId}` : null,
      draft.anchor.farmRef ? `farm=${draft.anchor.farmRef}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    const base = String(draft.payload.messageText ?? "").trim().slice(0, 280);
    return [`intent=${intent}`, anchor || null, base].filter(Boolean).join(" | ");
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

    if (this.shouldCreateHandoff(intent, draft)) {
      const thread = await this.communicationRepository.getThreadByKey(
        companyId,
        String(draft.payload.threadKey),
      );
      const handoff = await this.handoffOrchestrator.routeDraftHandoff({
        companyId,
        userId,
        threadId: thread.id,
        draftId: draft.id,
        traceId: draft.payload.traceId,
        targetOwnerRole: draft.payload.targetOwnerRole ?? null,
        sourceIntent: intent,
        summary: this.buildHandoffSummary(draft, intent),
        evidence: draft.evidence,
      });

      return {
        kind: "handoff",
        id: handoff.id,
        handoffId: handoff.id,
        handoffStatus: handoff.status,
        targetOwnerRole: handoff.targetOwnerRole,
        ownerRoute: handoff.ownerRoute,
        nextAction: handoff.nextAction,
        ownerResultRef: handoff.ownerResultRef,
        createdAt: handoff.createdAt,
      };
    }

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

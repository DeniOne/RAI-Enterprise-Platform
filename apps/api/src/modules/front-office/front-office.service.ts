import { Injectable, NotFoundException } from "@nestjs/common";
import {
  DeviationType,
  IntegrityStatus,
  ObservationIntent,
  ObservationType,
  TaskStatus,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { resolveTelegramTunnel } from "../../shared/auth/telegram-tunnel.resolver";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { DeviationService } from "../cmr/deviation.service";
import {
  FrontOfficeAgent,
  FrontOfficeAgentInput,
} from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeDraftService } from "../front-office-draft/front-office-draft.service";

type IntakeKind =
  | "observation"
  | "deviation"
  | "consultation"
  | "context_update";

interface ResolvedContext {
  fieldId?: string;
  seasonId?: string;
  taskId?: string;
}

@Injectable()
export class FrontOfficeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly fieldObservationService: FieldObservationService,
    private readonly deviationService: DeviationService,
    private readonly frontOfficeAgent: FrontOfficeAgent,
    private readonly frontOfficeDraftService: FrontOfficeDraftService,
  ) {}

  async getOverview(companyId: string, userId?: string) {
    const [fieldsCount, seasonsCount, myTasks, openDeviations, recentContext] =
      await Promise.all([
        this.prisma.field.count({ where: { companyId } }),
        this.prisma.season.count({ where: { companyId } }),
        this.prisma.task.findMany({
          where: {
            companyId,
            ...(userId
              ? { assigneeId: userId }
              : { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } }),
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 6,
          include: {
            field: { select: { id: true, name: true } },
            season: { select: { id: true, year: true } },
          },
        }),
        this.prisma.deviationReview.findMany({
          where: {
            companyId,
            status: { in: ["DETECTED", "ANALYZING"] as any },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        this.prisma.auditLog.findMany({
          where: {
            companyId,
            action: {
              in: [
                "FRONT_OFFICE_CONSULTATION_REQUESTED",
                "FRONT_OFFICE_CONTEXT_UPDATED",
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

    return {
      counts: {
        fields: fieldsCount,
        seasons: seasonsCount,
        tasks: myTasks.length,
        openDeviations: openDeviations.length,
      },
      tasks: myTasks,
      deviations: openDeviations,
      recentSignals: recentContext.map((entry) => ({
        id: entry.id,
        action: entry.action,
        createdAt: entry.createdAt,
        metadata: entry.metadata,
      })),
    };
  }

  async classifyMessage(
    companyId: string,
    traceId: string,
    input: Omit<FrontOfficeAgentInput, "companyId" | "traceId" | "intent"> & {
      userId?: string;
      userRole?: string;
    },
  ) {
    return this.frontOfficeAgent.run({
      companyId,
      traceId,
      intent: "classify_dialog_thread",
      ...input,
    });
  }

  async intakeMessage(
    companyId: string,
    traceId: string,
    user: { id?: string; role?: string },
    input: {
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
    },
  ) {
    return this.frontOfficeDraftService.intakeMessage(
      companyId,
      traceId,
      user,
      input,
    );
  }

  async getDraft(companyId: string, draftId: string) {
    return this.frontOfficeDraftService.getDraft(companyId, draftId);
  }

  async fixDraft(
    companyId: string,
    traceId: string,
    user: { id?: string; role?: string },
    draftId: string,
    patch: any,
  ) {
    return this.frontOfficeDraftService.fixDraft(
      companyId,
      traceId,
      user,
      draftId,
      patch,
    );
  }

  async linkDraft(
    companyId: string,
    userId: string | undefined,
    draftId: string,
    link: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
  ) {
    return this.frontOfficeDraftService.linkDraft(companyId, userId, draftId, link);
  }

  async confirmDraft(
    companyId: string,
    user: { id?: string; role?: string },
    draftId: string,
  ) {
    return this.frontOfficeDraftService.confirmDraft(companyId, user, draftId);
  }

  async getQueues(companyId: string) {
    return this.frontOfficeDraftService.getQueues(companyId);
  }

  async getThread(companyId: string, threadKey: string) {
    return this.frontOfficeDraftService.getThread(companyId, threadKey);
  }

  async listMessages(companyId: string, threadKey: string) {
    return this.frontOfficeDraftService.listMessages(companyId, threadKey);
  }

  async listMessagesForViewer(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
  ) {
    return this.frontOfficeDraftService.listMessagesForViewer(
      companyId,
      viewer,
      threadKey,
    );
  }

  async listThreads(companyId: string) {
    return this.frontOfficeDraftService.listThreads(companyId);
  }

  async getTelegramWorkspaceBootstrap(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        accountId: true,
        employeeProfile: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? user.email.split("@")[0],
        role: user.role,
        companyId: user.companyId,
        accountId: user.accountId ?? null,
        employeeProfile: user.employeeProfile ?? null,
      },
      telegramTunnel: resolveTelegramTunnel(user),
      miniAppUrl:
        process.env.TELEGRAM_MINIAPP_URL ||
        process.env.WEBAPP_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000/telegram/workspace",
    };
  }

  async listManagerFarms(companyId: string, userId: string) {
    return this.frontOfficeDraftService.listManagerFarms(companyId, userId);
  }

  async listManagerFarmThreads(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ) {
    return this.frontOfficeDraftService.listManagerFarmThreads(
      companyId,
      userId,
      farmAccountId,
    );
  }

  async replyToThread(
    companyId: string,
    user: { id: string; role?: string },
    threadKey: string,
    messageText: string,
  ) {
    return this.frontOfficeDraftService.replyToThread(
      companyId,
      user,
      threadKey,
      messageText,
    );
  }

  async markThreadRead(
    companyId: string,
    userId: string,
    threadKey: string,
    lastMessageId?: string,
  ) {
    return this.frontOfficeDraftService.markThreadRead(
      companyId,
      userId,
      threadKey,
      lastMessageId,
    );
  }

  async listAssignments(companyId: string) {
    return this.frontOfficeDraftService.listAssignments(companyId);
  }

  async createAssignment(
    companyId: string,
    input: { userId: string; farmAccountId: string; status?: string; priority?: number },
  ) {
    return this.frontOfficeDraftService.createAssignment(companyId, input);
  }

  async deleteAssignment(companyId: string, assignmentId: string) {
    return this.frontOfficeDraftService.deleteAssignment(companyId, assignmentId);
  }

  async listHandoffs(companyId: string) {
    return this.frontOfficeDraftService.listHandoffs(companyId);
  }

  async getHandoff(companyId: string, handoffId: string) {
    return this.frontOfficeDraftService.getHandoff(companyId, handoffId);
  }

  async claimHandoff(companyId: string, handoffId: string, userId?: string) {
    return this.frontOfficeDraftService.claimHandoff(companyId, handoffId, userId);
  }

  async rejectHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    reason: string,
  ) {
    return this.frontOfficeDraftService.rejectHandoff(
      companyId,
      handoffId,
      userId,
      reason,
    );
  }

  async resolveHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    ownerResultRef?: string,
    note?: string,
  ) {
    return this.frontOfficeDraftService.resolveHandoff(
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
    return this.frontOfficeDraftService.addManualNote(companyId, handoffId, userId, note);
  }

  async createConsultation(
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

  async listConsultations(companyId: string) {
    return this.prisma.auditLog.findMany({
      where: { companyId, action: "FRONT_OFFICE_CONSULTATION_REQUESTED" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createContextUpdate(
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

  async listContextUpdates(companyId: string) {
    return this.prisma.auditLog.findMany({
      where: { companyId, action: "FRONT_OFFICE_CONTEXT_UPDATED" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createDeviation(
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
      aiImpactAssessment: `Front-office intake via ${input.channel ?? "unknown"}`,
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

  async listDeviations(companyId: string) {
    return this.deviationService.findAll(companyId, {
      page: 1,
      limit: 100,
      skip: 0,
    });
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

  private mapClassificationToIntent(
    classification?:
      | "free_chat"
      | "task_process"
      | "client_request"
      | "escalation_signal",
  ): IntakeKind {
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
    const evidenceCount = [
      input.photoUrl,
      input.voiceUrl,
      input.coordinates,
      input.telemetryJson,
    ].filter(Boolean).length;

    if (evidenceCount >= 2) return IntegrityStatus.STRONG_EVIDENCE;
    if (evidenceCount === 1) return IntegrityStatus.WEAK_EVIDENCE;
    return IntegrityStatus.NO_EVIDENCE;
  }
}

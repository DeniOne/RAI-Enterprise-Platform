import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  ExplorationCaseStatus,
  ExplorationMode,
  ExplorationType,
  SignalSource,
  SignalStatus,
  WarRoomStatus,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  ExplorationStateMachine,
  normalizeExplorationRole,
} from "./exploration.fsm";

@Injectable()
export class ExplorationService {
  private readonly fsm = new ExplorationStateMachine();
  private readonly logger = new Logger(ExplorationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private logMetric(
    action: string,
    startedAt: number,
    context: Record<string, unknown>,
    error?: unknown,
  ) {
    const durationMs = Date.now() - startedAt;
    const status = error ? "error" : "ok";
    const errorName =
      error && typeof error === "object" && "name" in error
        ? String((error as { name?: unknown }).name ?? "UnknownError")
        : undefined;
    this.logger.log(
      `[EXP-METRIC] action=${action} status=${status} durationMs=${durationMs} context=${JSON.stringify(
        {
          ...context,
          ...(errorName ? { errorName } : {}),
        },
      )}`,
    );
  }

  async ingestSignal(
    companyId: string,
    payload: {
      source?: SignalSource;
      rawPayload: unknown;
      confidenceScore?: number;
      initiatorId?: string;
    },
  ) {
    const startedAt = Date.now();
    try {
      const result = await this.prisma.strategicSignal.create({
        data: {
          companyId,
          initiatorId: payload.initiatorId,
          source: payload.source ?? SignalSource.INTERNAL,
          rawPayload: payload.rawPayload as object,
          confidenceScore: payload.confidenceScore ?? 0,
          status: SignalStatus.RAW,
        },
      });
      this.logMetric("ingest_signal", startedAt, {
        companyId,
        signalId: result.id,
        source: result.source,
      });
      return result;
    } catch (error) {
      this.logMetric("ingest_signal", startedAt, { companyId }, error);
      throw error;
    }
  }

  async triageToCase(
    companyId: string,
    signalId: string,
    payload: {
      initiatorId?: string;
      explorationMode?: ExplorationMode;
      type?: ExplorationType;
      triageConfig?: unknown;
      ownerId?: string;
      timeboxDeadline?: string;
      riskScore?: number;
    },
  ) {
    const startedAt = Date.now();
    try {
      if (payload.initiatorId) {
        const initiator = await this.prisma.user.findFirst({
          where: { id: payload.initiatorId, companyId },
          select: { id: true },
        });
        if (!initiator) {
          throw new NotFoundException(`Initiator ${payload.initiatorId} not found`);
        }
      }
      if (payload.ownerId) {
        const owner = await this.prisma.user.findFirst({
          where: { id: payload.ownerId, companyId },
          select: { id: true },
        });
        if (!owner) {
          throw new NotFoundException(`Owner ${payload.ownerId} not found`);
        }
      }

      const signal = await this.prisma.strategicSignal.findFirst({
        where: { id: signalId, companyId },
        select: { id: true, initiatorId: true, status: true },
      });
      if (!signal) {
        throw new NotFoundException(`Signal ${signalId} not found`);
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const created = await tx.explorationCase.create({
          data: {
            companyId,
            signalId: signal.id,
            initiatorId: payload.initiatorId ?? signal.initiatorId,
            explorationMode: payload.explorationMode ?? ExplorationMode.CDU,
            type: payload.type ?? ExplorationType.PROBLEM,
            status: ExplorationCaseStatus.DRAFT,
            triageConfig: (payload.triageConfig ?? {}) as object,
            ownerId: payload.ownerId,
            riskScore: payload.riskScore,
            timeboxDeadline: payload.timeboxDeadline
              ? new Date(payload.timeboxDeadline)
              : null,
          },
        });

        await tx.strategicSignal.update({
          where: { id: signal.id },
          data: { status: SignalStatus.TRIAGED },
        });

        return created;
      });

      this.logMetric("triage_to_case", startedAt, {
        companyId,
        signalId,
        caseId: result.id,
        mode: result.explorationMode,
      });
      return result;
    } catch (error) {
      this.logMetric("triage_to_case", startedAt, { companyId, signalId }, error);
      throw error;
    }
  }

  async getShowcase(
    companyId: string,
    filters?: {
      mode?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const startedAt = Date.now();
    try {
      const page = Math.max(1, Number(filters?.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(filters?.pageSize || 20)));
      const mode = String(filters?.mode || "").toUpperCase();
      const status = String(filters?.status || "").toUpperCase();

      const where = {
        companyId,
        ...(Object.values(ExplorationMode).includes(mode as ExplorationMode)
          ? { explorationMode: mode as ExplorationMode }
          : {}),
        ...(Object.values(ExplorationCaseStatus).includes(
          status as ExplorationCaseStatus,
        )
          ? { status: status as ExplorationCaseStatus }
          : {}),
      };

      const [total, items] = await this.prisma.$transaction([
        this.prisma.explorationCase.count({ where }),
        this.prisma.explorationCase.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            signal: {
              select: {
                id: true,
                source: true,
                confidenceScore: true,
                status: true,
              },
            },
            warRoomSessions: {
              where: { status: WarRoomStatus.ACTIVE },
              select: { id: true, deadline: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        }),
      ]);

      const result = {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
      this.logMetric("get_showcase", startedAt, {
        companyId,
        total,
        page,
        pageSize,
      });
      return result;
    } catch (error) {
      this.logMetric("get_showcase", startedAt, { companyId }, error);
      throw error;
    }
  }

  async transitionCase(
    companyId: string,
    caseId: string,
    payload: {
      targetStatus: ExplorationCaseStatus;
      role?: string;
    },
  ) {
    const startedAt = Date.now();
    try {
      const existing = await this.prisma.explorationCase.findFirst({
        where: { id: caseId, companyId },
        select: { id: true, status: true },
      });
      if (!existing) {
        throw new NotFoundException(`Exploration case ${caseId} not found`);
      }

      const normalizedRole = normalizeExplorationRole(payload.role);
      this.fsm.validateTransition(existing.status, payload.targetStatus, normalizedRole);

      const result = await this.prisma.explorationCase.update({
        where: { id: caseId },
        data: { status: payload.targetStatus },
      });
      this.logMetric("transition_case", startedAt, {
        companyId,
        caseId,
        from: existing.status,
        to: payload.targetStatus,
        role: normalizedRole,
      });
      return result;
    } catch (error) {
      this.logMetric("transition_case", startedAt, { companyId, caseId }, error);
      throw error;
    }
  }

  async appendWarRoomDecisionEvent(
    companyId: string,
    warRoomSessionId: string,
    payload: {
      participantId: string;
      decisionData: unknown;
      signatureHash: string;
    },
  ) {
    const startedAt = Date.now();
    try {
      const session = await this.prisma.warRoomSession.findFirst({
        where: { id: warRoomSessionId, companyId },
        select: { id: true },
      });
      if (!session) {
        throw new NotFoundException(`War room session ${warRoomSessionId} not found`);
      }

      const participant = await this.prisma.user.findFirst({
        where: { id: payload.participantId, companyId },
        select: { id: true },
      });
      if (!participant) {
        throw new NotFoundException(
          `Participant ${payload.participantId} not found in tenant`,
        );
      }

      const result = await this.prisma.warRoomDecisionEvent.create({
        data: {
          companyId,
          warRoomSessionId: session.id,
          participantId: payload.participantId,
          decisionData: payload.decisionData as object,
          signatureHash: payload.signatureHash,
        },
      });
      this.logMetric("append_war_room_event", startedAt, {
        companyId,
        warRoomSessionId,
        participantId: payload.participantId,
      });
      return result;
    } catch (error) {
      this.logMetric(
        "append_war_room_event",
        startedAt,
        { companyId, warRoomSessionId },
        error,
      );
      throw error;
    }
  }

  async openWarRoomSession(
    companyId: string,
    explorationCaseId: string,
    payload: {
      facilitatorId: string;
      participants: Array<{ userId: string; role: string }>;
      deadline: string;
    },
  ) {
    const startedAt = Date.now();
    try {
      const explorationCase = await this.prisma.explorationCase.findFirst({
        where: { id: explorationCaseId, companyId },
        select: { id: true, status: true },
      });
      if (!explorationCase) {
        throw new NotFoundException(`Exploration case ${explorationCaseId} not found`);
      }

      const facilitator = await this.prisma.user.findFirst({
        where: { id: payload.facilitatorId, companyId },
        select: { id: true },
      });
      if (!facilitator) {
        throw new NotFoundException(
          `Facilitator ${payload.facilitatorId} not found in tenant`,
        );
      }

      if (!Array.isArray(payload.participants) || payload.participants.length === 0) {
        throw new BadRequestException("War Room participants must not be empty");
      }

      const participantIds = payload.participants.map((participant) => participant.userId);
      const participantCount = await this.prisma.user.count({
        where: { companyId, id: { in: participantIds } },
      });
      if (participantCount !== participantIds.length) {
        throw new BadRequestException("Some participants are not in tenant");
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const session = await tx.warRoomSession.create({
          data: {
            companyId,
            explorationCaseId,
            facilitatorId: payload.facilitatorId,
            participants: payload.participants as object,
            deadline: new Date(payload.deadline),
            status: WarRoomStatus.ACTIVE,
          },
        });

        await tx.explorationCase.update({
          where: { id: explorationCaseId },
          data: { status: ExplorationCaseStatus.WAR_ROOM },
        });

        return session;
      });

      this.logMetric("open_war_room", startedAt, {
        companyId,
        explorationCaseId,
        warRoomSessionId: result.id,
        participantsCount: payload.participants.length,
      });
      return result;
    } catch (error) {
      this.logMetric(
        "open_war_room",
        startedAt,
        { companyId, explorationCaseId },
        error,
      );
      throw error;
    }
  }

  async closeWarRoomSession(
    companyId: string,
    warRoomSessionId: string,
    payload: {
      resolutionLog: unknown;
      status?: WarRoomStatus;
    },
  ) {
    const startedAt = Date.now();
    try {
      const session = await this.prisma.warRoomSession.findFirst({
        where: { id: warRoomSessionId, companyId },
        select: {
          id: true,
          explorationCaseId: true,
          participants: true,
          status: true,
        },
      });
      if (!session) {
        throw new NotFoundException(`War room session ${warRoomSessionId} not found`);
      }

      if (!payload.resolutionLog) {
        throw new BadRequestException("resolutionLog is required to close War Room");
      }

      const participants = Array.isArray(session.participants)
        ? (session.participants as Array<{ userId?: string; role?: string }>)
        : [];
      const decisionMakers = participants
        .filter((participant) => String(participant.role || "").toUpperCase() === "DECISION_MAKER")
        .map((participant) => String(participant.userId || "").trim())
        .filter(Boolean);

      if (decisionMakers.length > 0) {
        const decisions = await this.prisma.warRoomDecisionEvent.findMany({
          where: {
            companyId,
            warRoomSessionId,
            participantId: { in: decisionMakers },
          },
          select: { participantId: true },
        });
        const voted = new Set(decisions.map((decision) => decision.participantId));
        const missing = decisionMakers.filter((id) => !voted.has(id));
        if (missing.length > 0) {
          throw new BadRequestException(
            `All DECISION_MAKER participants must vote before close. Missing: ${missing.join(", ")}`,
          );
        }
      }

      const targetStatus = payload.status ?? WarRoomStatus.RESOLVED_WITH_DECISION;

      const result = await this.prisma.$transaction(async (tx) => {
        const closed = await tx.warRoomSession.update({
          where: { id: warRoomSessionId },
          data: {
            status: targetStatus,
            resolutionLog: payload.resolutionLog as object,
          },
        });

        if (targetStatus === WarRoomStatus.RESOLVED_WITH_DECISION) {
          await tx.explorationCase.update({
            where: { id: session.explorationCaseId },
            data: { status: ExplorationCaseStatus.ACTIVE_EXPLORATION },
          });
        }

        return closed;
      });

      this.logMetric("close_war_room", startedAt, {
        companyId,
        warRoomSessionId,
        status: targetStatus,
      });
      return result;
    } catch (error) {
      this.logMetric(
        "close_war_room",
        startedAt,
        { companyId, warRoomSessionId },
        error,
      );
      throw error;
    }
  }
}

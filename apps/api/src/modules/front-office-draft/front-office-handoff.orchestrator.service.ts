import { Injectable } from "@nestjs/common";
import { AuditService } from "../../shared/audit/audit.service";
import {
  FrontOfficeHandoffRecord,
  FrontOfficeHandoffStatus,
  FrontOfficeIntent,
} from "./front-office-draft.types";
import { FrontOfficeCommunicationRepository } from "../../shared/front-office/front-office-communication.repository";
import { FrontOfficeMetricsService } from "../../shared/front-office/front-office-metrics.service";

const CANONICAL_OWNER_ROLES = new Set([
  "crm_agent",
  "contracts_agent",
  "agronomist",
  "economist",
  "monitoring",
]);

function resolveOwnerRoute(targetOwnerRole: string | null | undefined): string | null {
  switch (targetOwnerRole) {
    case "crm_agent":
      return "/crm";
    case "contracts_agent":
      return "/commerce/contracts";
    case "agronomist":
      return "/front-office/tasks";
    case "economist":
      return "/finance";
    case "monitoring":
      return "/monitoring";
    default:
      return null;
  }
}

@Injectable()
export class FrontOfficeHandoffOrchestrator {
  constructor(
    private readonly audit: AuditService,
    private readonly communicationRepository: FrontOfficeCommunicationRepository,
    private readonly metrics: FrontOfficeMetricsService,
  ) {}

  async routeDraftHandoff(input: {
    companyId: string;
    userId?: string;
    threadId: string;
    draftId: string;
    traceId?: string;
    targetOwnerRole?: string | null;
    sourceIntent: FrontOfficeIntent;
    summary: string;
    evidence?: any[] | null;
  }): Promise<FrontOfficeHandoffRecord> {
    const targetOwnerRole = input.targetOwnerRole ?? null;
    const ownerRoute = resolveOwnerRoute(targetOwnerRole);
    const status: FrontOfficeHandoffStatus =
      targetOwnerRole && CANONICAL_OWNER_ROLES.has(targetOwnerRole)
        ? "ROUTED"
        : "MANUAL_REQUIRED";
    const nextAction =
      status === "ROUTED"
        ? `Открыть ${ownerRoute ?? "/front-office"} и забрать handoff в работу.`
        : "Нужен ручной разбор и назначение владельца в операторском workspace.";

    const handoff = await this.communicationRepository.createHandoff({
      companyId: input.companyId,
      threadId: input.threadId,
      draftId: input.draftId,
      traceId: input.traceId,
      targetOwnerRole,
      sourceIntent: input.sourceIntent,
      status,
      summary: input.summary,
      ownerRoute,
      nextAction,
      evidence: input.evidence ?? null,
      operatorNotes: [],
    });

    const thread = await this.communicationRepository.getThreadById(
      input.companyId,
      input.threadId,
    );
    await this.communicationRepository.upsertThread({
      companyId: input.companyId,
      threadKey: thread.threadKey,
      channel: thread.channel,
      currentOwnerRole: targetOwnerRole,
      currentHandoffStatus: status,
      lastDraftId: input.draftId,
    });

    await this.audit.log({
      action: "FRONT_OFFICE_HANDOFF_CREATED",
      companyId: input.companyId,
      userId: input.userId,
      metadata: {
        traceId: input.traceId ?? null,
        handoffId: handoff.id,
        draftId: input.draftId,
        targetOwnerRole,
        status,
        ownerRoute,
        sourceIntent: input.sourceIntent,
      },
    });

    this.metrics.recordHandoffCreated(input.companyId, handoff.id, handoff.createdAt);
    return handoff;
  }

  async claimHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
  ): Promise<FrontOfficeHandoffRecord> {
    const handoff = await this.communicationRepository.getHandoff(companyId, handoffId);
    const updatedNotes = this.appendNote(handoff, userId, "claim", "Handoff взят в работу.");
    const updated = await this.communicationRepository.updateHandoff(companyId, handoffId, {
      status: "CLAIMED",
      claimedBy: userId ?? null,
      claimedAt: new Date(),
      operatorNotes: updatedNotes,
      nextAction: "Подготовить owner-result и закрыть handoff после обработки.",
    });

    await this.touchThreadFromHandoff(companyId, updated);
    return updated;
  }

  async rejectHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    reason: string,
  ): Promise<FrontOfficeHandoffRecord> {
    const handoff = await this.communicationRepository.getHandoff(companyId, handoffId);
    const updatedNotes = this.appendNote(handoff, userId, "reject", reason);
    const updated = await this.communicationRepository.updateHandoff(companyId, handoffId, {
      status: "REJECTED",
      rejectionReason: reason,
      operatorNotes: updatedNotes,
      nextAction: "Нужно повторно классифицировать thread и переназначить owner.",
    });

    this.metrics.recordHandoffClosed(companyId, handoffId);
    await this.touchThreadFromHandoff(companyId, updated);
    return updated;
  }

  async resolveHandoff(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    ownerResultRef?: string,
    note?: string,
  ): Promise<FrontOfficeHandoffRecord> {
    const handoff = await this.communicationRepository.getHandoff(companyId, handoffId);
    const updatedNotes = this.appendNote(
      handoff,
      userId,
      "resolve",
      note ?? "Handoff обработан и закрыт.",
    );
    const updated = await this.communicationRepository.updateHandoff(companyId, handoffId, {
      status: "COMPLETED",
      ownerResultRef: ownerResultRef ?? handoff.ownerResultRef,
      resolvedBy: userId ?? null,
      resolvedAt: new Date(),
      operatorNotes: updatedNotes,
      nextAction: "Thread можно считать закрытым или ожидать следующий сигнал.",
    });

    this.metrics.recordHandoffResolved(companyId, handoffId, updated.resolvedAt);
    await this.touchThreadFromHandoff(companyId, updated);
    return updated;
  }

  async addManualNote(
    companyId: string,
    handoffId: string,
    userId: string | undefined,
    note: string,
  ): Promise<FrontOfficeHandoffRecord> {
    const handoff = await this.communicationRepository.getHandoff(companyId, handoffId);
    const updated = await this.communicationRepository.updateHandoff(companyId, handoffId, {
      operatorNotes: this.appendNote(handoff, userId, "manual_note", note),
    });
    return updated;
  }

  async getHandoff(companyId: string, handoffId: string) {
    return this.communicationRepository.getHandoff(companyId, handoffId);
  }

  async listHandoffs(companyId: string) {
    return this.communicationRepository.listHandoffs(companyId);
  }

  private appendNote(
    handoff: FrontOfficeHandoffRecord,
    userId: string | undefined,
    kind: "manual_note" | "claim" | "reject" | "resolve",
    note: string,
  ) {
    return [
      ...(handoff.operatorNotes ?? []),
      {
        at: new Date().toISOString(),
        by: userId ?? null,
        note,
        kind,
      },
    ];
  }

  private async touchThreadFromHandoff(
    companyId: string,
    handoff: FrontOfficeHandoffRecord,
  ) {
    const thread = await this.communicationRepository.getThreadById(companyId, handoff.threadId);
    await this.communicationRepository.upsertThread({
      companyId,
      threadKey: thread.threadKey,
      channel: thread.channel,
      currentOwnerRole: handoff.targetOwnerRole,
      currentHandoffStatus: handoff.status,
      lastDraftId: handoff.draftId,
    });
  }
}

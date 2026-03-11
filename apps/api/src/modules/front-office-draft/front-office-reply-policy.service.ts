import { Injectable } from "@nestjs/common";
import {
  FrontOfficeClientReplyMode,
  FrontOfficeDraftAnchor,
  FrontOfficeResolutionMode,
  FrontOfficeResponseRisk,
  FrontOfficeThreadRecord,
} from "./front-office-draft.types";

export interface FrontOfficeReplyDecision {
  rolloutMode: FrontOfficeClientReplyMode;
  resolutionMode: FrontOfficeResolutionMode;
  responseRisk: FrontOfficeResponseRisk;
  targetOwnerRole: string | null;
  missingContext: string[];
  directReplyAllowed: boolean;
  prohibitedReason: string | null;
  dialogSummary: string;
  managerShouldBeNotified: boolean;
  needsHumanAction: boolean;
}

@Injectable()
export class FrontOfficeReplyPolicyService {
  evaluate(input: {
    companyId: string;
    messageText: string;
    direction?: "inbound" | "outbound";
    classification?: string | null;
    targetOwnerRole?: string | null;
    confidence?: number | null;
    anchor: FrontOfficeDraftAnchor;
    thread: FrontOfficeThreadRecord;
    evidenceCount?: number;
  }): FrontOfficeReplyDecision {
    const messageText = input.messageText.trim();
    const normalized = messageText.toLowerCase();
    const targetOwnerRole = this.resolveTargetOwnerRole(
      input.targetOwnerRole,
      normalized,
    );
    const rolloutMode = this.resolveReplyMode(
      input.companyId,
      input.thread.farmAccountId,
    );
    const confidence = input.confidence ?? 0;
    const evidenceCount = input.evidenceCount ?? 0;
    const dialogSummary = this.buildDialogSummary(messageText, targetOwnerRole);

    if ((input.direction ?? "inbound") !== "inbound") {
      return {
        rolloutMode,
        resolutionMode: "PROCESS_DRAFT",
        responseRisk: "OPERATIONAL_SIGNAL",
        targetOwnerRole,
        missingContext: [],
        directReplyAllowed: false,
        prohibitedReason: "Исходящее сообщение не маршрутизируется как клиентский auto-reply.",
        dialogSummary,
        managerShouldBeNotified: false,
        needsHumanAction: false,
      };
    }

    if (this.isExplicitEscalation(normalized, input.classification)) {
      return {
        rolloutMode,
        resolutionMode: "HUMAN_HANDOFF",
        responseRisk: "ESCALATION_SIGNAL",
        targetOwnerRole: targetOwnerRole ?? "monitoring",
        missingContext: [],
        directReplyAllowed: false,
        prohibitedReason: "Выявлен тревожный или эскалационный паттерн.",
        dialogSummary,
        managerShouldBeNotified: true,
        needsHumanAction: true,
      };
    }

    const responsibleActionReason = this.detectResponsibleAction(normalized);
    if (responsibleActionReason) {
      return {
        rolloutMode,
        resolutionMode: "HUMAN_HANDOFF",
        responseRisk: "RESPONSIBLE_ACTION",
        targetOwnerRole,
        missingContext: [],
        directReplyAllowed: false,
        prohibitedReason: responsibleActionReason,
        dialogSummary,
        managerShouldBeNotified: true,
        needsHumanAction: true,
      };
    }

    if (
      targetOwnerRole === "crm_agent" &&
      !this.isReadOnlyCrmQuestion(normalized)
    ) {
      return {
        rolloutMode,
        resolutionMode: "HUMAN_HANDOFF",
        responseRisk: "RESPONSIBLE_ACTION",
        targetOwnerRole,
        missingContext: [],
        directReplyAllowed: false,
        prohibitedReason: "CRM-контекст не разрешён для прямого client-facing ответа.",
        dialogSummary,
        managerShouldBeNotified: true,
        needsHumanAction: true,
      };
    }

    if (this.isOperationalSignal(normalized, input.classification, evidenceCount)) {
      return {
        rolloutMode,
        resolutionMode: "PROCESS_DRAFT",
        responseRisk: "OPERATIONAL_SIGNAL",
        targetOwnerRole,
        missingContext: [],
        directReplyAllowed: false,
        prohibitedReason: null,
        dialogSummary,
        managerShouldBeNotified: false,
        needsHumanAction: false,
      };
    }

    const missingContext = this.resolveMissingContext(
      normalized,
      targetOwnerRole,
      input.anchor,
      input.thread,
      confidence,
    );
    if (missingContext.length > 0) {
      return {
        rolloutMode,
        resolutionMode: "REQUEST_CLARIFICATION",
        responseRisk: "INSUFFICIENT_CONTEXT",
        targetOwnerRole,
        missingContext,
        directReplyAllowed: false,
        prohibitedReason: "Недостаточно контекста для безопасного ответа.",
        dialogSummary,
        managerShouldBeNotified: false,
        needsHumanAction: false,
      };
    }

    const directReplyAllowed = rolloutMode === "pilot" || rolloutMode === "rollout";
    return {
      rolloutMode,
      resolutionMode: "AUTO_REPLY",
      responseRisk: "SAFE_INFORMATIONAL",
      targetOwnerRole,
      missingContext: [],
      directReplyAllowed,
      prohibitedReason: directReplyAllowed
        ? null
        : "Прямые client-facing ответы сейчас отключены rollout policy.",
      dialogSummary,
      managerShouldBeNotified: false,
      needsHumanAction: false,
    };
  }

  private resolveTargetOwnerRole(
    targetOwnerRole: string | null | undefined,
    normalized: string,
  ): string | null {
    if (targetOwnerRole) {
      return targetOwnerRole;
    }
    if (/(договор|контракт|счет|оплат|обязательств|срок)/i.test(normalized)) {
      return "contracts_agent";
    }
    if (/(регламент|политик|правил|документ|пункт договора|что означает)/i.test(normalized)) {
      return "knowledge";
    }
    if (/(бюджет|план[- ]?факт|марж|риск|затрат|урожайн|себестоим)/i.test(normalized)) {
      return "economist";
    }
    if (/(алерт|инцидент|сбой|критич|тревог)/i.test(normalized)) {
      return "monitoring";
    }
    if (/(поле|сезон|техкарт|урож|сзр|болезн|вредител|обработк|операци)/i.test(normalized)) {
      return "agronomist";
    }
    return "knowledge";
  }

  private resolveReplyMode(
    companyId: string,
    farmAccountId: string | null,
  ): FrontOfficeClientReplyMode {
    if (this.parseBooleanEnv("FRONT_OFFICE_CLIENT_REPLY_KILL_SWITCH", false)) {
      return "disabled";
    }

    const rawMode = (process.env.FRONT_OFFICE_CLIENT_REPLY_MODE ?? "rollout")
      .trim()
      .toLowerCase();
    const mode: FrontOfficeClientReplyMode =
      rawMode === "disabled" ||
      rawMode === "shadow" ||
      rawMode === "pilot" ||
      rawMode === "rollout"
        ? rawMode
        : "rollout";

    if (mode !== "pilot") {
      return mode;
    }

    const companyAllowlist = this.parseAllowlistEnv(
      "FRONT_OFFICE_CLIENT_REPLY_COMPANY_ALLOWLIST",
    );
    const farmAllowlist = this.parseAllowlistEnv(
      "FRONT_OFFICE_CLIENT_REPLY_FARM_ALLOWLIST",
    );
    if (companyAllowlist.size === 0 && farmAllowlist.size === 0) {
      return "pilot";
    }

    if (companyAllowlist.has(companyId)) {
      return "pilot";
    }

    if (farmAccountId && farmAllowlist.has(farmAccountId)) {
      return "pilot";
    }

    return "shadow";
  }

  private parseAllowlistEnv(name: string): Set<string> {
    const raw = process.env[name]?.trim();
    if (!raw) {
      return new Set<string>();
    }
    return new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }

  private parseBooleanEnv(name: string, fallback: boolean): boolean {
    const raw = process.env[name]?.trim().toLowerCase();
    if (!raw) {
      return fallback;
    }
    return ["1", "true", "yes", "on"].includes(raw);
  }

  private isExplicitEscalation(
    normalized: string,
    classification?: string | null,
  ): boolean {
    if (classification === "escalation_signal") {
      return true;
    }
    return /(срочно|эскалац|критич|авари|не работает|зависло|инцидент)/i.test(
      normalized,
    );
  }

  private detectResponsibleAction(normalized: string): string | null {
    if (
      /(измени|замени|разреши|согласуй|подтверди|утверди|перенеси|добавь|убери|скорректируй)/i.test(
        normalized,
      ) &&
      /(техкарт|норм|доз|препарат|обработк|операци|срок|дат)/i.test(normalized)
    ) {
      return "Запрос затрагивает изменение технологии или агро-исполнения.";
    }
    if (
      /(измени|согласуй|подтверди|подпиши|обнови|новую цену|скидк|тариф|стоимост|реквизит|оплат)/i.test(
        normalized,
      ) &&
      /(договор|контракт|цен|счет|сч[её]т|плат|реквизит|обязательств)/i.test(
        normalized,
      )
    ) {
      return "Запрос затрагивает договорные, ценовые или платёжные обязательства.";
    }
    if (
      /(обещай|гарантир|подтверди от rai|от лица компании|официально ответь)/i.test(
        normalized,
      )
    ) {
      return "Запрос требует обязательства от лица компании.";
    }
    return null;
  }

  private isOperationalSignal(
    normalized: string,
    classification: string | null | undefined,
    evidenceCount: number,
  ): boolean {
    if (evidenceCount > 0) {
      return true;
    }
    if (classification === "task_process") {
      return true;
    }
    return /(фиксир|наблюден|отклонени|не выполн|подтверждаю|не подтверждаю|фото|видео|голос|дождь|болезн|вредител)/i.test(
      normalized,
    );
  }

  private resolveMissingContext(
    normalized: string,
    targetOwnerRole: string | null,
    anchor: FrontOfficeDraftAnchor,
    thread: FrontOfficeThreadRecord,
    confidence: number,
  ): string[] {
    const missing = new Set<string>();

    if (!thread.farmAccountId) {
      missing.add("FARM_CONTEXT");
    }

    if (confidence < 0.58) {
      missing.add("INTENT_CONFIDENCE");
    }

    if (
      targetOwnerRole === "agronomist" &&
      /(поле|сезон|техкарт|операци|урож|отклонени)/i.test(normalized)
    ) {
      if (!anchor.fieldId) {
        missing.add("FIELD_CONTEXT");
      }
      if (!anchor.seasonId) {
        missing.add("SEASON_CONTEXT");
      }
    }

    if (
      targetOwnerRole === "economist" &&
      /(сезон|план[- ]?факт|бюджет|марж|себестоим|урожайн)/i.test(normalized) &&
      !anchor.seasonId
    ) {
      missing.add("SEASON_CONTEXT");
    }

    if (
      targetOwnerRole === "monitoring" &&
      /(поле|сезон|алерт|риск|сигнал)/i.test(normalized) &&
      !anchor.seasonId &&
      !anchor.fieldId
    ) {
      missing.add("FIELD_OR_SEASON_CONTEXT");
    }

    return [...missing];
  }

  private isReadOnlyCrmQuestion(normalized: string): boolean {
    return /(какой контакт|кто контакт|напомни контакт|какие реквизиты сохранены)/i.test(
      normalized,
    );
  }

  private buildDialogSummary(
    messageText: string,
    targetOwnerRole: string | null,
  ): string {
    const prefix = targetOwnerRole
      ? `Front-office router -> ${targetOwnerRole}`
      : "Front-office router";
    return `${prefix}: ${messageText.slice(0, 240)}`;
  }
}

import { ForbiddenException } from "@nestjs/common";
import { ExplorationCaseStatus } from "@rai/prisma-client";

export type ExplorationRole =
  | "INITIATOR"
  | "TRIAGE_OFFICER"
  | "SEU_BOARD"
  | "SOLVER";

const ALLOWED_TRANSITIONS: Record<
  ExplorationCaseStatus,
  Set<ExplorationCaseStatus>
> = {
  DRAFT: new Set(["IN_TRIAGE", "REJECTED"]),
  IN_TRIAGE: new Set(["BOARD_REVIEW", "REJECTED"]),
  BOARD_REVIEW: new Set(["ACTIVE_EXPLORATION", "REJECTED"]),
  ACTIVE_EXPLORATION: new Set(["WAR_ROOM", "IMPLEMENTED", "REJECTED"]),
  WAR_ROOM: new Set(["ACTIVE_EXPLORATION", "REJECTED"]),
  IMPLEMENTED: new Set(["POST_AUDIT", "REJECTED"]),
  POST_AUDIT: new Set(["ARCHIVED", "REJECTED"]),
  RESOLVED: new Set(["IMPLEMENTED", "REJECTED"]),
  REJECTED: new Set(),
  ARCHIVED: new Set(),
};

export function normalizeExplorationRole(input?: string): ExplorationRole {
  const normalized = String(input || "")
    .trim()
    .toUpperCase();
  switch (normalized) {
    case "TRIAGE_OFFICER":
      return "TRIAGE_OFFICER";
    case "SEU_BOARD":
      return "SEU_BOARD";
    case "SOLVER":
      return "SOLVER";
    default:
      return "INITIATOR";
  }
}

export class ExplorationStateMachine {
  canTransition(
    currentStatus: ExplorationCaseStatus,
    targetStatus: ExplorationCaseStatus,
    role: ExplorationRole,
  ): boolean {
    if (!ALLOWED_TRANSITIONS[currentStatus]?.has(targetStatus)) {
      return false;
    }

    if (targetStatus === "IN_TRIAGE") return role === "TRIAGE_OFFICER";
    if (targetStatus === "BOARD_REVIEW") return role === "TRIAGE_OFFICER";
    if (targetStatus === "ACTIVE_EXPLORATION")
      return role === "SEU_BOARD" || (currentStatus === "WAR_ROOM" && role === "SOLVER");
    if (targetStatus === "WAR_ROOM")
      return role === "SEU_BOARD" || role === "SOLVER";
    if (targetStatus === "IMPLEMENTED")
      return role === "SEU_BOARD" || role === "SOLVER";
    if (targetStatus === "POST_AUDIT") return role === "SEU_BOARD";
    if (targetStatus === "ARCHIVED") return role === "SEU_BOARD";
    if (targetStatus === "REJECTED")
      return role === "TRIAGE_OFFICER" || role === "SEU_BOARD";

    return true;
  }

  validateTransition(
    currentStatus: ExplorationCaseStatus,
    targetStatus: ExplorationCaseStatus,
    role: ExplorationRole,
  ): void {
    if (!this.canTransition(currentStatus, targetStatus, role)) {
      throw new ForbiddenException(
        `Illegal transition: ${currentStatus} -> ${targetStatus} for role ${role}`,
      );
    }
  }
}


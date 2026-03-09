import { Injectable } from "@nestjs/common";
import { UserRole } from "@rai/prisma-client";
import type { ToolRiskLevel } from "../tools/rai-tools.types";

export type RiskPolicyDomain =
  | "agro"
  | "finance"
  | "risk"
  | "knowledge"
  | "crm"
  | "front_office";

export type RiskPolicyVerdict =
  | "ALLOWED"
  | "REQUIRES_USER_CONFIRMATION"
  | "REQUIRES_DIRECTOR_CONFIRMATION"
  | "REQUIRES_TWO_PERSON_APPROVAL";

@Injectable()
export class RiskPolicyEngineService {
  /**
   * Матрица §6.1: riskLevel × domain × role → verdict.
   * companyId не из payload — только из контекста (SECURITY_CANON).
   */
  evaluate(
    riskLevel: ToolRiskLevel,
    domain: RiskPolicyDomain,
    userRole: UserRole | undefined,
  ): RiskPolicyVerdict {
    if (riskLevel === "READ") {
      return "ALLOWED";
    }
    if (riskLevel === "CRITICAL") {
      return "REQUIRES_TWO_PERSON_APPROVAL";
    }
    // WRITE
    if (domain === "agro") {
      if (userRole === UserRole.AGRONOMIST || userRole === UserRole.MANAGER || userRole === UserRole.ADMIN) {
        return "REQUIRES_USER_CONFIRMATION";
      }
      return "REQUIRES_USER_CONFIRMATION"; // operator/other — то же, один подтверждающий
    }
    if (domain === "finance") {
      return "REQUIRES_DIRECTOR_CONFIRMATION";
    }
    if (domain === "risk") {
      return "REQUIRES_USER_CONFIRMATION";
    }
    if (domain === "crm") {
      return "REQUIRES_USER_CONFIRMATION";
    }
    if (domain === "front_office") {
      return "REQUIRES_USER_CONFIRMATION";
    }
    return "ALLOWED"; // knowledge WRITE (нет таких тулов пока)
  }

  isDirector(role: UserRole | undefined): boolean {
    if (!role) return false;
    return role === UserRole.CEO || role === UserRole.CFO || role === UserRole.ADMIN;
  }
}

import { Injectable } from "@nestjs/common";
import type { CropForm, CropZone, RegionProfile, Season, SoilProfile } from "@rai/prisma-client";
import { randomUUID } from "crypto";
import type { FieldAdmissionEvaluation } from "./tech-map-generation.types";

type AdmissionContext = {
  cropZone: CropZone;
  season: Season;
  soilProfile: SoilProfile | null;
  regionProfile: RegionProfile | null;
  cropForm?: CropForm | null;
};

const CRUCIFER_PREDECESSORS = [
  "rapeseed",
  "mustard",
  "cabbage",
  "turnip",
  "canola",
];

function readNumber(record: unknown, key: string): number | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const value = (record as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(record: unknown, key: string): boolean | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const value = (record as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}

@Injectable()
export class FieldAdmissionService {
  evaluate(context: AdmissionContext): FieldAdmissionEvaluation {
    const blockers = [];
    const requirements = [];
    const recommendations = [];

    const hardBlockerMode = this.resolveMode(
      process.env.TECHMAP_RAPESEED_ADMISSION_BLOCKERS_MODE,
      "blocking",
    );
    const hardRequirementMode = this.resolveMode(
      process.env.TECHMAP_RAPESEED_ADMISSION_REQUIREMENTS_MODE,
      "report_only",
    );

    const ph = context.soilProfile?.ph ?? null;
    if (ph == null) {
      requirements.push(this.issue("R-ADM-001", "HARD_REQUIREMENT", hardRequirementMode, "Отсутствует pH почвы для admission-проверки.", false));
    } else if (ph < 5.5) {
      blockers.push(this.issue("R-ADM-001", "HARD_BLOCKER", hardBlockerMode, "pH ниже 5.5 блокирует генерацию рапсовой техкарты.", hardBlockerMode === "blocking", { ph }));
    } else if (ph < 6.0) {
      requirements.push(this.issue("R-ADM-002", "HARD_REQUIREMENT", hardRequirementMode, "pH в зоне коррекции требует remediation-плана до генерации.", hardRequirementMode === "blocking", { ph }));
    }

    const rotationYears =
      readNumber(context.cropZone.assumptions, "rotationYearsSinceRapeseed") ??
      readNumber(context.cropZone.constraints, "rotationYearsSinceRapeseed");
    if (rotationYears == null) {
      requirements.push(this.issue("R-ADM-003", "HARD_REQUIREMENT", hardRequirementMode, "Нет подтверждённого значения rotationYearsSinceRapeseed.", false));
    } else if (rotationYears < 4) {
      blockers.push(this.issue("R-ADM-003", "HARD_BLOCKER", hardBlockerMode, "Рапс в севообороте раньше 4 лет блокирует генерацию.", hardBlockerMode === "blocking", { rotationYears }));
    }

    const predecessor = String(context.cropZone.predecessorCrop ?? "").trim().toLowerCase();
    if (!predecessor) {
      requirements.push(this.issue("R-ADM-004", "HARD_REQUIREMENT", hardRequirementMode, "Не указан предшественник поля.", false));
    } else if (CRUCIFER_PREDECESSORS.some((item) => predecessor.includes(item))) {
      blockers.push(this.issue("R-ADM-004", "HARD_BLOCKER", hardBlockerMode, "Крестоцветный предшественник блокирует рапсовую генерацию.", hardBlockerMode === "blocking", { predecessor }));
    }

    const clubrootHistory =
      readBoolean(context.cropZone.assumptions, "clubrootHistory") ??
      readBoolean(context.cropZone.constraints, "clubrootHistory");
    const yearsSinceClubroot =
      readNumber(context.cropZone.assumptions, "yearsSinceClubroot") ??
      readNumber(context.cropZone.constraints, "yearsSinceClubroot");
    if (clubrootHistory === true && (yearsSinceClubroot == null || yearsSinceClubroot < 7)) {
      blockers.push(this.issue("R-ADM-005", "HARD_BLOCKER", hardBlockerMode, "История килы в пределах 7 лет блокирует генерацию.", hardBlockerMode === "blocking", { yearsSinceClubroot }));
    }

    if (context.soilProfile?.sMgKg == null) {
      requirements.push(this.issue("R-NUT-001", "HARD_REQUIREMENT", hardRequirementMode, "Нет значения S_available для rapeseed admission.", false));
    }
    if (context.soilProfile?.bMgKg == null) {
      requirements.push(this.issue("R-NUT-002", "HARD_REQUIREMENT", hardRequirementMode, "Нет значения B_available для rapeseed admission.", false));
    }
    if (!context.regionProfile?.satAvg) {
      requirements.push(this.issue("R-BRANCH-001", "HARD_REQUIREMENT", hardRequirementMode, "Нет SAT_avg для explainable branch selection.", false));
    }

    recommendations.push(
      this.issue(
        "R-ADM-EXPLAINABILITY",
        "STRONG_RECOMMENDATION",
        "advisory",
        "Трассировка допуска поля должна сохраняться и быть доступна через explainability read-path.",
        false,
      ),
    );

    const isBlocking = blockers.some((issue) => issue.blocking);

    return {
      traceId: `adm-${randomUUID()}`,
      verdict: isBlocking
        ? "FAIL"
        : requirements.length > 0
          ? "PASS_WITH_REQUIREMENTS"
          : "PASS",
      cropForm: context.cropForm ?? null,
      isBlocking,
      blockers,
      requirements,
      recommendations,
      rolloutPolicy: {
        hardBlocker: hardBlockerMode,
        hardRequirement: hardRequirementMode,
        strongRecommendation: "advisory",
      },
    };
  }

  private resolveMode(value: string | undefined, fallback: "blocking" | "report_only") {
    return value === "blocking" || value === "report_only" ? value : fallback;
  }

  private issue(
    ruleId: string,
    severity: "HARD_BLOCKER" | "HARD_REQUIREMENT" | "STRONG_RECOMMENDATION",
    enforcementMode: "blocking" | "report_only" | "advisory",
    message: string,
    blocking: boolean,
    payload?: Record<string, unknown>,
  ) {
    return {
      ruleId,
      severity,
      enforcementMode,
      message,
      blocking,
      evidenceRequired: blocking,
      payload,
    };
  }
}

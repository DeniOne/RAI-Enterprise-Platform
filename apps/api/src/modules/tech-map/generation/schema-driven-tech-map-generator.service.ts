import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { CropForm } from "@rai/prisma-client";
import {
  getCanonicalBranchStages,
  getCanonicalControlPoints,
  getCanonicalMandatoryBlocks,
  getCanonicalMonitoringSignals,
  getCanonicalRuleBindings,
  getCanonicalThresholdBindings,
} from "./canonical-rapeseed-core.constants";
import type {
  CanonicalBranchId,
  CanonicalGenerationBundle,
  CropFormResolution,
  FieldAdmissionEvaluation,
  RecommendationDraft,
} from "./tech-map-generation.types";

type SchemaGeneratorContext = {
  cropFormResolution: CropFormResolution;
  targetYieldTHa: number | null;
  fieldAdmission: FieldAdmissionEvaluation;
};

@Injectable()
export class SchemaDrivenTechMapGenerator {
  generate(context: SchemaGeneratorContext): CanonicalGenerationBundle {
    const branch = context.cropFormResolution.canonicalBranch;
    const stages = this.scaleStages(
      getCanonicalBranchStages(branch),
      context.targetYieldTHa,
    );
    const mandatoryBlocks = getCanonicalMandatoryBlocks(branch);
    const controlPoints = getCanonicalControlPoints(branch);
    const monitoringSignals = getCanonicalMonitoringSignals(branch);
    const attachedRules = getCanonicalRuleBindings(branch);
    const attachedThresholds = getCanonicalThresholdBindings(branch);
    const recommendations = this.buildRecommendations(
      context.cropFormResolution.cropForm,
      branch,
      context.fieldAdmission,
    );

    return {
      crop: "rapeseed",
      cropForm: context.cropFormResolution.cropForm,
      canonicalBranch: branch,
      stages,
      controlPoints,
      monitoringSignals,
      attachedRules,
      attachedThresholds,
      mandatoryBlocks,
      recommendations,
      decisionGates: [],
      generationTraceId: `gen-trace-${randomUUID()}`,
      explainabilitySummary: {
        cropForm: context.cropFormResolution.cropForm,
        canonicalBranch: branch,
        branchSelectionReasons: context.cropFormResolution.reasons,
        mandatoryBlocks,
        admissionVerdict: context.fieldAdmission.verdict,
      },
    };
  }

  private scaleStages(
    stages: ReturnType<typeof getCanonicalBranchStages>,
    targetYieldTHa: number | null,
  ) {
    const multiplier =
      targetYieldTHa && Number.isFinite(targetYieldTHa)
        ? Math.max(0.85, 1 + (targetYieldTHa - 3.5) * 0.08)
        : 1;

    return stages.map((stage) => ({
      ...stage,
      operations: stage.operations.map((operation) => ({
        ...operation,
        resources: operation.resources.map((resource) => ({
          ...resource,
          amount: Number((resource.amount * multiplier).toFixed(2)),
        })),
      })),
    }));
  }

  private buildRecommendations(
    cropForm: CropForm,
    branch: CanonicalBranchId,
    admission: FieldAdmissionEvaluation,
  ): RecommendationDraft[] {
    const items: RecommendationDraft[] = admission.requirements.map((issue) => ({
      severity: issue.severity,
      code: issue.ruleId,
      title: "Требование допуска",
      message: issue.message,
      rationale: issue.payload ?? null,
    }));

    items.push({
      severity: "INFO",
      code: "CANONICAL_BRANCH",
      title: "Выбрана каноническая ветка",
      message: `Для генерации выбран ${cropForm} / ${branch}.`,
      rationale: {
        branch,
        cropForm,
      },
    });

    return items;
  }
}

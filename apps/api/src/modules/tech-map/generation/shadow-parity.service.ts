import { Injectable } from "@nestjs/common";
import type { TechMapBlueprint } from "../tech-map-blueprint";
import type {
  CanonicalGenerationBundle,
  GenerationStrategyName,
  ShadowParityDiff,
  ShadowParityReport,
} from "./tech-map-generation.types";

@Injectable()
export class ShadowParityService {
  private resolveLegacyCoverageSeverity(params: {
    authoritativeStrategy: GenerationStrategyName;
    referenceStrategy: GenerationStrategyName;
    preferredSeverity: "P0" | "P1" | "P2";
    code: string;
  }) {
    const isLegacyCoverageGap =
      params.code.startsWith("stage:") ||
      params.code.startsWith("stage_sequence:") ||
      params.code.startsWith("critical_op:");

    if (
      isLegacyCoverageGap &&
      params.preferredSeverity === "P0" &&
      params.authoritativeStrategy === "canonical_schema" &&
      params.referenceStrategy === "blueprint_fallback"
    ) {
      return "P1" as const;
    }

    return params.preferredSeverity;
  }

  compare(params: {
    canonical: CanonicalGenerationBundle;
    blueprint: TechMapBlueprint;
    authoritativeStrategy: GenerationStrategyName;
    referenceStrategy: GenerationStrategyName;
    legacyContext?: {
      cropForm?: string | null;
      canonicalBranch?: string | null;
    };
  }): ShadowParityReport {
    const diffs: ShadowParityDiff[] = [];
    const blueprintStageNames = new Set(params.blueprint.stages.map((stage) => stage.name));
    const blueprintStageIds = new Set(
      params.blueprint.stages.map((stage) => stage.aplStageId),
    );
    const blueprintStageSequenceById = new Map(
      params.blueprint.stages.map((stage) => [stage.aplStageId, stage.sequence]),
    );
    const blueprintOperationNames = new Set(
      params.blueprint.stages.flatMap((stage) =>
        stage.operations.map((operation) => operation.name),
      ),
    );
    const blueprintResourceKeys = new Set(
      params.blueprint.stages.flatMap((stage) =>
        stage.operations.flatMap((operation) =>
          operation.resources.map((resource) =>
            `${resource.type}:${resource.name}`.toLowerCase(),
          ),
        ),
      ),
    );

    if (
      params.legacyContext?.cropForm &&
      params.legacyContext.cropForm !== params.canonical.cropForm
    ) {
      diffs.push({
        severity: "P0",
        code: "crop_form_mismatch",
        message: "Legacy path и canonical path расходятся по cropForm.",
      });
    }

    if (
      params.legacyContext?.canonicalBranch &&
      params.legacyContext.canonicalBranch !== params.canonical.canonicalBranch
    ) {
      diffs.push({
        severity: "P0",
        code: "canonical_branch_mismatch",
        message: "Legacy path и canonical path расходятся по canonicalBranch.",
      });
    }

    if (!params.canonical.cropForm) {
      diffs.push({
        severity: "P0",
        code: "missing_crop_form",
        message: "Canonical output не содержит cropForm.",
      });
    }

    for (const stage of params.canonical.stages) {
      const stageCovered =
        blueprintStageIds.has(stage.aplStageId) || blueprintStageNames.has(stage.name);

      if (!stageCovered) {
        diffs.push({
          severity: this.resolveLegacyCoverageSeverity({
            authoritativeStrategy: params.authoritativeStrategy,
            referenceStrategy: params.referenceStrategy,
            preferredSeverity: stage.sequence <= 3 ? "P0" : "P1",
            code: `stage:${stage.code}`,
          }),
          code: `stage:${stage.code}`,
          message: `Legacy blueprint не покрывает каноническую стадию ${stage.name}.`,
        });
        continue;
      }

      const blueprintSequence = blueprintStageSequenceById.get(stage.aplStageId);
      if (
        blueprintSequence != null &&
        Math.abs(blueprintSequence - stage.sequence) > 1
      ) {
        diffs.push({
          severity: this.resolveLegacyCoverageSeverity({
            authoritativeStrategy: params.authoritativeStrategy,
            referenceStrategy: params.referenceStrategy,
            preferredSeverity: stage.sequence <= 3 ? "P0" : "P1",
            code: `stage_sequence:${stage.code}`,
          }),
          code: `stage_sequence:${stage.code}`,
          message: `Legacy blueprint нарушает ожидаемый порядок для стадии ${stage.name}.`,
        });
      }

      if (Array.isArray(stage.bbchScope) && stage.bbchScope.length > 0 && !blueprintStageIds.has(stage.aplStageId)) {
        diffs.push({
          severity: "P1",
          code: `bbch_stage:${stage.code}`,
          message: `Для стадии ${stage.name} нет stage-level покрытия BBCH через matching aplStageId.`,
        });
      }
    }

    for (const mandatoryBlock of params.canonical.mandatoryBlocks) {
      const covered = params.canonical.stages.some((stage) =>
        stage.operations.some((operation) => operation.code === mandatoryBlock),
      );
      if (!covered) {
        diffs.push({
          severity: "P0",
          code: `mandatory_block:${mandatoryBlock}`,
          message: `Канонический mandatory block ${mandatoryBlock} не materialized.`,
        });
      }
    }

    for (const operation of params.canonical.stages.flatMap((stage) => stage.operations)) {
      if (operation.isCritical && !blueprintOperationNames.has(operation.name)) {
        diffs.push({
          severity: this.resolveLegacyCoverageSeverity({
            authoritativeStrategy: params.authoritativeStrategy,
            referenceStrategy: params.referenceStrategy,
            preferredSeverity: "P0",
            code: `critical_op:${operation.code}`,
          }),
          code: `critical_op:${operation.code}`,
          message: `Legacy blueprint не покрывает критичную каноническую операцию ${operation.name}.`,
        });
      }

      if (
        operation.isCritical &&
        (operation.bbchWindowFrom != null || operation.bbchWindowTo != null) &&
        !blueprintOperationNames.has(operation.name)
      ) {
        diffs.push({
          severity: "P1",
          code: `bbch_operation:${operation.code}`,
          message: `Legacy blueprint не покрывает критичную BBCH-привязанную операцию ${operation.name}.`,
        });
      }

      for (const resource of operation.resources) {
        const resourceKey = `${resource.type}:${resource.name}`.toLowerCase();
        if (operation.isCritical && !blueprintResourceKeys.has(resourceKey)) {
          diffs.push({
            severity: "P1",
            code: `resource:${operation.code}:${resource.type}`,
            message: `Legacy blueprint не покрывает критичный ресурс ${resource.name} для операции ${operation.name}.`,
          });
        }
      }
    }

    if (params.canonical.controlPoints.length === 0) {
      diffs.push({
        severity: "P1",
        code: "missing_control_points",
        message: "Canonical output не содержит control points.",
      });
    }
    for (const controlPoint of params.canonical.controlPoints) {
      const stageExists = params.canonical.stages.some(
        (stage) => stage.code === controlPoint.stageCode,
      );
      if (!stageExists) {
        diffs.push({
          severity: "P1",
          code: `control_point_stage:${controlPoint.stageCode}`,
          message: `Control point ${controlPoint.name} ссылается на отсутствующую стадию.`,
        });
      }
    }

    if (params.canonical.monitoringSignals.length === 0) {
      diffs.push({
        severity: "P1",
        code: "missing_monitoring_signals",
        message: "Canonical output не содержит monitoring signals.",
      });
    }
    for (const signal of params.canonical.monitoringSignals) {
      if (!signal.thresholdLogic) {
        diffs.push({
          severity: "P1",
          code: `monitoring_threshold:${signal.signalType}`,
          message: `Monitoring signal ${signal.signalType} не содержит thresholdLogic.`,
        });
      }
      if (!signal.resultingAction) {
        diffs.push({
          severity: "P2",
          code: `monitoring_action:${signal.signalType}`,
          message: `Monitoring signal ${signal.signalType} не содержит resultingAction.`,
        });
      }
    }

    if (params.canonical.attachedRules.length === 0) {
      diffs.push({
        severity: "P1",
        code: "missing_rule_bindings",
        message: "Canonical output не содержит attached rules.",
      });
    }
    for (const binding of params.canonical.attachedRules) {
      if (!this.isBindingRefCovered(params.canonical, binding.appliesTo, binding.ref)) {
        diffs.push({
          severity: "P1",
          code: `rule_ref:${binding.ruleId}`,
          message: `Rule binding ${binding.ruleId} ссылается на отсутствующий объект ${binding.ref}.`,
        });
      }
    }

    if (params.canonical.attachedThresholds.length === 0) {
      diffs.push({
        severity: "P1",
        code: "missing_threshold_bindings",
        message: "Canonical output не содержит attached thresholds.",
      });
    }
    for (const threshold of params.canonical.attachedThresholds) {
      if (!this.isThresholdRefCovered(params.canonical, threshold.ref)) {
        diffs.push({
          severity: "P1",
          code: `threshold_ref:${threshold.thresholdId}`,
          message: `Threshold binding ${threshold.thresholdId} ссылается на отсутствующий объект ${threshold.ref}.`,
        });
      }
    }

    if (!params.canonical.generationTraceId) {
      diffs.push({
        severity: "P0",
        code: "missing_generation_trace",
        message: "Canonical output не содержит generation trace id.",
      });
    }

    if (
      !params.canonical.explainabilitySummary ||
      Object.keys(params.canonical.explainabilitySummary).length === 0
    ) {
      diffs.push({
        severity: "P1",
        code: "missing_explainability_summary",
        message: "Canonical output не содержит explainability summary.",
      });
    }

    return {
      traceId: `shadow:${params.canonical.generationTraceId}`,
      authoritativeStrategy: params.authoritativeStrategy,
      referenceStrategy: params.referenceStrategy,
      diffs,
      hasBlockingDiffs: diffs.some((diff) => diff.severity === "P0"),
      completeness: {
        generationTracePresent: Boolean(params.canonical.generationTraceId),
        explainabilitySummaryPresent:
          Boolean(params.canonical.explainabilitySummary) &&
          Object.keys(params.canonical.explainabilitySummary).length > 0,
        mandatoryBlocksCovered: params.canonical.mandatoryBlocks.length > 0,
        controlPointsCovered: params.canonical.controlPoints.length > 0,
        ruleBindingsCovered: params.canonical.attachedRules.length > 0,
        thresholdBindingsCovered: params.canonical.attachedThresholds.length > 0,
        monitoringSignalsCovered: params.canonical.monitoringSignals.length > 0,
        resourceCoveragePresent:
          params.canonical.stages.some((stage) =>
            stage.operations.some((operation) => operation.resources.length > 0),
          ),
      },
    };
  }

  private isBindingRefCovered(
    canonical: CanonicalGenerationBundle,
    appliesTo: "admission" | "stage" | "operation" | "control_point",
    ref: string,
  ) {
    if (appliesTo === "admission") {
      return ref === "field_admission";
    }
    if (appliesTo === "stage") {
      return canonical.stages.some((stage) => stage.code === ref);
    }
    if (appliesTo === "operation") {
      return canonical.stages.some((stage) =>
        stage.operations.some((operation) => operation.code === ref),
      );
    }
    return canonical.controlPoints.some((controlPoint) => controlPoint.name === ref);
  }

  private isThresholdRefCovered(canonical: CanonicalGenerationBundle, ref: string) {
    return (
      canonical.stages.some((stage) => stage.code === ref) ||
      canonical.stages.some((stage) =>
        stage.operations.some((operation) => operation.code === ref),
      ) ||
      canonical.controlPoints.some((controlPoint) => controlPoint.name === ref)
    );
  }
}

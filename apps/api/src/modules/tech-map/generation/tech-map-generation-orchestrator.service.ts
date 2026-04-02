import { Injectable } from "@nestjs/common";
import type { CropType, CropZone, RegionProfile, Season, SoilProfile } from "@rai/prisma-client";
import { buildTechMapBlueprint, type TechMapBlueprint } from "../tech-map-blueprint";
import { BranchSelectionService } from "./branch-selection.service";
import {
  RAPESEED_GENERATOR_VERSION,
  RAPESEED_ONTOLOGY_VERSION,
  RAPESEED_RULE_REGISTRY_VERSION,
  RAPESEED_SCHEMA_VERSION,
} from "./canonical-rapeseed-core.constants";
import { FieldAdmissionService } from "./field-admission.service";
import { SchemaDrivenTechMapGenerator } from "./schema-driven-tech-map-generator.service";
import { ShadowParityService } from "./shadow-parity.service";
import type {
  GeneratedTechMapBundle,
  GenerationStrategyName,
  ShadowParityReport,
} from "./tech-map-generation.types";

type OrchestratorContext = {
  cropType: CropType;
  cropZone: CropZone;
  season: Season;
  soilProfile: SoilProfile | null;
  regionProfile: RegionProfile | null;
};

@Injectable()
export class TechMapGenerationOrchestratorService {
  constructor(
    private readonly fieldAdmissionService: FieldAdmissionService,
    private readonly branchSelectionService: BranchSelectionService,
    private readonly schemaDrivenGenerator: SchemaDrivenTechMapGenerator,
    private readonly shadowParityService: ShadowParityService,
  ) {}

  orchestrate(context: OrchestratorContext): GeneratedTechMapBundle {
    const crop = String(context.cropType ?? "RAPESEED").toLowerCase();
    const blueprint = buildTechMapBlueprint({
      crop,
      seasonYear: context.season.year,
      seasonStartDate: context.season.startDate,
      targetYieldTHa: context.cropZone.targetYieldTHa,
    });

    if (crop !== "rapeseed") {
      return this.buildLegacyBundle(blueprint, "legacy", context.cropZone.companyId, null);
    }

    const cropFormResolution = this.branchSelectionService.select({
      cropZone: context.cropZone,
      season: context.season,
      regionProfile: context.regionProfile,
    });
    const admission = this.fieldAdmissionService.evaluate({
      cropZone: context.cropZone,
      season: context.season,
      soilProfile: context.soilProfile,
      regionProfile: context.regionProfile,
      cropForm: cropFormResolution.cropForm,
    });
    const canonical = this.schemaDrivenGenerator.generate({
      cropFormResolution,
      targetYieldTHa: context.cropZone.targetYieldTHa ?? context.season.expectedYield ?? null,
      fieldAdmission: admission,
    });
    const mode = this.resolveMode(context.cropZone.companyId);

    if (mode === "legacy") {
      return this.buildLegacyBundle(blueprint, "legacy", context.cropZone.companyId, {
        cropForm: cropFormResolution.cropForm,
        canonicalBranch: canonical.canonicalBranch,
        fieldAdmission: admission,
        canonical,
        shadow: this.shadowParityService.compare({
          canonical,
          blueprint,
          authoritativeStrategy: "legacy_blueprint",
          referenceStrategy: "canonical_schema",
          legacyContext: {
            cropForm: cropFormResolution.cropForm,
            canonicalBranch: canonical.canonicalBranch,
          },
        }),
      });
    }

    const shadowParityReport = this.shadowParityService.compare({
      canonical,
      blueprint,
      authoritativeStrategy:
        mode === "canonical" ? "canonical_schema" : "legacy_blueprint",
      referenceStrategy:
        mode === "canonical" ? "blueprint_fallback" : "canonical_schema",
      legacyContext: {
        cropForm: cropFormResolution.cropForm,
        canonicalBranch: canonical.canonicalBranch,
      },
    });

    if (mode === "shadow") {
      return this.buildLegacyBundle(blueprint, mode, context.cropZone.companyId, {
        cropForm: cropFormResolution.cropForm,
        canonicalBranch: canonical.canonicalBranch,
        fieldAdmission: admission,
        canonical,
        shadow: shadowParityReport,
      });
    }

    return {
      crop: canonical.crop,
      cropForm: canonical.cropForm,
      canonicalBranch: canonical.canonicalBranch,
      generationStrategy: "canonical_schema",
      generatorVersion: RAPESEED_GENERATOR_VERSION,
      stages: canonical.stages,
      controlPoints: canonical.controlPoints,
      monitoringSignals: canonical.monitoringSignals,
      attachedRules: canonical.attachedRules,
      attachedThresholds: canonical.attachedThresholds,
      mandatoryBlocks: canonical.mandatoryBlocks,
      fieldAdmission: admission,
      recommendations: canonical.recommendations,
      decisionGates: canonical.decisionGates,
      generationMetadata: {
        source: "canonical-rapeseed-core",
        generationStrategy: "canonical_schema",
        schemaVersion: RAPESEED_SCHEMA_VERSION,
        ruleRegistryVersion: RAPESEED_RULE_REGISTRY_VERSION,
        ontologyVersion: RAPESEED_ONTOLOGY_VERSION,
        generationTraceId: canonical.generationTraceId,
        generatorVersion: RAPESEED_GENERATOR_VERSION,
        canonicalBranch: canonical.canonicalBranch,
        cropForm: canonical.cropForm,
        featureFlagSnapshot: this.buildFeatureFlagSnapshot(mode, context.cropZone.companyId),
        rolloutMode: mode,
        fallbackUsed: false,
        fallbackReason: null,
        shadowParityReport,
        shadowParitySummary: this.buildShadowParitySummary(shadowParityReport),
        generatedAt: new Date().toISOString(),
      },
      explainabilitySummary: canonical.explainabilitySummary,
      shadowParityReport,
    };
  }

  private buildLegacyBundle(
    blueprint: TechMapBlueprint,
    mode: "legacy" | "shadow",
    companyId: string | null,
    rapeseedContext: null | {
      cropForm: GeneratedTechMapBundle["cropForm"];
      canonicalBranch: GeneratedTechMapBundle["canonicalBranch"];
      fieldAdmission: GeneratedTechMapBundle["fieldAdmission"];
      canonical: ReturnType<SchemaDrivenTechMapGenerator["generate"]>;
      shadow: GeneratedTechMapBundle["shadowParityReport"];
    },
  ): GeneratedTechMapBundle {
    const stages = blueprint.stages.map((stage) => ({
      code: stage.aplStageId || `legacy-stage-${stage.sequence}`,
      name: stage.name,
      sequence: stage.sequence,
      aplStageId: stage.aplStageId ?? `LEGACY_${stage.sequence}`,
      stageGoal: null,
      bbchScope: null,
      operations: stage.operations.map((operation, index) => ({
        code: `${stage.sequence}_${index + 1}_${operation.name}`.replace(/\s+/g, "_").toLowerCase(),
        name: operation.name,
        description: operation.description,
        operationType: null,
        startOffsetDays: operation.startOffsetDays,
        durationHours: operation.durationHours,
        isCritical: operation.isCritical ?? false,
        resources: operation.resources,
      })),
    }));

    const baseMetadata = {
      ...blueprint.generationMetadata,
      generationStrategy: "legacy_blueprint",
      schemaVersion: RAPESEED_SCHEMA_VERSION,
      ruleRegistryVersion: RAPESEED_RULE_REGISTRY_VERSION,
      ontologyVersion: RAPESEED_ONTOLOGY_VERSION,
      generationTraceId: rapeseedContext?.canonical.generationTraceId ?? `legacy-trace:${Date.now()}`,
      generatorVersion: RAPESEED_GENERATOR_VERSION,
      featureFlagSnapshot: this.buildFeatureFlagSnapshot(mode, companyId),
      rolloutMode: mode,
      fallbackUsed: true,
      fallbackReason:
        mode === "shadow"
          ? "shadow_authoritative_legacy"
          : "rollout_legacy_default",
      cropForm: rapeseedContext?.cropForm ?? null,
      canonicalBranch: rapeseedContext?.canonicalBranch ?? null,
      shadowParityReport: rapeseedContext?.shadow ?? null,
      shadowParitySummary: this.buildShadowParitySummary(rapeseedContext?.shadow ?? null),
    };

    return {
      crop: blueprint.crop,
      cropForm: rapeseedContext?.cropForm ?? null,
      canonicalBranch: rapeseedContext?.canonicalBranch ?? null,
      generationStrategy: "legacy_blueprint",
      generatorVersion: RAPESEED_GENERATOR_VERSION,
      stages,
      controlPoints: rapeseedContext?.canonical.controlPoints ?? [],
      monitoringSignals: rapeseedContext?.canonical.monitoringSignals ?? [],
      attachedRules: rapeseedContext?.canonical.attachedRules ?? [],
      attachedThresholds: rapeseedContext?.canonical.attachedThresholds ?? [],
      mandatoryBlocks: rapeseedContext?.canonical.mandatoryBlocks ?? [],
      fieldAdmission: rapeseedContext?.fieldAdmission ?? null,
      recommendations: rapeseedContext?.canonical.recommendations ?? [],
      decisionGates: rapeseedContext?.canonical.decisionGates ?? [],
      generationMetadata: baseMetadata,
      explainabilitySummary: {
        source: "legacy_blueprint",
        canonicalContextApplied: Boolean(rapeseedContext),
        branchSelectionReasons:
          rapeseedContext?.canonical.explainabilitySummary.branchSelectionReasons ?? [],
      },
      shadowParityReport: rapeseedContext?.shadow ?? null,
    };
  }

  private resolveMode(companyId: string | null): "legacy" | "shadow" | "canonical" {
    const mode = process.env.TECHMAP_RAPESEED_CANONICAL_MODE ?? "shadow";
    const companies = (process.env.TECHMAP_RAPESEED_CANONICAL_COMPANIES ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (companies.length > 0 && companyId && !companies.includes(companyId)) {
      return "legacy";
    }

    if (mode === "legacy" || mode === "canonical") {
      return mode;
    }

    return "shadow";
  }

  private buildFeatureFlagSnapshot(mode: string, companyId: string | null) {
    return {
      mode,
      companyId,
      companyFilter: process.env.TECHMAP_RAPESEED_CANONICAL_COMPANIES ?? "",
    };
  }

  private buildShadowParitySummary(report: ShadowParityReport | null | undefined) {
    if (!report) {
      return null;
    }

    return {
      traceId: report.traceId,
      hasBlockingDiffs: report.hasBlockingDiffs,
      diffCount: report.diffs.length,
      severityCounts: {
        P0: report.diffs.filter((diff) => diff.severity === "P0").length,
        P1: report.diffs.filter((diff) => diff.severity === "P1").length,
        P2: report.diffs.filter((diff) => diff.severity === "P2").length,
      },
      completeness: report.completeness,
    };
  }
}

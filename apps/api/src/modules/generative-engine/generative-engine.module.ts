import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

// Domain Layer
import { EntropyController } from './domain/entropy-controller';
import { DraftFactory } from './domain/draft-factory';
import { MetadataBuilder } from './domain/metadata-builder';
import { ConstraintPropagator } from './domain/constraint-propagator';
import { ImmutabilityGuard } from './domain/immutability-guard';

// Deterministic Layer
import { SeedManager } from './deterministic/seed-manager';
import { CanonicalSorter } from './deterministic/canonical-sorter';
import { StableHasher } from './deterministic/stable-hasher';
import { DeterministicGenerator } from './deterministic/deterministic-generator';

// FSM Layer
import { DraftStateManager } from './fsm/draft-state-manager';

// Record Layer
import { GenerationRecordService } from './record/generation-record.service';

// Validation Layer
import { IntegrityGateGenerative } from './validation/integrity-gate-generative';

// Explainability Layer
import { ExplainabilityModule } from './explainability/explainability.module';

// Yield Layer
import { YieldModule } from './yield/yield.module';

// Probability Layer
import { ProbabilityModule } from './probability/probability.module';

// --- Level C: Contradiction-Resilient Intelligence ---
import { DivergenceTrackerService } from './contradiction/divergence-tracker.service';
import { CounterfactualEngine } from './contradiction/counterfactual-engine';
import { ConflictMatrixService } from './contradiction/conflict-matrix.service';
import { SpearmanCorrelationService } from './contradiction/spearman-correlation.service';
import { ConflictExplainabilityBuilder } from './contradiction/conflict-explainability-builder';
import { ConflictController } from './contradiction/conflict.controller';

// Level C: Risk Analysis
import { RiskMetricCalculator } from './risk/risk-metric-calculator';
import { OverrideRiskAnalyzer } from './risk/override-risk-analyzer';

const LEVEL_B_PROVIDERS = [
    // Domain
    EntropyController,
    DraftFactory,
    MetadataBuilder,
    ConstraintPropagator,
    ImmutabilityGuard,

    // Deterministic
    SeedManager,
    CanonicalSorter,
    StableHasher,
    DeterministicGenerator,

    // FSM
    DraftStateManager,

    // Record
    GenerationRecordService,

    // Validation
    IntegrityGateGenerative,
];

const LEVEL_C_PROVIDERS = [
    // Contradiction (I29–I33)
    DivergenceTrackerService,
    CounterfactualEngine,
    ConflictMatrixService,
    SpearmanCorrelationService,
    ConflictExplainabilityBuilder,

    // Risk Analysis
    RiskMetricCalculator,
    OverrideRiskAnalyzer,
];

/**
 * GenerativeEngineModule — NestJS модуль Generative Engine.
 *
 * Level B (I15–I28): Domain, Deterministic, FSM, Record, Validation, Explainability
 * Level C (I29–I33): Contradiction, Risk Analysis, Monitoring
 *
 * Decision-ID: LEVEL-B-GEN-001, LEVEL-C-GEN-001
 */
@Module({
    imports: [
        PrismaModule,
        ExplainabilityModule,
        YieldModule,
        ProbabilityModule,
    ],
    controllers: [ConflictController],
    providers: [...LEVEL_B_PROVIDERS, ...LEVEL_C_PROVIDERS],
    exports: [
        ...LEVEL_B_PROVIDERS,
        ...LEVEL_C_PROVIDERS,
        ExplainabilityModule,
        YieldModule,
        ProbabilityModule,
    ],
})
export class GenerativeEngineModule { }


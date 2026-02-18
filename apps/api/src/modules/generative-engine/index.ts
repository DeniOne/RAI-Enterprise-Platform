// Generative Engine — Level B Public API
// Decision-ID: LEVEL-B-GEN-001

// Module
export { GenerativeEngineModule } from './generative-engine.module';

// Domain
export { EntropyController, EntropyViolationError } from './domain/entropy-controller';
export { DraftFactory } from './domain/draft-factory';
export type {
    GenerationParams,
    OperationTemplate,
    ResourceTemplate,
    StrategyConstraint,
    GeneratedDraft,
    GeneratedStage,
    GeneratedOperation,
    GeneratedResource,
    GenerationMetadata,
} from './domain/draft-factory';
export { MetadataBuilder } from './domain/metadata-builder';
export { ConstraintPropagator } from './domain/constraint-propagator';
export { ImmutabilityGuard } from './domain/immutability-guard';

// Deterministic
export { DeterministicGenerator } from './deterministic/deterministic-generator';
export { SeedManager, SeedDerivationError } from './deterministic/seed-manager';
export { CanonicalSorter, CanonicalSortError } from './deterministic/canonical-sorter';
export { StableHasher } from './deterministic/stable-hasher';

// FSM
export { DraftStateManager } from './fsm/draft-state-manager';

// Record
export { GenerationRecordService } from './record/generation-record.service';

// Validation
export { IntegrityGateGenerative } from './validation/integrity-gate-generative';

// Explainability
export { ExplainabilityBuilder } from './explainability/explainability-builder';
export type {
    ExplainabilityReport,
    ExplainFactor,
    ExplainConstraint,
    StageExplanation,
} from './explainability/explainability-builder';

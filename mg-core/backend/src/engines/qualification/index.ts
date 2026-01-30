/**
 * Qualification Engine Index - Phase 1.2
 * 
 * Экспортирует все компоненты Qualification Engine.
 */

// Engine
export { QualificationEngine, QualificationValidationError } from './qualification-engine';

// Recorder
export { recordQualificationProposal } from './qualification-recorder';

// Rules
export {
    eligibleForUpgradeRule,
    riskOfDowngradeRule,
    ALL_QUALIFICATION_RULES,
    getRuleByName,
} from './rules';

// Re-export types for convenience
export type {
    QualificationState,
    IQualificationInput,
    IQualificationEvaluation,
    IQualificationEvidence,
    IQualificationRule,
    IQualificationRequirements,
} from '../../types/core/qualification.types';

/**
 * KPI Engine Index - Phase 1.1
 * 
 * Экспортирует все компоненты KPI Engine.
 */

// Engine
export { KPIEngine, KPIValidationError } from './kpi-engine';

// Recorder
export { recordKPIResult, recordMultipleKPIResults } from './kpi-recorder';

// Formulas
export {
    sessionsCountFormula,
    revenueFormula,
    npsAverageFormula,
    ALL_FORMULAS,
    formulaRegistry,
} from './formulas';

// Re-export types for convenience
export type {
    IKPIFormula,
    IKPIContext,
    IKPIResult,
    IKPICalculationInput,
    IKPIFormulaRegistry,
} from '../../types/core/kpi.types';

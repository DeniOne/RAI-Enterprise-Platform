/**
 * KPI Formulas Index - Phase 1.1
 * 
 * Экспортирует все KPI формулы и реестр.
 */

import { EventType } from '../../../types/core/event.types';
import { IKPIFormula, IKPIFormulaRegistry } from '../../../types/core/kpi.types';

// Импорт формул
import { sessionsCountFormula } from './sessions.formula';
import { revenueFormula } from './revenue.formula';
import { npsAverageFormula } from './nps.formula';

// =============================================================================
// FORMULA EXPORTS
// =============================================================================

export { sessionsCountFormula } from './sessions.formula';
export { revenueFormula } from './revenue.formula';
export { npsAverageFormula } from './nps.formula';

// =============================================================================
// ALL FORMULAS
// =============================================================================

/**
 * Все зарегистрированные формулы
 */
export const ALL_FORMULAS: IKPIFormula[] = [
    sessionsCountFormula,
    revenueFormula,
    npsAverageFormula,
];

// =============================================================================
// FORMULA REGISTRY
// =============================================================================

/**
 * Реестр формул KPI
 * 
 * Предоставляет lookup по имени и типу события.
 */
export const formulaRegistry: IKPIFormulaRegistry = {
    formulas: ALL_FORMULAS,

    /**
     * Получить формулу по имени
     */
    getByName: (name: string): IKPIFormula | undefined => {
        return ALL_FORMULAS.find(f => f.name === name);
    },

    /**
     * Получить формулы, связанные с типом события
     */
    getByEventType: (eventType: EventType): IKPIFormula[] => {
        return ALL_FORMULAS.filter(f => f.source_events.includes(eventType));
    }
};

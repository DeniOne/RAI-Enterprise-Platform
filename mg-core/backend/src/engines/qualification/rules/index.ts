/**
 * Qualification Rules Index - Phase 1.2
 * 
 * Экспортирует все Qualification Rules.
 */

import { IQualificationRule } from '../../../types/core/qualification.types';
import { eligibleForUpgradeRule } from './upgrade.rule';
import { riskOfDowngradeRule } from './downgrade.rule';

// =============================================================================
// RULE EXPORTS
// =============================================================================

export { eligibleForUpgradeRule } from './upgrade.rule';
export { riskOfDowngradeRule } from './downgrade.rule';

// =============================================================================
// ALL RULES
// =============================================================================

/**
 * Все правила квалификации
 * 
 * Порядок важен: сначала проверяем upgrade, потом downgrade.
 * Если ни одно не сработало — stable.
 */
export const ALL_QUALIFICATION_RULES: IQualificationRule[] = [
    eligibleForUpgradeRule,
    riskOfDowngradeRule,
];

// =============================================================================
// RULE REGISTRY
// =============================================================================

/**
 * Получить правило по имени
 */
export function getRuleByName(name: string): IQualificationRule | undefined {
    return ALL_QUALIFICATION_RULES.find(r => r.name === name);
}

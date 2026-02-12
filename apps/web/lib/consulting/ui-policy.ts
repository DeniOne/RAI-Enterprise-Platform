import { UserRole } from '../config/role-config';
import { DomainUiContext } from './navigation-policy';

export type HarvestPlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'DONE' | 'ARCHIVE';
export type TechMapStatus = 'PROJECT' | 'CHECKING' | 'ACTIVE' | 'FROZEN';
export type BudgetPlanStatus = 'DRAFT' | 'APPROVED' | 'LOCKED' | 'EXECUTING' | 'CLOSED';

export type EntityType = 'harvest-plan' | 'tech-map' | 'budget' | 'deviation';

export interface FSMTransition {
    target: string;
    label: string;
    requiredRole?: UserRole;
}

export interface BlockedTransition {
    transition: string;
    reason: string;
}

export interface UiPermissionResult {
    canEdit: boolean;
    canApprove: boolean;
    allowedTransitions: FSMTransition[];
    blockedTransitions: BlockedTransition[];
    isImmutable: boolean;
    deniedReasons: string[]; // Reasons for general actions (edit/approve)
    policyVersion: string;
}

const POLICY_VERSION = '2.0.0-domain-viz';

/**
 * Unified Transition Policy Contract
 */
export function getEntityTransitions(
    type: EntityType,
    status: string,
    role: UserRole,
    context: DomainUiContext
): UiPermissionResult {
    const isAdmin = role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'FOUNDER';
    const isCEO = role === 'CEO' || isAdmin;

    const result: UiPermissionResult = {
        canEdit: false,
        canApprove: false,
        allowedTransitions: [],
        blockedTransitions: [],
        isImmutable: false,
        policyVersion: POLICY_VERSION,
        deniedReasons: [],
    };

    switch (type) {
        case 'harvest-plan':
            return getHarvestPlanPermissions(status as HarvestPlanStatus, role, context);
        case 'tech-map':
            return getTechMapPermissions(status as TechMapStatus, role, context);
        case 'budget':
            return getBudgetPlanPermissions(status as BudgetPlanStatus, role, context);
        default:
            return result;
    }
}

function getHarvestPlanPermissions(
    status: HarvestPlanStatus,
    role: UserRole,
    context: DomainUiContext
): UiPermissionResult {
    const isAdmin = role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'FOUNDER';
    const isCEO = role === 'CEO' || isAdmin;

    const result: UiPermissionResult = {
        canEdit: false,
        canApprove: false,
        allowedTransitions: [],
        blockedTransitions: [],
        isImmutable: false,
        policyVersion: POLICY_VERSION,
        deniedReasons: [],
    };

    switch (status) {
        case 'DRAFT':
            result.canEdit = true;
            result.allowedTransitions = [{ target: 'REVIEW', label: 'На проверку' }];
            break;

        case 'REVIEW':
            result.canApprove = isCEO;
            if (isCEO) {
                result.allowedTransitions = [{ target: 'APPROVED', label: 'Утвердить' }];
            } else {
                result.deniedReasons.push('Только CEO может утверждать планы');
                result.blockedTransitions.push({ transition: 'APPROVED', reason: 'Требуется роль CEO' });
            }
            break;

        case 'APPROVED':
            if (isCEO) {
                // Прямое выполнение правила: Нельзя активировать без LOCKED бюджета и активной техкарты
                if (context.lockedBudget && context.activeTechMap) {
                    result.allowedTransitions = [{ target: 'ACTIVE', label: 'Активировать' }];
                } else {
                    const reasons: string[] = [];
                    if (!context.lockedBudget) reasons.push('Нет заблокированного бюджета');
                    if (!context.activeTechMap) reasons.push('Нет активной техкарты');

                    result.blockedTransitions.push({
                        transition: 'ACTIVE',
                        reason: `Блокировка: ${reasons.join(', ')}`
                    });
                }
            } else {
                result.blockedTransitions.push({ transition: 'ACTIVE', reason: 'Требуется роль CEO' });
            }
            break;

        case 'ACTIVE':
            result.isImmutable = true;
            result.deniedReasons.push('План активен. Изменения через отклонения.');
            break;
    }

    return result;
}

function getTechMapPermissions(
    status: TechMapStatus,
    role: UserRole,
    context: DomainUiContext
): UiPermissionResult {
    const result: UiPermissionResult = {
        canEdit: false,
        canApprove: false,
        allowedTransitions: [],
        blockedTransitions: [],
        isImmutable: false,
        policyVersion: POLICY_VERSION,
        deniedReasons: [],
    };

    switch (status) {
        case 'PROJECT':
            result.canEdit = true;
            result.allowedTransitions = [{ target: 'CHECKING', label: 'На проверку' }];
            break;
        case 'CHECKING':
            result.allowedTransitions = [{ target: 'ACTIVE', label: 'Активировать' }];
            break;
        case 'ACTIVE':
            result.allowedTransitions = [{ target: 'FROZEN', label: 'Заморозить' }];
            break;
        case 'FROZEN':
            result.isImmutable = true;
            result.deniedReasons.push('Техкарта заморожена.');
            break;
    }

    return result;
}

function getBudgetPlanPermissions(
    status: BudgetPlanStatus,
    role: UserRole,
    context: DomainUiContext
): UiPermissionResult {
    const isAdmin = role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'FOUNDER';
    const isFin = role === 'DIRECTOR_FINANCE' || isAdmin;

    const result: UiPermissionResult = {
        canEdit: false,
        canApprove: false,
        allowedTransitions: [],
        blockedTransitions: [],
        isImmutable: false,
        policyVersion: POLICY_VERSION,
        deniedReasons: [],
    };

    switch (status) {
        case 'DRAFT':
            result.canEdit = true;
            result.allowedTransitions = [{ target: 'APPROVED', label: 'Утвердить' }];
            break;
        case 'APPROVED':
            if (isFin) {
                result.allowedTransitions = [{ target: 'LOCKED', label: 'Заблокировать (Lock)' }];
            } else {
                result.blockedTransitions.push({ transition: 'LOCKED', reason: 'Требуется роль Финансового директора' });
            }
            break;
        case 'LOCKED':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'EXECUTING', label: 'В исполнение' }];
            break;
        case 'EXECUTING':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'CLOSED', label: 'Закрыть' }];
            break;
    }

    return result;
}

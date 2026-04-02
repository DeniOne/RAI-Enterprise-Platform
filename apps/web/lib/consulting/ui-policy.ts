import { UserRole } from '../config/role-config';
import { DomainUiContext } from './navigation-policy';
import { CapabilityFlags, capabilitiesFromRole } from './capability-policy';

export type HarvestPlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'DONE' | 'ARCHIVE';
export type TechMapStatus = 'PROJECT' | 'CHECKING' | 'ACTIVE' | 'FROZEN';
export type BudgetPlanStatus = 'DRAFT' | 'APPROVED' | 'LOCKED' | 'EXECUTING' | 'CLOSED';

export type EntityType = 'harvest-plan' | 'tech-map' | 'budget' | 'deviation';

export interface FSMTransition {
    target: string;
    label: string;
    requiredCapability?: keyof CapabilityFlags;
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
    deniedReasons: string[];
    policyVersion: string;
}

const POLICY_VERSION = '2.1.0-capability-gated';

function resolveCapabilities(roleOrCapabilities: UserRole | CapabilityFlags): CapabilityFlags {
    return typeof roleOrCapabilities === 'string'
        ? capabilitiesFromRole(roleOrCapabilities)
        : roleOrCapabilities;
}

/**
 * Unified transition policy contract.
 *
 * Backward compatibility: supports legacy `UserRole` input while policy logic
 * itself is capability-first.
 */
export function getEntityTransitions(
    type: EntityType,
    status: string,
    roleOrCapabilities: UserRole | CapabilityFlags,
    context: DomainUiContext
): UiPermissionResult {
    const capabilities = resolveCapabilities(roleOrCapabilities);

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
            return getHarvestPlanPermissions(status as HarvestPlanStatus, capabilities, context);
        case 'tech-map':
            return getTechMapPermissions(status as TechMapStatus, capabilities, context);
        case 'budget':
            return getBudgetPlanPermissions(status as BudgetPlanStatus, capabilities, context);
        default:
            return result;
    }
}

export function getHarvestPlanPermissions(
    status: HarvestPlanStatus,
    roleOrCapabilities: UserRole | CapabilityFlags,
    context: DomainUiContext
): UiPermissionResult {
    const capabilities = resolveCapabilities(roleOrCapabilities);
    const canAuthorize = capabilities.canSign || capabilities.canOverride || capabilities.canApprove;

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
            result.allowedTransitions = [{ target: 'REVIEW', label: 'Отправить на проверку' }];
            break;

        case 'REVIEW':
            result.canApprove = canAuthorize;
            if (canAuthorize) {
                result.allowedTransitions = [{ target: 'APPROVED', label: 'Утвердить' }];
            } else {
                result.deniedReasons.push('Для утверждения плана нужны полномочия на институциональное согласование.');
                result.blockedTransitions.push({ transition: 'APPROVED', reason: 'Не хватает полномочий на утверждение' });
            }
            break;

        case 'APPROVED':
            if (canAuthorize) {
                if (context.lockedBudget && context.activeTechMap) {
                    result.allowedTransitions = [{ target: 'ACTIVE', label: 'Activate' }];
                } else {
                    const reasons: string[] = [];
                    if (!context.lockedBudget) reasons.push('Нужен зафиксированный бюджет');
                    if (!context.activeTechMap) reasons.push('Нужна активная техкарта');

                    result.blockedTransitions.push({
                        transition: 'ACTIVE',
                        reason: reasons.join(', '),
                    });
                }
            } else {
                result.blockedTransitions.push({ transition: 'ACTIVE', reason: 'Не хватает полномочий на утверждение' });
            }
            break;

        case 'ACTIVE':
            result.isImmutable = true;
            result.deniedReasons.push('План уже активен. Изменения нужно проводить через контур отклонений.');
            break;
    }

    return result;
}

export function getTechMapPermissions(
    status: TechMapStatus,
    _roleOrCapabilities: UserRole | CapabilityFlags,
    _context: DomainUiContext
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
            result.allowedTransitions = [{ target: 'CHECKING', label: 'Отправить на проверку' }];
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

export function getBudgetPlanPermissions(
    status: BudgetPlanStatus,
    roleOrCapabilities: UserRole | CapabilityFlags,
    _context: DomainUiContext
): UiPermissionResult {
    const capabilities = resolveCapabilities(roleOrCapabilities);
    const canLockBudget = capabilities.canSign || capabilities.canOverride || capabilities.canApprove;

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
            if (canLockBudget) {
                result.allowedTransitions = [{ target: 'LOCKED', label: 'Зафиксировать бюджет' }];
            } else {
                result.blockedTransitions.push({ transition: 'LOCKED', reason: 'Не хватает полномочий на подписание' });
            }
            break;
        case 'LOCKED':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'EXECUTING', label: 'Запустить исполнение' }];
            break;
        case 'EXECUTING':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'CLOSED', label: 'Закрыть' }];
            break;
    }

    return result;
}

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
            result.allowedTransitions = [{ target: 'REVIEW', label: 'Submit for review' }];
            break;

        case 'REVIEW':
            result.canApprove = canAuthorize;
            if (canAuthorize) {
                result.allowedTransitions = [{ target: 'APPROVED', label: 'Approve' }];
            } else {
                result.deniedReasons.push('Institutional approval authority is required to approve plans.');
                result.blockedTransitions.push({ transition: 'APPROVED', reason: 'Missing approval authority capability' });
            }
            break;

        case 'APPROVED':
            if (canAuthorize) {
                if (context.lockedBudget && context.activeTechMap) {
                    result.allowedTransitions = [{ target: 'ACTIVE', label: 'Activate' }];
                } else {
                    const reasons: string[] = [];
                    if (!context.lockedBudget) reasons.push('Locked budget is required');
                    if (!context.activeTechMap) reasons.push('Active tech map is required');

                    result.blockedTransitions.push({
                        transition: 'ACTIVE',
                        reason: reasons.join(', '),
                    });
                }
            } else {
                result.blockedTransitions.push({ transition: 'ACTIVE', reason: 'Missing approval authority capability' });
            }
            break;

        case 'ACTIVE':
            result.isImmutable = true;
            result.deniedReasons.push('Plan is active. Changes must go through deviation workflow.');
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
            result.allowedTransitions = [{ target: 'CHECKING', label: 'Submit for review' }];
            break;
        case 'CHECKING':
            result.allowedTransitions = [{ target: 'ACTIVE', label: 'Activate' }];
            break;
        case 'ACTIVE':
            result.allowedTransitions = [{ target: 'FROZEN', label: 'Freeze' }];
            break;
        case 'FROZEN':
            result.isImmutable = true;
            result.deniedReasons.push('Tech map is frozen.');
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
            result.allowedTransitions = [{ target: 'APPROVED', label: 'Approve' }];
            break;
        case 'APPROVED':
            if (canLockBudget) {
                result.allowedTransitions = [{ target: 'LOCKED', label: 'Lock budget' }];
            } else {
                result.blockedTransitions.push({ transition: 'LOCKED', reason: 'Missing signing authority capability' });
            }
            break;
        case 'LOCKED':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'EXECUTING', label: 'Start execution' }];
            break;
        case 'EXECUTING':
            result.isImmutable = true;
            result.allowedTransitions = [{ target: 'CLOSED', label: 'Close' }];
            break;
    }

    return result;
}

"use strict";
/**
 * OFS ACL Service — Field-Level Access Control
 *
 * Controls visibility of sensitive OFS data based on user role.
 * Per MODULE-SPEC: OFS does NOT rank or evaluate humans.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ofsAclService = void 0;
exports.filterOFSEntityByRole = filterOFSEntityByRole;
exports.filterOFSArrayByRole = filterOFSArrayByRole;
exports.filterHistoryByRole = filterHistoryByRole;
exports.filterRoleMatrixByRole = filterRoleMatrixByRole;
exports.filterEmployeeByRole = filterEmployeeByRole;
const common_enums_1 = require("../dto/common/common.enums");
// =============================================================================
// Sensitive Fields Configuration
// =============================================================================
/**
 * Fields that require HR_MANAGER or ADMIN role to view
 */
const HR_ONLY_FIELDS = [
    'salary_min',
    'salary_max',
    'salary_range',
    'old_data', // history diffs
    'new_data', // history diffs
    'reason', // internal reasons
    'changed_by', // who made changes
    'ip_address',
    'user_agent',
];
/**
 * Fields that require at least DEPARTMENT_HEAD role
 */
const MANAGER_FIELDS = [
    'competencies',
    'certifications',
    'skills',
    'kpi_metrics',
    'flow_metrics',
];
// =============================================================================
// Role Check Helpers
// =============================================================================
const HR_ROLES = [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER];
const MANAGER_ROLES = [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD];
function isHROrAdmin(role) {
    return HR_ROLES.includes(role);
}
function isManager(role) {
    return MANAGER_ROLES.includes(role);
}
// =============================================================================
// Field Filtering Functions
// =============================================================================
/**
 * Filter single entity by role
 */
function filterOFSEntityByRole(entity, userRole, userId) {
    if (isHROrAdmin(userRole)) {
        // HR and Admin see everything
        return entity;
    }
    const filtered = { ...entity };
    // Remove HR-only fields for non-HR users
    for (const field of HR_ONLY_FIELDS) {
        delete filtered[field];
    }
    // Remove manager fields for non-managers
    if (!isManager(userRole)) {
        for (const field of MANAGER_FIELDS) {
            delete filtered[field];
        }
    }
    return filtered;
}
/**
 * Filter array of entities by role
 */
function filterOFSArrayByRole(entities, userRole, userId) {
    return entities.map(entity => filterOFSEntityByRole(entity, userRole, userId));
}
/**
 * Filter history records by role
 * History contains sensitive old_data/new_data diffs
 */
function filterHistoryByRole(history, userRole) {
    if (isHROrAdmin(userRole)) {
        return history;
    }
    // Non-HR users see history without detailed diffs
    return history.map(record => ({
        ...record,
        old_data: undefined,
        new_data: undefined,
        reason: undefined,
        ip_address: undefined,
        user_agent: undefined,
    }));
}
/**
 * Filter role matrix by role
 * Salary ranges are HR-only
 */
function filterRoleMatrixByRole(roles, userRole) {
    if (isHROrAdmin(userRole)) {
        return roles;
    }
    return roles.map(role => {
        const filtered = { ...role };
        delete filtered.salary_min;
        delete filtered.salary_max;
        return filtered;
    });
}
/**
 * Filter employee data by role and ownership
 */
function filterEmployeeByRole(employee, userRole, requestingUserId) {
    if (isHROrAdmin(userRole)) {
        return employee;
    }
    const filtered = { ...employee };
    // Remove sensitive fields
    for (const field of HR_ONLY_FIELDS) {
        delete filtered[field];
    }
    // If not manager and not own data, hide competencies
    if (!isManager(userRole) && employee.user_id !== requestingUserId) {
        for (const field of MANAGER_FIELDS) {
            delete filtered[field];
        }
    }
    return filtered;
}
// =============================================================================
// Export
// =============================================================================
exports.ofsAclService = {
    filterOFSEntityByRole,
    filterOFSArrayByRole,
    filterHistoryByRole,
    filterRoleMatrixByRole,
    filterEmployeeByRole,
    isHROrAdmin,
    isManager,
};
exports.default = exports.ofsAclService;

"use strict";
/**
 * Employee Field-Level Access Control
 *
 * REMEDIATION: MODULE 02
 * Purpose: Filter employee response fields based on user role
 *
 * Principle: No data leaks by default
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterEmployeeByRole = filterEmployeeByRole;
exports.getDataClassification = getDataClassification;
const common_enums_1 = require("../dto/common/common.enums");
/**
 * Fields visible to different roles
 */
const FIELD_VISIBILITY = {
    // Salary is HR/Admin only
    salary: [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER],
    // MC/GMC balance is HR/Admin/Manager
    mcBalance: [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD],
    gmcBalance: [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD],
    // User personal data is restricted
    'user.phoneNumber': [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD],
    'user.lastLoginAt': [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER],
};
/**
 * Public fields visible to all authenticated users
 */
const PUBLIC_FIELDS = [
    'id',
    'userId',
    'departmentId',
    'position',
    'employeeNumber',
    'status',
    'rank',
    'hireDate',
    'createdAt',
    'updatedAt',
    'department',
];
/**
 * Filter employee response based on user role
 *
 * @param employee - Full employee response
 * @param userRole - Role of the requesting user
 * @returns Filtered employee response
 */
function filterEmployeeByRole(employee, userRole) {
    if (!employee)
        return employee;
    const role = userRole || common_enums_1.UserRole.EMPLOYEE;
    const result = {};
    // Always include public fields
    for (const field of PUBLIC_FIELDS) {
        if (field in employee) {
            result[field] = employee[field];
        }
    }
    // Include restricted fields based on role
    for (const [field, allowedRoles] of Object.entries(FIELD_VISIBILITY)) {
        if (allowedRoles.includes(role)) {
            if (!field.includes('.')) {
                // Top-level field
                if (field in employee) {
                    result[field] = employee[field];
                }
            }
        }
    }
    // Filter user object if present
    if (employee.user) {
        result.user = filterUserByRole(employee.user, role);
    }
    return result;
}
/**
 * Filter user data within employee response
 */
function filterUserByRole(user, role) {
    if (!user)
        return user;
    // Public user fields
    const filtered = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
    };
    // Restricted fields
    if ([common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD].includes(role)) {
        filtered.phoneNumber = user.phoneNumber;
        filtered.middleName = user.middleName;
    }
    if ([common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER].includes(role)) {
        filtered.lastLoginAt = user.lastLoginAt;
        filtered.personalDataConsent = user.personalDataConsent;
    }
    return filtered;
}
/**
 * Get data classification for audit purposes
 */
function getDataClassification(fields) {
    const confidentialFields = ['salary', 'mcBalance', 'gmcBalance'];
    const personalFields = ['phoneNumber', 'email', 'dateOfBirth'];
    if (fields.some(f => confidentialFields.includes(f))) {
        return 'confidential';
    }
    if (fields.some(f => personalFields.includes(f))) {
        return 'personal';
    }
    return 'public';
}

/**
 * Employee Field-Level Access Control
 * 
 * REMEDIATION: MODULE 02
 * Purpose: Filter employee response fields based on user role
 * 
 * Principle: No data leaks by default
 */

import { UserRole } from '../dto/common/common.enums';
import { EmployeeResponseDto } from '../dto/employees/employee.dto';

/**
 * Fields visible to different roles
 */
const FIELD_VISIBILITY: Record<string, UserRole[]> = {
    // Salary is HR/Admin only
    salary: [UserRole.ADMIN, UserRole.HR_MANAGER],

    // MC/GMC balance is HR/Admin/Manager
    mcBalance: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD],
    gmcBalance: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD],

    // User personal data is restricted
    'user.phoneNumber': [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD],
    'user.lastLoginAt': [UserRole.ADMIN, UserRole.HR_MANAGER],
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
export function filterEmployeeByRole(
    employee: EmployeeResponseDto,
    userRole?: UserRole
): Partial<EmployeeResponseDto> {
    if (!employee) return employee;

    const role = userRole || UserRole.EMPLOYEE;
    const result: Partial<EmployeeResponseDto> = {};

    // Always include public fields
    for (const field of PUBLIC_FIELDS) {
        if (field in employee) {
            (result as any)[field] = (employee as any)[field];
        }
    }

    // Include restricted fields based on role
    for (const [field, allowedRoles] of Object.entries(FIELD_VISIBILITY)) {
        if (allowedRoles.includes(role)) {
            if (!field.includes('.')) {
                // Top-level field
                if (field in employee) {
                    (result as any)[field] = (employee as any)[field];
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
function filterUserByRole(user: any, role: UserRole): any {
    if (!user) return user;

    // Public user fields
    const filtered: any = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
    };

    // Restricted fields
    if ([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD].includes(role)) {
        filtered.phoneNumber = user.phoneNumber;
        filtered.middleName = user.middleName;
    }

    if ([UserRole.ADMIN, UserRole.HR_MANAGER].includes(role)) {
        filtered.lastLoginAt = user.lastLoginAt;
        filtered.personalDataConsent = user.personalDataConsent;
    }

    return filtered;
}

/**
 * Get data classification for audit purposes
 */
export function getDataClassification(fields: string[]): 'public' | 'personal' | 'confidential' {
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

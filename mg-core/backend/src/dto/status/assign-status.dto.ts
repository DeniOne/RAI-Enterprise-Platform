/**
 * DTO for assigning a participation status to a user
 */
export interface AssignStatusDto {
    userId: string;
    statusCode: string;
    reason: string;
}

/**
 * Validate AssignStatusDto
 */
export function validateAssignStatusDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId || typeof data.userId !== 'string') {
        errors.push('userId is required and must be a string');
    }

    if (!data.statusCode || typeof data.statusCode !== 'string') {
        errors.push('statusCode is required and must be a string');
    }

    if (!data.reason || typeof data.reason !== 'string') {
        errors.push('reason is required and must be a string');
    } else if (data.reason.trim().length === 0) {
        errors.push('reason cannot be empty');
    } else if (data.reason.length > 500) {
        errors.push('reason cannot exceed 500 characters');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

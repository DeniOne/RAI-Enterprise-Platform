"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAssignStatusDto = validateAssignStatusDto;
/**
 * Validate AssignStatusDto
 */
function validateAssignStatusDto(data) {
    const errors = [];
    if (!data.userId || typeof data.userId !== 'string') {
        errors.push('userId is required and must be a string');
    }
    if (!data.statusCode || typeof data.statusCode !== 'string') {
        errors.push('statusCode is required and must be a string');
    }
    if (!data.reason || typeof data.reason !== 'string') {
        errors.push('reason is required and must be a string');
    }
    else if (data.reason.trim().length === 0) {
        errors.push('reason cannot be empty');
    }
    else if (data.reason.length > 500) {
        errors.push('reason cannot exceed 500 characters');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

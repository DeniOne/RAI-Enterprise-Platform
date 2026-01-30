/**
 * Custom Exception Classes for MatrixGin API
 * Provides standardized error handling across the application
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    public readonly errors?: Record<string, string[]>;

    constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class InternalError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR');
    }
}

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../exceptions';
import { logger } from '../config/logger';

/**
 * Standard API Error Response Format
 */
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        errors?: Record<string, string[]>;
    };
    meta: {
        timestamp: string;
        path: string;
    };
}

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized JSON response
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Default error values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let errors: Record<string, string[]> | undefined;

    // Handle known AppError types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;

        if (err instanceof ValidationError) {
            errors = err.errors;
        }
    }
    // Handle Prisma errors
    else if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;
        switch (prismaError.code) {
            case 'P2002':
                statusCode = 409;
                code = 'CONFLICT';
                message = 'A record with this value already exists';
                break;
            case 'P2025':
                statusCode = 404;
                code = 'NOT_FOUND';
                message = 'Record not found';
                break;
            default:
                statusCode = 400;
                code = 'DATABASE_ERROR';
                message = 'Database operation failed';
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired';
    }

    // Log error
    logger.error(`${code}: ${message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const response: ErrorResponse = {
        success: false,
        error: {
            code,
            message,
            ...(errors && { errors }),
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    };

    res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const response: ErrorResponse = {
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    };

    res.status(404).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

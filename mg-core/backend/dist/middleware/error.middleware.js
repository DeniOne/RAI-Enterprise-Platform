"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const exceptions_1 = require("../exceptions");
const logger_1 = require("../config/logger");
/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized JSON response
 */
const errorHandler = (err, req, res, _next) => {
    // Default error values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let errors;
    // Handle known AppError types
    if (err instanceof exceptions_1.AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        if (err instanceof exceptions_1.ValidationError) {
            errors = err.errors;
        }
    }
    // Handle Prisma errors
    else if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
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
    logger_1.logger.error(`${code}: ${message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    const response = {
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
exports.errorHandler = errorHandler;
/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, _next) => {
    const response = {
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
exports.notFoundHandler = notFoundHandler;
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;

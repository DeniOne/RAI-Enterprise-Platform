import winston from 'winston';
import path from 'path';

/**
 * Structured Logger Configuration
 * 
 * Features:
 * - Console output with colors in development
 * - File output for errors and combined logs
 * - JSON format for production
 * - Request ID correlation support
 */

const logDir = process.env.LOG_DIR || 'logs';

// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

// Format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// Format for file output (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Determine log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create transports
const transports: winston.transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? fileFormat : consoleFormat,
    }),
];

// Add file transports in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    transports.push(
        // Error logs
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        })
    );
}

// Create the logger instance
export const logger = winston.createLogger({
    level,
    levels,
    transports,
    defaultMeta: {
        service: 'matrixgin-api',
        environment: process.env.NODE_ENV || 'development'
    },
});

// Helper methods for common logging patterns
export const logRequest = (method: string, path: string, statusCode: number, duration: number, requestId?: string) => {
    logger.http(`${method} ${path} ${statusCode} ${duration}ms`, {
        requestId,
        method,
        path,
        statusCode,
        duration
    });
};

export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error(error.message, {
        stack: error.stack,
        name: error.name,
        ...context,
    });
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
};

export default logger;

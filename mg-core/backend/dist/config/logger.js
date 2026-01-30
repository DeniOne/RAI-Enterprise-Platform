"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarn = exports.logDebug = exports.logInfo = exports.logError = exports.logRequest = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
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
winston_1.default.addColors(colors);
// Format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
// Format for file output (JSON)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Determine log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
// Create transports
const transports = [
    // Console transport (always enabled)
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? fileFormat : consoleFormat,
    }),
];
// Add file transports in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    transports.push(
    // Error logs
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }), 
    // Combined logs
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }));
}
// Create the logger instance
exports.logger = winston_1.default.createLogger({
    level,
    levels,
    transports,
    defaultMeta: {
        service: 'matrixgin-api',
        environment: process.env.NODE_ENV || 'development'
    },
});
// Helper methods for common logging patterns
const logRequest = (method, path, statusCode, duration, requestId) => {
    exports.logger.http(`${method} ${path} ${statusCode} ${duration}ms`, {
        requestId,
        method,
        path,
        statusCode,
        duration
    });
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    exports.logger.error(error.message, {
        stack: error.stack,
        name: error.name,
        ...context,
    });
};
exports.logError = logError;
const logInfo = (message, meta) => {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
const logDebug = (message, meta) => {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
const logWarn = (message, meta) => {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
exports.default = exports.logger;

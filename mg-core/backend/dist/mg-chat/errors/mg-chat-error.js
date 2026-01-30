"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MGChatError = void 0;
/**
 * MG Chat Domain Error
 *
 * Base error class for MG Chat domain errors.
 * Used for error codes that should be handled by Error UX Interceptor.
 */
class MGChatError extends Error {
    errorCode;
    constructor(errorCode, message) {
        super(message || `MG Chat Error: ${errorCode}`);
        this.errorCode = errorCode;
        this.name = 'MGChatError';
    }
}
exports.MGChatError = MGChatError;

/**
 * MG Chat Domain Error
 * 
 * Base error class for MG Chat domain errors.
 * Used for error codes that should be handled by Error UX Interceptor.
 */
export class MGChatError extends Error {
    constructor(
        public readonly errorCode: string,
        message?: string
    ) {
        super(message || `MG Chat Error: ${errorCode}`);
        this.name = 'MGChatError';
    }
}

export class RegistryErrorFactory {

    /**
     * Returns a standard 404 Error.
     * Used when an Entity is hidden or does not exist.
     * Message should be generic to prevent enumeration.
     */
    static entityNotFound(): Error {
        const error = new Error('Entity not found');
        (error as any).statusCode = 404;
        return error;
    }

    /**
     * Returns a standard 403 Error.
     * Used when a View or Action is explicitly forbidden.
     */
    static accessDenied(reason?: string): Error {
        const error = new Error(reason || 'Access denied');
        (error as any).statusCode = 403;
        return error;
    }

    /**
     * Returns a standard 500 Error for Registry Inconsistency.
     * Used when rules/schema are corrupted.
     */
    static systemError(message: string): Error {
        const error = new Error('Registry System Error: ' + message);
        (error as any).statusCode = 500;
        return error;
    }
}

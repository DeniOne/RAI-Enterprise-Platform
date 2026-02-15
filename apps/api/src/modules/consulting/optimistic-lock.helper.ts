import { Prisma } from '@rai/prisma-client';

/**
 * Executes an operation with Optimistic Locking and Retry strategy.
 * Useful for ensuring atomic updates on versioned entities.
 */
export async function withOptimisticLock<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 50
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const isConcurrencyError =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'; // Record to update not found (version mismatch or deleted)

            if (isConcurrencyError && attempt < retries) {
                await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt - 1))); // Exponential backoff
                continue;
            }
            throw error;
        }
    }
    throw new Error('Optimistic Lock: Max retries exceeded');
}

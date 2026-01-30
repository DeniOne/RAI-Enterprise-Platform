import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * 
 * Ensures a single PrismaClient instance is used across the entire application.
 * This prevents multiple database connections and enables proper connection pooling.
 * 
 * Usage in services:
 * import { prisma } from '../config/prisma';
 */

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// In development, use a global variable to preserve the client across hot reloads
// In production, create a new client for each server instance
export const prisma =
    global.__prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

/**
 * PSEE Integration Service
 * 
 * Initialize and manage PSEE event consumer.
 */

import { PrismaClient } from '@prisma/client';
import { PseeEventReader, PseeEventConsumer, PseeReadModel } from './index';
import { logger } from '../config/logger';

let consumer: PseeEventConsumer | null = null;
let readModel: PseeReadModel | null = null;

/**
 * Initialize PSEE integration.
 * Call this during app startup.
 */
export async function initializePsee(prisma: PrismaClient): Promise<void> {
    if (consumer) {
        logger.warn('PSEE already initialized');
        return;
    }

    const reader = new PseeEventReader(prisma);
    readModel = new PseeReadModel();

    consumer = new PseeEventConsumer(
        reader,
        async (events) => {
            await readModel!.processEvents(events);
        },
        Number(process.env.PSEE_POLL_INTERVAL_MS) || 5000
    );

    await consumer.start();
    logger.info('PSEE integration initialized');
}

/**
 * Shutdown PSEE integration.
 */
export function shutdownPsee(): void {
    if (consumer) {
        consumer.stop();
        consumer = null;
    }
    readModel = null;
    logger.info('PSEE integration shutdown');
}

/**
 * Get PSEE read model (for AI / analytics).
 */
export function getPseeReadModel(): PseeReadModel | null {
    return readModel;
}

/**
 * Get PSEE consumer (for monitoring).
 */
export function getPseeConsumer(): PseeEventConsumer | null {
    return consumer;
}

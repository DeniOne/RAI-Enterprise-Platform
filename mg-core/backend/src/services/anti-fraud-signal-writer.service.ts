/**
 * Anti-Fraud Signal Writer Service
 * Module 13: Corporate University
 * 
 * CANON: Append-only persistence
 * - Signals are NEVER deleted
 * - Signals are NEVER updated
 * - Signals are immutable
 * 
 * Separate from AntiFraudDetector (pure function)
 */

import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { AntiFraudSignal } from '../types/anti-fraud.types';

export class AntiFraudSignalWriter {
    /**
     * Append signals to database (append-only)
     * 
     * @param signals - Array of signals to persist
     */
    async append(signals: AntiFraudSignal[]): Promise<void> {
        if (signals.length === 0) {
            return;
        }

        try {
            await prisma.antiFraudSignal.createMany({
                data: signals.map(signal => ({
                    id: signal.id,
                    entity_type: signal.entity_type,
                    entity_id: signal.entity_id,
                    level: signal.level,
                    type: signal.type,
                    metric_snapshot: signal.metric_snapshot,
                    detected_at: signal.detected_at,
                    context: signal.context
                }))
            });

            logger.info(`[AntiFraudSignalWriter] Appended ${signals.length} signals`, {
                signals: signals.map(s => ({ type: s.type, level: s.level, entity_id: s.entity_id }))
            });

        } catch (error) {
            logger.error(`[AntiFraudSignalWriter] Failed to append signals`, { error });
            throw error;
        }
    }
}

export const antiFraudSignalWriter = new AntiFraudSignalWriter();

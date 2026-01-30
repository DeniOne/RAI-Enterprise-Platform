/**
 * PhotoCompany Result Event Handler
 * Module 13: Corporate University
 * 
 * CANON: PhotoCompany metrics are the ONLY source of truth for qualification upgrades.
 */

import { prisma } from '../../config/prisma';
import { qualificationService } from '../../services/qualification.service';
import { logger } from '../../config/logger';
import { IPhotoCompanyResultPayload } from '../../types/core/event.types';

export class PhotoCompanyResultHandler {
    /**
     * Handle PHOTOCOMPANY_RESULT event
     * 
     * 1. Idempotency check
     * 2. Analyze metrics
     * 3. Trigger qualification proposal if eligible
     * 4. Mark event as processed
     */
    async handle(eventId: string, payload: IPhotoCompanyResultPayload) {
        // 1. Idempotency Check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            logger.warn(`[EventFlow] Event ${eventId} not found in store`);
            return;
        }

        if (event.processed_at) {
            logger.info(`[EventFlow] Event ${eventId} already processed at ${event.processed_at}`);
            return;
        }

        logger.info(`[EventFlow] Processing PHOTOCOMPANY_RESULT for user ${payload.user_id}, shift ${payload.shift_id}`);

        try {
            // 2. Map metrics for QualificationService
            // Note: In real integration, we might need to fetch last N shifts here
            // but for now we pass the current results to the service which will
            // handle the canonical check (stable metrics for N shifts).

            const metrics = {
                okk: payload.okk || 0,
                ck: payload.ck || 0,
                conversion: payload.conversion || 0,
                quality: payload.quality || 0,
                retouchTime: payload.retouch_time || 0,
                // These might be needed for specific rules later
                shiftsCount: 1, // Current shift
                period: {
                    from: payload.shift_date,
                    to: payload.shift_date
                }
            };

            // 3. Trigger Qualification Proposal Logic
            // CANON: Only system can propose upgrades based on these metrics
            try {
                const proposal = await qualificationService.proposeQualificationUpgrade(payload.user_id, metrics as any);

                // 3a. Create QUALIFICATION_PROPOSED event if proposal was created
                // CANON: Metric event → расчёт → decision event → notification
                if (proposal) {
                    await prisma.event.create({
                        data: {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            type: 'QUALIFICATION_PROPOSED' as any,
                            source: 'PHOTOCOMPANY_RESULT_HANDLER',
                            subject_id: payload.user_id,
                            subject_type: 'user',
                            payload: {
                                user_id: payload.user_id,
                                proposal_id: proposal.proposalId,
                                new_grade: proposal.newGrade,
                                triggered_by_shift: payload.shift_id
                            },
                            metadata: {
                                source_event_id: eventId,
                                metrics: metrics
                            }
                        }
                    });

                    logger.info(`[EventFlow] Created QUALIFICATION_PROPOSED event for user ${payload.user_id}, proposal ${proposal.proposalId}`);
                }
            } catch (qualError) {
                // Non-blocking: Qualification proposal failed but we still mark event as processed
                logger.warn(`[EventFlow] Qualification proposal failed for user ${payload.user_id}`, { error: qualError });
            }

            // 4. Mark as processed (Success)
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    processed_at: new Date(),
                },
            });

            logger.info(`[EventFlow] Finished processing PHOTOCOMPANY_RESULT ${eventId}`);

        } catch (error) {
            logger.error(`[EventFlow] Error processing PHOTOCOMPANY_RESULT ${eventId}`, { error });
            // We DON'T mark it as processed so it can be retried
            throw error;
        }
    }
}

export const photoCompanyResultHandler = new PhotoCompanyResultHandler();

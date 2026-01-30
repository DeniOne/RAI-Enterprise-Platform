/**
 * GMC Recognition Bridge Service
 * Module 08 — MatrixCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 * 
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * Emits Recognition Signals (Flagged Events) for human review.
 */

import { randomUUID } from 'crypto';
import {
    GMCRecognitionContext,
    GMCRecognitionDecision
} from '../core/gmc-recognition.types';
import {
    AuctionEventStatus,
    GMCRecognitionStatus,
    GMCRecognitionDeniedReason,
    GMCRecognitionTrigger
} from '../core/economy.enums';
import { MCState } from '../core/mc.types';
import {
    guardAuctionClosed,
    guardMCSnapshotPresent,
    guardParticipantValid,
    GMCRecognitionError
} from '../guards/gmc-recognition.guards';
import { evaluateGMCRecognition } from '../core/gmc-recognition.logic';
import {
    createBaseAuditEvent,
    validateAuditEvent,
    AuditEventType,
    GMCRecognitionEvaluatedEvent,
    GMCRecognitionFlaggedEvent,
    GMCRecognitionDeniedEvent
} from '../core/audit.types';

export interface GMCRecognitionServiceParams {
    readonly auctionEventId: string;
    readonly auctionStatus: AuctionEventStatus;
    readonly participantId: string;
    readonly mcSnapshot: readonly MCState[];
}

export interface GMCRecognitionServiceResult {
    readonly decision: GMCRecognitionDecision | null;
    readonly events: any[];
}

export class GMCRecognitionBridgeService {

    /**
     * Evaluate Recognition for a completed Auction Event Participant
     */
    public evaluateRecognition(params: GMCRecognitionServiceParams): GMCRecognitionServiceResult {
        const timestamp = new Date();
        const { auctionEventId, auctionStatus, participantId, mcSnapshot } = params;

        // 1. Inject Random Factor (System Source of Non-Determinism)
        const randomFactor = Math.random();

        const context: GMCRecognitionContext = {
            auctionEventId,
            auctionStatus,
            participantId,
            mcSnapshot,
            randomFactor,
            now: timestamp
        };

        const events: any[] = [];

        try {
            // 2. Guards
            guardAuctionClosed(context);
            guardParticipantValid(context);
            guardMCSnapshotPresent(context);

            // 3. Logic
            const decision = evaluateGMCRecognition(context);

            // 4. Audit (Evaluated)
            const baseEvent = createBaseAuditEvent(
                AuditEventType.GMC_RECOGNITION_EVALUATED,
                'SYSTEM',
                'SYSTEM'
            );

            const evaluatedEvent: GMCRecognitionEvaluatedEvent = {
                ...baseEvent,
                eventId: randomUUID(),
                eventType: AuditEventType.GMC_RECOGNITION_EVALUATED,
                auctionEventId,
                participantId,
                mcSnapshot, // Read-only snapshot
                status: decision.status,
                evaluatedAt: decision.evaluatedAt
            };

            validateAuditEvent(evaluatedEvent);
            events.push(evaluatedEvent);

            // 5. Audit (Flagged - Signal)
            if (decision.status === GMCRecognitionStatus.ELIGIBLE) {
                const flaggedEvent: GMCRecognitionFlaggedEvent = {
                    ...createBaseAuditEvent(AuditEventType.GMC_RECOGNITION_FLAGGED, 'SYSTEM', 'SYSTEM'),
                    eventId: randomUUID(),
                    eventType: AuditEventType.GMC_RECOGNITION_FLAGGED,
                    auctionEventId,
                    participantId,
                    mcSnapshot,
                    trigger: decision.trigger || GMCRecognitionTrigger.PROBABILISTIC_CHECK,
                    flaggedAt: timestamp
                };
                validateAuditEvent(flaggedEvent);
                events.push(flaggedEvent);
                // In real system: Notify Human Admins
            }

            return { decision, events };

        } catch (error) {
            // Handle Denials (Guard Failures)
            if (error instanceof GMCRecognitionError) {
                const deniedEvent: GMCRecognitionDeniedEvent = {
                    ...createBaseAuditEvent(AuditEventType.GMC_RECOGNITION_DENIED, 'SYSTEM', 'SYSTEM'),
                    eventId: randomUUID(),
                    eventType: AuditEventType.GMC_RECOGNITION_DENIED,
                    auctionEventId,
                    participantId,
                    mcSnapshot,
                    denialReason: error.reason,
                    deniedAt: timestamp
                };
                validateAuditEvent(deniedEvent);
                events.push(deniedEvent);

                const decision: GMCRecognitionDecision = {
                    status: GMCRecognitionStatus.DENIED,
                    deniedReason: error.reason,
                    evaluatedAt: timestamp
                };

                return { decision, events };
            }
            throw error;
        }
    }
}

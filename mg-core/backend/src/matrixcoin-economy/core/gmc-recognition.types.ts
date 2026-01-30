/**
 * GMC Recognition Types
 * Module 08 — MatrixCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 * 
 * ⚠️ CANONICAL: Types for Recognition Bridge.
 * NOT for granting. ONLY for evaluation signal.
 */

import { MCState } from './mc.types';
import { AuctionEventStatus, GMCRecognitionStatus, GMCRecognitionDeniedReason, GMCRecognitionTrigger } from './economy.enums';

/**
 * Context required to evaluate GMC Recognition
 * Must be pure data from completed Auction.
 */
export interface GMCRecognitionContext {
    /** Auction Event ID being evaluated */
    readonly auctionEventId: string;

    /** Auction Final Status */
    readonly auctionStatus: AuctionEventStatus;

    /** 
     * List of participants to evaluate 
     * In minimal scope, maybe evaluating per participant or event?
     * Prompt says "Was this Auction event flagged...", but also "participantId" in audit.
     * Logic usually evaluates per event or per participant.
     * "participantId" in audit implies per-participant check.
     * We will allow passing a specific participant or evaluating the event for potential.
     * Let's assume per-participant evaluation context.
     */
    readonly participantId: string;

    /** Participant's MC Snapshot at time of auction close */
    readonly mcSnapshot: readonly MCState[];

    /**
     * Injected randomness for non-deterministic check
     * 0.0 to 1.0
     */
    readonly randomFactor: number;

    /** Timestamp of evaluation */
    readonly now: Date;
}

/**
 * Result of GMC Recognition Evaluation
 */
export interface GMCRecognitionDecision {
    /** Status of decision */
    readonly status: GMCRecognitionStatus;

    /** If denied, why? */
    readonly deniedReason?: GMCRecognitionDeniedReason;

    /** Trigger type if ELIGIBLE */
    readonly trigger?: GMCRecognitionTrigger;

    /** Timestamp */
    readonly evaluatedAt: Date;
}

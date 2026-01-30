/**
 * Auction Core Types
 * Module 08 — MatrixCoin-Economy
 * STEP 3.2 — AUCTION (EVENT LOGIC)
 * 
 * ⚠️ CANONICAL: Defines inputs/outputs for Auction Logic.
 * PURE DOMAIN TYPES. No DB.
 */

import { MCState } from './mc.types';
import {
    AuctionEventStatus,
    AuctionParticipationOutcome,
    AuctionDeniedReason
} from './economy.enums';
import { StoreAccessDecision } from './store.types';

/**
 * Context required to evaluate Auction Event Logic
 * Must carry all necessary state snapshot.
 */
export interface AuctionEventContext {
    /** Unique Event ID */
    readonly eventId: string;

    /** Current status of the event */
    readonly status: AuctionEventStatus;

    /** Start time of the window */
    readonly startsAt: Date;

    /** End time of the window */
    readonly endsAt: Date;

    /** Current server time (for pure evaluation) */
    readonly now: Date;

    /** 
     * Injectable randomness factor (0.0 to 1.0)
     * Must be provided by service/system.
     * Logic is pure deterministic transformation of this factor.
     */
    readonly randomFactor: number;
}

/**
 * Participant Context
 */
export interface AuctionParticipant {
    readonly userId: string;

    /** 
     * User's MC Snapshot 
     * MUST be fresh from DB (read-only)
     */
    readonly mcSnapshot: readonly MCState[];

    /**
     * Store Access Decision for this user
     * User MUST be ELIGIBLE to participate
     */
    readonly storeAccessDecision: StoreAccessDecision;
}

/**
 * Result of Auction Participation
 */
export interface AuctionEventResult {
    /** Did the participation succeed (logic executed)? */
    readonly success: boolean;

    /** If success, what was the outcome? */
    readonly outcome?: AuctionParticipationOutcome;

    /** If failed, why? */
    readonly deniedReason?: AuctionDeniedReason;

    /** 
     * Amount of MC consumed (burned/spent) 
     * Calculated based on logic (e.g. fixed cost or all liquid)
     * For Step 3.2 minimal logic, we assume 1 MC cost or specific cost?
     * Prompt says "NO prices". 
     * Actually "You MUST NOT introduce prices...".
     * But participation consumes MC (Lost = Burned).
     * If Won = ? (Prompt: "It does NOT answer who wins, what they get").
     * Wait, "AuctionParticipationOutcome" has WON/LOST. 
     * If LOST -> MC spent.
     * If WON -> MC spent? Usually auctions spend bid.
     * Prompt says "Auction ... producing audit-only outcomes".
     * "It does NOT answer ... what they get".
     * But "Results describe event facts only".
     * I will include `mcConsumedIds` to indicate which MCs are spent/affected.
     */
    readonly mcConsumedIds: readonly string[];

    /** timestamp of result */
    readonly timestamp: Date;
}

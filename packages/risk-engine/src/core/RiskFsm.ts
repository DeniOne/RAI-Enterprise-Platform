import { RiskVerdict } from '@rai/prisma-client';

export enum RiskFsmState {
    CLEAR = 'CLEAR',
    OBSERVED = 'OBSERVED',
    ELEVATED = 'ELEVATED',
    CRITICAL = 'CRITICAL',
    BLOCKED = 'BLOCKED',
    RESOLVED = 'RESOLVED'
}

export class RiskFsm {
    /**
     * Maps FSM State to Risk Verdict (B6 Canon).
     */
    static getVerdict(state: RiskFsmState): RiskVerdict {
        switch (state) {
            case RiskFsmState.CLEAR:
            case RiskFsmState.OBSERVED:
            case RiskFsmState.RESOLVED:
                return RiskVerdict.ALLOWED;
            case RiskFsmState.ELEVATED:
                return RiskVerdict.CONDITIONAL;
            case RiskFsmState.CRITICAL:
                return RiskVerdict.RESTRICTED;
            case RiskFsmState.BLOCKED:
                return RiskVerdict.BLOCKED;
            default:
                return RiskVerdict.BLOCKED; // Safety fallback
        }
    }

    /**
     * Determines if a transition is valid (Escalation/De-escalation logic).
     * @param current The current state.
     * @param next The computed next state based on signals.
     * @returns The actual next state to transition to (preventing jumps if necessary).
     */
    static transition(current: RiskFsmState, next: RiskFsmState): RiskFsmState {
        // 1. Direct jumps to BLOCKED are always allowed (Safety Constraint)
        if (next === RiskFsmState.BLOCKED) return RiskFsmState.BLOCKED;

        // 2. Resolutions (RESOLVED) must come from OBSERVED
        if (next === RiskFsmState.RESOLVED) {
            if (current === RiskFsmState.OBSERVED) return RiskFsmState.RESOLVED;
            // If we are higher than OBSERVED, we cannot resolve yet. We must de-escalate first.
            return this.deescalate(current);
        }

        // 3. Escalation: Can only go up one step at a time? 
        // User Canon: "Перепрыгивать состояния нельзя (кроме прямого → BLOCKED)"
        if (this.getRank(next) > this.getRank(current) + 1) {
            // Force stepwise escalation
            // Example: CLEAR (0) -> CRITICAL (3) => Target is 3, Current is 0. 
            // We should go to OBSERVED (1) first? 
            // Or maybe ELEVATED? 
            // Let's implement strict +1 step logic for continuity.
            return this.getStateByRank(this.getRank(current) + 1);
        }

        // 4. De-escalation: Can only go down one step at a time?
        // User Canon: "Никогда напрямую BLOCKED → CLEAR"
        if (this.getRank(next) < this.getRank(current) - 1) {
            // Force stepwise de-escalation
            return this.getStateByRank(this.getRank(current) - 1);
        }

        return next;
    }

    private static getRank(state: RiskFsmState): number {
        switch (state) {
            case RiskFsmState.CLEAR: return 0;
            case RiskFsmState.RESOLVED: return 0; // Treated same as CLEAR for rank base
            case RiskFsmState.OBSERVED: return 1;
            case RiskFsmState.ELEVATED: return 2;
            case RiskFsmState.CRITICAL: return 3;
            case RiskFsmState.BLOCKED: return 4;
            default: return 99;
        }
    }

    private static getStateByRank(rank: number): RiskFsmState {
        switch (rank) {
            case 0: return RiskFsmState.CLEAR;
            case 1: return RiskFsmState.OBSERVED;
            case 2: return RiskFsmState.ELEVATED;
            case 3: return RiskFsmState.CRITICAL;
            case 4: return RiskFsmState.BLOCKED;
            default: return RiskFsmState.BLOCKED;
        }
    }

    private static deescalate(current: RiskFsmState): RiskFsmState {
        const rank = this.getRank(current);
        if (rank <= 0) return RiskFsmState.CLEAR;
        return this.getStateByRank(rank - 1);
    }
}

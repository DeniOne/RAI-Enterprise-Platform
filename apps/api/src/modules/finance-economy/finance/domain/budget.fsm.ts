import {
    StateMachine,
    TransitionDef,
    StateMetadata,
    InvalidTransitionError,
} from "../../../../shared/state-machine/state-machine.interface";
import { BudgetStatus } from "@rai/prisma-client";
export { BudgetStatus };

export enum BudgetEvent {
    APPROVE = "APPROVE",
    ACTIVATE = "ACTIVATE",
    EXHAUST = "EXHAUST",
    REPLENISH = "REPLENISH",
    BLOCK = "BLOCK",
    UNBLOCK = "UNBLOCK",
    CLOSE = "CLOSE",
}

export interface BudgetEntity {
    id: string;
    status: BudgetStatus;
    limit: number;
    consumed: number;
}

export const BUDGET_STATE_METADATA: Record<BudgetStatus, StateMetadata<BudgetStatus>> = {
    [BudgetStatus.DRAFT]: {
        id: BudgetStatus.DRAFT,
        name: "Draft",
        nameRu: "Черновик",
        order: 1,
        isTerminal: false,
    },
    [BudgetStatus.APPROVED]: {
        id: BudgetStatus.APPROVED,
        name: "Approved",
        nameRu: "Утвержден",
        order: 2,
        isTerminal: false,
    },
    [BudgetStatus.ACTIVE]: {
        id: BudgetStatus.ACTIVE,
        name: "Active",
        nameRu: "Активен",
        order: 3,
        isTerminal: false,
    },
    [BudgetStatus.EXHAUSTED]: {
        id: BudgetStatus.EXHAUSTED,
        name: "Exhausted",
        nameRu: "Исчерпан",
        order: 4,
        isTerminal: false,
    },
    [BudgetStatus.BLOCKED]: {
        id: BudgetStatus.BLOCKED,
        name: "Blocked",
        nameRu: "Заблокирован",
        order: 5,
        isTerminal: false,
    },
    [BudgetStatus.CLOSED]: {
        id: BudgetStatus.CLOSED,
        name: "Closed",
        nameRu: "Закрыт",
        order: 6,
        isTerminal: true,
    },
    [BudgetStatus.LOCKED]: {
        id: BudgetStatus.LOCKED,
        name: "Locked",
        nameRu: "Заблокирован (LOCKED)",
        order: 7,
        isTerminal: true,
    },
};

const BUDGET_TRANSITIONS: TransitionDef<BudgetStatus, BudgetEvent>[] = [
    { from: BudgetStatus.DRAFT, event: BudgetEvent.APPROVE, to: BudgetStatus.APPROVED },
    { from: BudgetStatus.APPROVED, event: BudgetEvent.ACTIVATE, to: BudgetStatus.ACTIVE },

    { from: BudgetStatus.ACTIVE, event: BudgetEvent.EXHAUST, to: BudgetStatus.EXHAUSTED },
    { from: BudgetStatus.ACTIVE, event: BudgetEvent.BLOCK, to: BudgetStatus.BLOCKED },
    { from: BudgetStatus.ACTIVE, event: BudgetEvent.CLOSE, to: BudgetStatus.CLOSED },

    { from: BudgetStatus.EXHAUSTED, event: BudgetEvent.REPLENISH, to: BudgetStatus.ACTIVE },
    { from: BudgetStatus.EXHAUSTED, event: BudgetEvent.CLOSE, to: BudgetStatus.CLOSED },

    { from: BudgetStatus.BLOCKED, event: BudgetEvent.UNBLOCK, to: BudgetStatus.ACTIVE },
    { from: BudgetStatus.BLOCKED, event: BudgetEvent.CLOSE, to: BudgetStatus.CLOSED },
];

class BudgetStateMachineImpl implements StateMachine<BudgetEntity, BudgetStatus, BudgetEvent> {
    private transitionMap: Map<string, BudgetStatus>;

    constructor() {
        this.transitionMap = new Map();
        for (const t of BUDGET_TRANSITIONS) {
            const key = `${t.from}|${t.event}`;
            this.transitionMap.set(key, t.to);
        }
    }

    canTransition(state: BudgetStatus, event: BudgetEvent): boolean {
        const key = `${state}|${event}`;
        return this.transitionMap.has(key);
    }

    transition(entity: BudgetEntity, event: BudgetEvent): BudgetEntity {
        const key = `${entity.status}|${event}`;
        const targetState = this.transitionMap.get(key);

        if (!targetState) {
            throw new InvalidTransitionError(entity.status, event);
        }

        return {
            ...entity,
            status: targetState,
        };
    }

    getAvailableEvents(state: BudgetStatus): BudgetEvent[] {
        return BUDGET_TRANSITIONS
            .filter(t => t.from === state)
            .map(t => t.event);
    }

    getState(entity: BudgetEntity): BudgetStatus {
        return entity.status;
    }

    isTerminal(state: BudgetStatus): boolean {
        return BUDGET_STATE_METADATA[state].isTerminal;
    }
}

export const BudgetStateMachine = new BudgetStateMachineImpl();

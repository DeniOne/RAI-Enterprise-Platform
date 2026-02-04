/**
 * Task State Machine - Event-Driven FSM for Task lifecycle.
 *
 * PURITY: This is a pure mechanism.
 * - NO PrismaService
 * - NO @Injectable
 * - NO database access
 */
import {
    StateMachine,
    TransitionDef,
    StateMetadata,
    InvalidTransitionError,
} from "./state-machine.interface";

// Re-using Prisma enum directly for compatibility
import { TaskStatus } from "@prisma/client";

/**
 * Task events that trigger state transitions.
 */
export enum TaskEvent {
    ASSIGN = "ASSIGN",         // Assign task to worker
    START = "START",           // Start working on task
    COMPLETE = "COMPLETE",     // Mark as completed
    CANCEL = "CANCEL",         // Cancel task
    REOPEN = "REOPEN",         // Reopen cancelled task (admin only)
}

/**
 * Task entity shape for FSM (minimal interface).
 */
export interface TaskEntity {
    id: string;
    status: TaskStatus;
}

/**
 * State metadata for Task statuses.
 */
export const TASK_STATE_METADATA: Record<TaskStatus, StateMetadata<TaskStatus>> = {
    [TaskStatus.PENDING]: {
        id: TaskStatus.PENDING,
        name: "Pending",
        nameRu: "Ожидает",
        order: 1,
        isTerminal: false,
    },
    [TaskStatus.IN_PROGRESS]: {
        id: TaskStatus.IN_PROGRESS,
        name: "In Progress",
        nameRu: "В работе",
        order: 2,
        isTerminal: false,
    },
    [TaskStatus.COMPLETED]: {
        id: TaskStatus.COMPLETED,
        name: "Completed",
        nameRu: "Завершено",
        order: 3,
        isTerminal: true,
    },
    [TaskStatus.CANCELLED]: {
        id: TaskStatus.CANCELLED,
        name: "Cancelled",
        nameRu: "Отменено",
        order: 4,
        isTerminal: true,
    },
};

/**
 * Valid state transitions for Task.
 */
const TASK_TRANSITIONS: TransitionDef<TaskStatus, TaskEvent>[] = [
    // PENDING → can be started, cancelled, or assigned (assign doesn't change state)
    { from: TaskStatus.PENDING, event: TaskEvent.ASSIGN, to: TaskStatus.PENDING },
    { from: TaskStatus.PENDING, event: TaskEvent.START, to: TaskStatus.IN_PROGRESS },
    { from: TaskStatus.PENDING, event: TaskEvent.CANCEL, to: TaskStatus.CANCELLED },

    // IN_PROGRESS → can be completed, cancelled or re-assigned
    { from: TaskStatus.IN_PROGRESS, event: TaskEvent.ASSIGN, to: TaskStatus.IN_PROGRESS },
    { from: TaskStatus.IN_PROGRESS, event: TaskEvent.COMPLETE, to: TaskStatus.COMPLETED },
    { from: TaskStatus.IN_PROGRESS, event: TaskEvent.CANCEL, to: TaskStatus.CANCELLED },

    // CANCELLED → can be reopened (admin action)
    { from: TaskStatus.CANCELLED, event: TaskEvent.REOPEN, to: TaskStatus.PENDING },
];

/**
 * Task State Machine implementation.
 */
class TaskStateMachineImpl implements StateMachine<TaskEntity, TaskStatus, TaskEvent> {
    private transitionMap: Map<string, TaskStatus>;

    constructor() {
        this.transitionMap = new Map();
        for (const t of TASK_TRANSITIONS) {
            const key = `${t.from}|${t.event}`;
            this.transitionMap.set(key, t.to);
        }
    }

    canTransition(state: TaskStatus, event: TaskEvent): boolean {
        const key = `${state}|${event}`;
        return this.transitionMap.has(key);
    }

    transition(entity: TaskEntity, event: TaskEvent): TaskEntity {
        const key = `${entity.status}|${event}`;
        const targetState = this.transitionMap.get(key);

        if (!targetState) {
            throw new InvalidTransitionError(entity.status, event);
        }

        // Return NEW entity (immutable)
        return {
            ...entity,
            status: targetState,
        };
    }

    getAvailableEvents(state: TaskStatus): TaskEvent[] {
        const events: TaskEvent[] = [];
        for (const t of TASK_TRANSITIONS) {
            if (t.from === state && !events.includes(t.event)) {
                events.push(t.event);
            }
        }
        return events;
    }

    getState(entity: TaskEntity): TaskStatus {
        return entity.status;
    }

    isTerminal(state: TaskStatus): boolean {
        return TASK_STATE_METADATA[state].isTerminal;
    }
}

/**
 * Singleton instance of Task State Machine.
 * Use this instead of creating new instances.
 */
export const TaskStateMachine = new TaskStateMachineImpl();

/**
 * Unit tests for Unified State Machine implementations.
 *
 * VERIFICATION:
 * - FSM purity (no Prisma/Service imports)
 * - Event-driven transitions work correctly
 * - Invalid transitions throw errors
 */
import { TaskStateMachine, TaskEvent, TaskEntity } from "./task-state-machine";
import { AplStateMachine, AplEvent, AplStage, SeasonEntity } from "./apl-state-machine";
import { InvalidTransitionError } from "./state-machine.interface";
import { TaskStatus } from "@rai/prisma-client";

describe("TaskStateMachine", () => {
    describe("canTransition", () => {
        it("should allow START from PENDING", () => {
            expect(TaskStateMachine.canTransition(TaskStatus.PENDING, TaskEvent.START)).toBe(true);
        });

        it("should allow COMPLETE from IN_PROGRESS", () => {
            expect(TaskStateMachine.canTransition(TaskStatus.IN_PROGRESS, TaskEvent.COMPLETE)).toBe(true);
        });

        it("should NOT allow START from COMPLETED", () => {
            expect(TaskStateMachine.canTransition(TaskStatus.COMPLETED, TaskEvent.START)).toBe(false);
        });

        it("should NOT allow COMPLETE from PENDING", () => {
            expect(TaskStateMachine.canTransition(TaskStatus.PENDING, TaskEvent.COMPLETE)).toBe(false);
        });
    });

    describe("transition", () => {
        it("should transition PENDING → IN_PROGRESS on START", () => {
            const entity: TaskEntity = { id: "task-1", status: TaskStatus.PENDING };
            const result = TaskStateMachine.transition(entity, TaskEvent.START);

            expect(result.status).toBe(TaskStatus.IN_PROGRESS);
            expect(result.id).toBe("task-1");
            // Original should be unchanged (immutability)
            expect(entity.status).toBe(TaskStatus.PENDING);
        });

        it("should transition IN_PROGRESS → COMPLETED on COMPLETE", () => {
            const entity: TaskEntity = { id: "task-2", status: TaskStatus.IN_PROGRESS };
            const result = TaskStateMachine.transition(entity, TaskEvent.COMPLETE);

            expect(result.status).toBe(TaskStatus.COMPLETED);
        });

        it("should throw on invalid transition", () => {
            const entity: TaskEntity = { id: "task-3", status: TaskStatus.COMPLETED };

            expect(() => TaskStateMachine.transition(entity, TaskEvent.START)).toThrow(InvalidTransitionError);
        });
    });

    describe("getAvailableEvents", () => {
        it("should return START, CANCEL, ASSIGN for PENDING", () => {
            const events = TaskStateMachine.getAvailableEvents(TaskStatus.PENDING);
            expect(events).toContain(TaskEvent.START);
            expect(events).toContain(TaskEvent.CANCEL);
            expect(events).toContain(TaskEvent.ASSIGN);
        });

        it("should return REOPEN for CANCELLED", () => {
            const events = TaskStateMachine.getAvailableEvents(TaskStatus.CANCELLED);
            expect(events).toContain(TaskEvent.REOPEN);
        });

        it("should return empty array for COMPLETED (terminal)", () => {
            const events = TaskStateMachine.getAvailableEvents(TaskStatus.COMPLETED);
            expect(events).toHaveLength(0);
        });
    });

    describe("isTerminal", () => {
        it("should return true for COMPLETED", () => {
            expect(TaskStateMachine.isTerminal(TaskStatus.COMPLETED)).toBe(true);
        });

        it("should return true for CANCELLED", () => {
            expect(TaskStateMachine.isTerminal(TaskStatus.CANCELLED)).toBe(true);
        });

        it("should return false for PENDING", () => {
            expect(TaskStateMachine.isTerminal(TaskStatus.PENDING)).toBe(false);
        });
    });
});

describe("AplStateMachine", () => {
    describe("canTransition", () => {
        it("should allow ADVANCE from SOIL_PREPARATION", () => {
            expect(AplStateMachine.canTransition(AplStage.SOIL_PREPARATION, AplEvent.ADVANCE)).toBe(true);
        });

        it("should allow SKIP_DESICCATION from FULL_MATURITY", () => {
            expect(AplStateMachine.canTransition(AplStage.FULL_MATURITY, AplEvent.SKIP_DESICCATION)).toBe(true);
        });

        it("should NOT allow ADVANCE from POST_HARVEST (terminal)", () => {
            expect(AplStateMachine.canTransition(AplStage.POST_HARVEST, AplEvent.ADVANCE)).toBe(false);
        });

        it("should return false for null state", () => {
            expect(AplStateMachine.canTransition(null, AplEvent.ADVANCE)).toBe(false);
        });
    });

    describe("transition", () => {
        it("should advance SOIL_PREPARATION → FERTILIZATION_BASE", () => {
            const entity: SeasonEntity = { id: "season-1", currentStageId: AplStage.SOIL_PREPARATION };
            const result = AplStateMachine.transition(entity, AplEvent.ADVANCE);

            expect(result.currentStageId).toBe(AplStage.FERTILIZATION_BASE);
            // Immutability check
            expect(entity.currentStageId).toBe(AplStage.SOIL_PREPARATION);
        });

        it("should skip desiccation FULL_MATURITY → HARVEST", () => {
            const entity: SeasonEntity = { id: "season-2", currentStageId: AplStage.FULL_MATURITY };
            const result = AplStateMachine.transition(entity, AplEvent.SKIP_DESICCATION);

            expect(result.currentStageId).toBe(AplStage.HARVEST);
        });

        it("should throw on invalid transition", () => {
            const entity: SeasonEntity = { id: "season-3", currentStageId: AplStage.POST_HARVEST };

            expect(() => AplStateMachine.transition(entity, AplEvent.ADVANCE)).toThrow(InvalidTransitionError);
        });

        it("should throw on null state", () => {
            const entity: SeasonEntity = { id: "season-4", currentStageId: null };

            expect(() => AplStateMachine.transition(entity, AplEvent.ADVANCE)).toThrow(InvalidTransitionError);
        });
    });

    describe("getAvailableEvents", () => {
        it("should return ADVANCE for SOIL_PREPARATION", () => {
            const events = AplStateMachine.getAvailableEvents(AplStage.SOIL_PREPARATION);
            expect(events).toContain(AplEvent.ADVANCE);
        });

        it("should return ADVANCE and SKIP_DESICCATION for FULL_MATURITY", () => {
            const events = AplStateMachine.getAvailableEvents(AplStage.FULL_MATURITY);
            expect(events).toContain(AplEvent.ADVANCE);
            expect(events).toContain(AplEvent.SKIP_DESICCATION);
        });

        it("should return empty for POST_HARVEST (terminal)", () => {
            const events = AplStateMachine.getAvailableEvents(AplStage.POST_HARVEST);
            expect(events).toHaveLength(0);
        });

        it("should return empty for null", () => {
            const events = AplStateMachine.getAvailableEvents(null);
            expect(events).toHaveLength(0);
        });
    });

    describe("isTerminal", () => {
        it("should return true for POST_HARVEST", () => {
            expect(AplStateMachine.isTerminal(AplStage.POST_HARVEST)).toBe(true);
        });

        it("should return false for HARVEST", () => {
            expect(AplStateMachine.isTerminal(AplStage.HARVEST)).toBe(false);
        });

        it("should return false for null", () => {
            expect(AplStateMachine.isTerminal(null)).toBe(false);
        });
    });

    describe("getInitialStage", () => {
        it("should return SOIL_PREPARATION", () => {
            expect(AplStateMachine.getInitialStage()).toBe(AplStage.SOIL_PREPARATION);
        });
    });
});

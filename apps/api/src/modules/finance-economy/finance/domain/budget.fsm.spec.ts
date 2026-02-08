import { BudgetStateMachine, BudgetEvent, BudgetStatus, BudgetEntity } from './budget.fsm';
import { InvalidTransitionError } from '../../../../shared/state-machine/state-machine.interface';

describe('BudgetFSM', () => {
    const mockBudget: BudgetEntity = {
        id: 'budget-1',
        status: BudgetStatus.DRAFT,
        limit: 1000,
        consumed: 0,
    };

    it('should transition from DRAFT to APPROVED via APPROVE', () => {
        const result = BudgetStateMachine.transition(mockBudget, BudgetEvent.APPROVE);
        expect(result.status).toBe(BudgetStatus.APPROVED);
    });

    it('should transition from APPROVED to ACTIVE via ACTIVATE', () => {
        const budget = { ...mockBudget, status: BudgetStatus.APPROVED };
        const result = BudgetStateMachine.transition(budget, BudgetEvent.ACTIVATE);
        expect(result.status).toBe(BudgetStatus.ACTIVE);
    });

    it('should transition from ACTIVE to EXHAUSTED via EXHAUST', () => {
        const budget = { ...mockBudget, status: BudgetStatus.ACTIVE };
        const result = BudgetStateMachine.transition(budget, BudgetEvent.EXHAUST);
        expect(result.status).toBe(BudgetStatus.EXHAUSTED);
    });

    it('should transition from EXHAUSTED back to ACTIVE via REPLENISH', () => {
        const budget = { ...mockBudget, status: BudgetStatus.EXHAUSTED };
        const result = BudgetStateMachine.transition(budget, BudgetEvent.REPLENISH);
        expect(result.status).toBe(BudgetStatus.ACTIVE);
    });

    it('should throw Error for invalid transition (DRAFT -> ACTIVE)', () => {
        expect(() => {
            BudgetStateMachine.transition(mockBudget, BudgetEvent.ACTIVATE);
        }).toThrow(InvalidTransitionError);
    });

    it('should allow terminal state: CLOSED', () => {
        const budget = { ...mockBudget, status: BudgetStatus.ACTIVE };
        const result = BudgetStateMachine.transition(budget, BudgetEvent.CLOSE);
        expect(result.status).toBe(BudgetStatus.CLOSED);
        expect(BudgetStateMachine.isTerminal(result.status)).toBe(true);
    });

    it('should handle BLOCKED state correctly', () => {
        const budget = { ...mockBudget, status: BudgetStatus.ACTIVE };
        const blocked = BudgetStateMachine.transition(budget, BudgetEvent.BLOCK);
        expect(blocked.status).toBe(BudgetStatus.BLOCKED);

        const unblocked = BudgetStateMachine.transition(blocked, BudgetEvent.UNBLOCK);
        expect(unblocked.status).toBe(BudgetStatus.ACTIVE);
    });
});

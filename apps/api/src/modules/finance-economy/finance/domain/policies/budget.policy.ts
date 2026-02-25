import { BudgetEntity } from "../budget.fsm";

/**
 * Budget Policies.
 * Чистая логика проверки ограничений.
 */
export class BudgetPolicy {
  /**
   * Проверка возможности списания из бюджета.
   */
  static canConsume(
    budget: BudgetEntity,
    amount: number,
  ): { allowed: boolean; reason?: string } {
    const remaining = budget.limit - budget.consumed;

    if (amount > remaining) {
      return {
        allowed: false,
        reason: `Insufficient budget. Limit: ${budget.limit}, Consumed: ${budget.consumed}, Requested: ${amount}`,
      };
    }

    return { allowed: true };
  }
}

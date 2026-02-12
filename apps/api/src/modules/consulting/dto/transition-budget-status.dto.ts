import { IsEnum } from 'class-validator';
import { BudgetTransitionEvent } from '../budget-plan.service';

export class TransitionBudgetStatusDto {
    @IsEnum(BudgetTransitionEvent)
    event: BudgetTransitionEvent;
}

import { Module } from '@nestjs/common';
import { FinanceService } from './application/finance.service';
import { BudgetService } from './application/budget.service';

@Module({
    providers: [FinanceService, BudgetService],
    exports: [FinanceService, BudgetService],
})
export class FinanceModule { }

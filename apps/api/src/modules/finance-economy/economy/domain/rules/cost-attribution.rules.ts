import { EconomicEventType } from '@prisma/client';

export interface Attribution {
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    accountCode: string;
}

/**
 * Pure Attribution Rules.
 * Вход: Экономическое событие + Контекст.
 * Выход: Набор проводок (Attributions).
 * ГАРАНТИЯ: Нет доступа к БД, только чистая логика.
 */
export class CostAttributionRules {
    static getAttributions(event: { type: EconomicEventType; amount: number; metadata?: any }): Attribution[] {
        switch (event.type) {
            case 'COST_INCURRED':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'OPERATIONAL_EXPENSE' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'ACCOUNTS_PAYABLE' },
                ];

            case 'REVENUE_RECOGNIZED':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'ACCOUNTS_RECEIVABLE' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'REVENUE' },
                ];

            case 'OBLIGATION_CREATED':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'FUTURE_EXPENSE' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'OBLIGATION' },
                ];

            case 'OBLIGATION_SETTLED':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'OBLIGATION' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'CASH' },
                ];

            case 'RESERVE_ALLOCATED':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'RESERVE' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'CASH' },
                ];

            case 'ADJUSTMENT':
                // Логика корректировки зависит от знака суммы или метаданных
                return [
                    { amount: Math.abs(event.amount), type: event.amount > 0 ? 'DEBIT' : 'CREDIT', accountCode: 'ADJUSTMENT_ACCOUNT' }
                ];

            default:
                return [];
        }
    }
}

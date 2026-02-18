import { EconomicEventType } from '@rai/prisma-client';

export interface Attribution {
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    accountCode: string;
}

/**
 * Pure Attribution Rules.
 * Input: economic event + context.
 * Output: ledger attributions.
 */
export class CostAttributionRules {
    static getAttributions(event: { type: EconomicEventType; amount: number; metadata?: any }): Attribution[] {
        if (!event || !event.type) {
            return [];
        }

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
                // Double-entry adjustment (symmetric postings)
                if (event.amount >= 0) {
                    return [
                        { amount: Math.abs(event.amount), type: 'DEBIT', accountCode: 'ADJUSTMENT_ACCOUNT' },
                        { amount: Math.abs(event.amount), type: 'CREDIT', accountCode: 'EQUITY_RESERVE' },
                    ];
                }
                return [
                    { amount: Math.abs(event.amount), type: 'DEBIT', accountCode: 'EQUITY_RESERVE' },
                    { amount: Math.abs(event.amount), type: 'CREDIT', accountCode: 'ADJUSTMENT_ACCOUNT' },
                ];

            case 'BOOTSTRAP':
                return [
                    { amount: event.amount, type: 'DEBIT', accountCode: 'CASH' },
                    { amount: event.amount, type: 'CREDIT', accountCode: 'EQUITY_RESERVE' },
                ];

            default:
                return [];
        }
    }
}

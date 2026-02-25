'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { useAuthority } from '@/core/governance/AuthorityContext';

interface FinanceMetrics {
    totalBalance: number;
    budgetLimit: number;
    budgetBurnRate: number;
    metrics: {
        safetyMargin: number;
    };
}

export function FinancialMetrics({ finance }: { finance: FinanceMetrics | null }) {
    const { canSign, canOverride } = useAuthority();
    const canViewFinancials = canSign || canOverride;

    if (!canViewFinancials || !finance) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="shadow-sm">
                <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">На счетах</h3>
                <p className="text-3xl font-medium">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(finance.totalBalance)}
                </p>
            </Card>

            <Card>
                <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Лимит бюджета</h3>
                <p className="text-2xl font-medium">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(finance.budgetLimit)}
                </p>
            </Card>

            <Card>
                <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Burn Rate</h3>
                <div className="flex items-end gap-2">
                    <p className="text-2xl font-medium">{(finance.budgetBurnRate * 100).toFixed(1)}%</p>
                    <div className="mb-2 h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full bg-black transition-all duration-500" style={{ width: `${Math.min(finance.budgetBurnRate * 100, 100)}%` }} />
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Запас прочности</h3>
                <p className="text-2xl font-medium text-green-500">{(finance.metrics.safetyMargin * 100).toFixed(0)}%</p>
            </Card>
        </div>
    );
}

import React from 'react';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';

interface SystemStatusBarProps {
    context: DomainUiContext;
}

export function SystemStatusBar({ context }: SystemStatusBarProps) {
    const indicators = [
        { label: 'Production', status: context.activeTechMap ? 'OK' : 'WAIT', active: context.activeTechMap },
        { label: 'Budget', status: context.lockedBudget ? 'LOCKED' : 'OPEN', active: context.lockedBudget },
        { label: 'Deviations', status: context.criticalDeviations > 0 ? `CRITICAL: ${context.criticalDeviations}` : '0', active: context.criticalDeviations === 0, warning: context.criticalDeviations > 0 },
        { label: 'Advisory', status: context.advisoryRiskLevel.toUpperCase(), active: context.advisoryRiskLevel === 'low', warning: context.advisoryRiskLevel !== 'low' }
    ];

    return (
        <div className="flex items-center space-x-2 p-1 bg-gray-50/50 border border-black/5 rounded-2xl w-fit mb-8">
            {indicators.map((ind, idx) => (
                <div
                    key={idx}
                    className={clsx(
                        "px-4 py-1.5 rounded-xl flex items-center space-x-2 transition-all duration-300",
                        ind.warning ? "bg-red-50" : "bg-white shadow-sm"
                    )}
                >
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        {ind.label}:
                    </span>
                    <span className={clsx(
                        "text-xs font-medium",
                        ind.warning ? "text-red-600" : (ind.active ? "text-green-600" : "text-gray-900")
                    )}>
                        {ind.status}
                    </span>
                    <div className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        ind.warning ? "bg-red-500 animate-pulse" : (ind.active ? "bg-green-500" : "bg-gray-300")
                    )} />
                </div>
            ))}
        </div>
    );
}

import React from 'react';
import clsx from 'clsx';

export type StateType = 'OK' | 'ATTENTION' | 'BLOCKED' | 'DRAFT' | 'APPROVED';

interface StateBadgeProps {
    state: StateType;
    label?: string;
    className?: string;
}

const stateConfig: Record<StateType, { color: string; bg: string; border: string; label: string }> = {
    OK: { color: '#00A3A3', bg: '#F0FFFF', border: 'rgba(0, 163, 163, 0.1)', label: 'В НОРМЕ' },
    ATTENTION: { color: '#B29700', bg: '#FFFBE6', border: 'rgba(178, 151, 0, 0.1)', label: 'ВНИМАНИЕ' },
    BLOCKED: { color: '#D4004F', bg: '#FFF0F6', border: 'rgba(212, 0, 79, 0.1)', label: 'ЗАБЛОКИРОВАНО' },
    DRAFT: { color: '#666666', bg: '#F5F5F5', border: 'rgba(0, 0, 0, 0.05)', label: 'ЧЕРНОВИК' },
    APPROVED: { color: '#00854A', bg: '#F6FFED', border: 'rgba(0, 133, 74, 0.1)', label: 'ОДОБРЕНО' },
};

export function StateBadge({ state, label, className }: StateBadgeProps) {
    const config = stateConfig[state] || stateConfig.OK;

    return (
        <div
            className={clsx(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] uppercase tracking-[0.1em] font-medium transition-all duration-300",
                className
            )}
            style={{
                backgroundColor: config.bg,
                borderColor: config.border,
                color: config.color,
                boxShadow: `0 1px 2px rgba(0,0,0,0.02)`
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            {label || config.label}
        </div>
    );
}

import React from 'react';
import clsx from 'clsx';

export type StateType = 'OK' | 'ATTENTION' | 'BLOCKED' | 'DRAFT' | 'APPROVED';

interface StateBadgeProps {
    state: StateType;
    label?: string;
    className?: string;
}

const stateConfig: Record<StateType, { color: string; bg: string; border: string }> = {
    OK: { color: '#00F0FF', bg: 'rgba(0, 240, 255, 0.05)', border: 'rgba(0, 240, 255, 0.2)' },
    ATTENTION: { color: '#FFD600', bg: 'rgba(255, 214, 0, 0.05)', border: 'rgba(255, 214, 0, 0.2)' },
    BLOCKED: { color: '#FF005C', bg: 'rgba(255, 0, 92, 0.05)', border: 'rgba(255, 0, 92, 0.2)' },
    DRAFT: { color: '#888', bg: 'rgba(136, 136, 136, 0.05)', border: 'rgba(136, 136, 136, 0.2)' },
    APPROVED: { color: '#00FF94', bg: 'rgba(0, 255, 148, 0.05)', border: 'rgba(0, 255, 148, 0.2)' },
};

export function StateBadge({ state, label, className }: StateBadgeProps) {
    const config = stateConfig[state] || stateConfig.OK;

    return (
        <div
            className={clsx(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-[0.1em] font-medium transition-all duration-300",
                className
            )}
            style={{
                backgroundColor: config.bg,
                borderColor: config.border,
                color: config.color,
                boxShadow: `0 0 10px ${config.bg}`
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            {label || state}
        </div>
    );
}

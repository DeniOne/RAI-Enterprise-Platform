'use client';

import React from 'react';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { useAuthPrincipalStore } from '@/core/governance/Providers';
import { Shield, Activity, Fingerprint } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useSessionIntegrity } from '@/shared/hooks/useSessionIntegrity';
import { formatStatusLabel, formatUiEntityName, formatUserRoleLabel } from '@/lib/ui-language';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GovernanceBarProps {
    contentOffset?: number;
}

export const GovernanceBar: React.FC<GovernanceBarProps> = ({ contentOffset }) => {
    const { currentRole, principalReady } = useAuthPrincipalStore();
    const { canOverride, canApprove } = useAuthority();
    const { integrityStatus } = useSessionIntegrity();
    const resolvedOffset = typeof contentOffset === 'number' ? contentOffset : null;

    return (
        <header
            className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-black/5 bg-white/80 pl-8 pr-8 backdrop-blur-md transition-[padding-left] duration-200"
            style={resolvedOffset ? { paddingLeft: `${resolvedOffset}px` } : undefined}
        >
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-medium tracking-tight">
                        {formatUiEntityName('A-RAI')} <span className="font-normal text-gray-400">Контур управления</span>
                    </span>
                </div>

                <div className="h-4 w-px bg-gray-200" />

                <div className="flex items-center space-x-4 font-mono text-xs text-gray-500">
                    <div className="flex items-center space-x-1.5">
                        <Fingerprint className="h-3.5 w-3.5 text-blue-500" />
                        <span>Трасса: <span className="text-black">активна</span></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <Activity className={cn('h-3.5 w-3.5', integrityStatus === 'VERIFIED' ? 'text-green-500' : 'text-yellow-500')} />
                        <span>ЖУРНАЛ: <span className="text-black uppercase">{formatStatusLabel(integrityStatus)}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1">
                    <div className={cn('h-2 w-2 rounded-full', canOverride ? 'animate-pulse bg-red-500' : 'bg-gray-300')} title="Право ручного переопределения" />
                    <div className={cn('h-2 w-2 rounded-full', canApprove ? 'bg-green-500' : 'bg-gray-300')} title="Право согласования" />
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Права активны</span>
                </div>

                <div className="rounded-xl border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white shadow-lg shadow-black/10">
                    Роль: {principalReady ? formatUserRoleLabel(currentRole) : '...'}
                </div>
            </div>
        </header>
    );
};

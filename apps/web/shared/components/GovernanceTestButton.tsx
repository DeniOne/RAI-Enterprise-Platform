'use client';

import React from 'react';
import { useGovernanceAction } from '@/shared/hooks/useGovernanceAction';
import { ShieldAlert, CheckCircle2, Play, ArrowRight, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const GovernanceTestButton: React.FC = () => {
    const {
        state,
        context,
        initiate,
        approve,
        execute,
        canApprove,
        canExecute,
        isPending
    } = useGovernanceAction('STRATEGIC_PLAN_REGENERATION');

    return (
        <div className="p-8 bg-white border border-black/5 rounded-[32px] shadow-sm max-w-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold tracking-tight mb-1">Strategic Control Test</h2>
                    <p className="text-sm text-gray-400 font-medium">Phase 2: Two-Phase Execution Protocol</p>
                </div>
                <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    state === 'idle' ? "bg-gray-50 border-gray-200 text-gray-400" :
                        state === 'pending' ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse" :
                            state === 'approved' ? "bg-blue-50 border-blue-200 text-blue-600" :
                                "bg-green-50 border-green-200 text-green-600"
                )}>
                    FSM: {String(state)}
                </div>
            </div>

            <div className="space-y-6">
                {/* Step 1: Initiation */}
                <div className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    state === 'idle' ? "border-black/5 bg-gray-50" : "border-green-500/20 bg-green-50/30 opacity-50"
                )}>
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                            <Play className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">1. Инициация действия</p>
                            <p className="text-xs text-gray-400">Генерация TraceID и блокировка UI</p>
                        </div>
                    </div>
                    <button
                        onClick={() => initiate('R3')}
                        disabled={state !== 'idle'}
                        className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform disabled:opacity-0"
                    >
                        START
                    </button>
                </div>

                {/* Step 2: Approval (Pending State) */}
                <div className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    state === 'pending' ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10 scale-[1.02]" :
                        (state === 'approved' || state === 'executed') ? "border-green-500/20 bg-green-50/30 opacity-50" :
                            "border-black/5 opacity-30 grayscale"
                )}>
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-sm text-amber-500">
                            {state === 'pending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-bold">2. Подписка (Quorum)</p>
                            <p className="text-xs text-gray-400">Ожидание подтверждения полномочий</p>
                        </div>
                    </div>
                    {canApprove && (
                        <button
                            onClick={approve}
                            className="px-6 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            APPROVE
                        </button>
                    )}
                </div>

                {/* Step 3: Execution */}
                <div className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    state === 'approved' ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 scale-[1.02]" :
                        state === 'executed' ? "border-green-500 bg-green-50" :
                            "border-black/5 opacity-30 grayscale"
                )}>
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                            <CheckCircle2 className={cn("w-5 h-5", state === 'executed' ? "text-green-500" : "text-blue-500")} />
                        </div>
                        <div>
                            <p className="text-sm font-bold">3. Фиксация в Ledger</p>
                            <p className="text-xs text-gray-400">Окончательное исполнение транзакции</p>
                        </div>
                    </div>
                    {canExecute && (
                        <button
                            onClick={execute}
                            className="px-6 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            EXECUTE
                        </button>
                    )}
                </div>
            </div>

            {isPending && (
                <div className="mt-8 p-4 bg-gray-50 border border-black/5 rounded-2xl font-mono text-[10px] space-y-1 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-gray-400 uppercase font-bold tracking-widest mb-2 border-b border-black/5 pb-1">Governance Context</p>
                    <p><span className="text-blue-500">TRACE_ID:</span> {context.traceId}</p>
                    <p><span className="text-red-500">RISK_STRATA:</span> {context.riskLevel}</p>
                    <p><span className="text-gray-950">OPERATION:</span> {context.operation}</p>
                    <p><span className="text-green-600">STATUS:</span> ESCALATION_IN_PROGRESS</p>
                </div>
            )}
        </div>
    );
};

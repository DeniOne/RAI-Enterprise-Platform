'use client';

import React from 'react';
import { Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExecutionCardProps {
    operation: any;
    onStart: (id: string) => void;
    onComplete: (operation: any) => void;
}

/**
 * ExecutionCard
 * @description Карточка операции исполнения, переработанная согласно UI Design Canon Phase 4.
 * Канон: Light Theme (#FAFAFA), Geist Medium (500), rounded-2xl.
 */
export const ExecutionCard: React.FC<ExecutionCardProps> = ({ operation, onStart, onComplete }) => {
    const status = operation.executionRecord?.status || 'PLANNED';
    const riskLevel = operation.riskLevel || 'R1'; // Phase 4 Injection

    const getStatusStyles = () => {
        switch (status) {
            case 'IN_PROGRESS': return 'border-blue-200 bg-blue-50/50 text-blue-600';
            case 'DONE': return 'border-emerald-200 bg-emerald-50/50 text-emerald-600';
            case 'MISSED': return 'border-rose-200 bg-rose-50/50 text-rose-600';
            default: return 'border-black/5 bg-white text-slate-500';
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'R4': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'R3': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'R2': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'IN_PROGRESS': return <Clock className="w-4 h-4 animate-pulse" />;
            case 'DONE': return <CheckCircle className="w-4 h-4" />;
            case 'MISSED': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className={cn(
            "p-6 rounded-2xl border transition-all duration-300 bg-white hover:shadow-sm",
            getStatusStyles()
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-slate-900">{operation.name}</h3>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-tight",
                            getRiskColor(riskLevel)
                        )}>
                            {riskLevel}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                        {operation.mapStage?.name || 'Операция'} • {new Date(operation.plannedStartTime).toLocaleDateString('ru-RU')}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-black/5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                    {getStatusIcon()}
                    {status === 'PLANNED' ? 'План' : status === 'IN_PROGRESS' ? 'В работе' : 'Готово'}
                </div>
            </div>

            <div className="space-y-1.5 mb-6 pt-2">
                {operation.resources?.map((res: any) => (
                    <div key={res.id} className="flex justify-between text-[11px] py-1 border-b border-black/[0.03] last:border-0 text-slate-600">
                        <span className="font-normal">{res.name}</span>
                        <span className="font-medium text-slate-900">{res.amount || res.plannedAmount} {res.unit}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                {status === 'PLANNED' && (
                    <Button
                        variant="default"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-xs font-medium rounded-xl shadow-none"
                        onClick={() => onStart(operation.id)}
                    >
                        <Play className="w-3.5 h-3.5 fill-current" /> Начать
                    </Button>
                )}

                {status === 'IN_PROGRESS' && (
                    <Button
                        variant="default"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-medium rounded-xl shadow-none"
                        onClick={() => onComplete(operation)}
                    >
                        <CheckCircle className="w-3.5 h-3.5" /> Завершить
                    </Button>
                )}

                {status === 'DONE' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-medium border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Выполнено {new Date(operation.executionRecord?.actualDate).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>
        </div>
    );
};

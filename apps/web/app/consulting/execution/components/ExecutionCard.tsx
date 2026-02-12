'use client';

import React from 'react';
import { Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExecutionCardProps {
    operation: any;
    onStart: (id: string) => void;
    onComplete: (operation: any) => void;
}

export const ExecutionCard: React.FC<ExecutionCardProps> = ({ operation, onStart, onComplete }) => {
    const status = operation.executionRecord?.status || 'PLANNED';

    const getStatusColor = () => {
        switch (status) {
            case 'IN_PROGRESS': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
            case 'DONE': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
            case 'MISSED': return 'border-rose-500/50 bg-rose-500/10 text-rose-400';
            default: return 'border-slate-700 bg-slate-800/50 text-slate-400';
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
        <div className={`p-5 rounded-xl border transition-all duration-300 backdrop-blur-md ${getStatusColor()} hover:shadow-lg hover:shadow-black/20`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{operation.name}</h3>
                    <p className="text-sm text-slate-400">
                        {new Date(operation.plannedStartTime).toLocaleDateString('ru-RU')} • {operation.requiredMachineryType || 'Без техники'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-medium uppercase tracking-wider">
                    {getStatusIcon()}
                    {status === 'PLANNED' ? 'Запланировано' : status === 'IN_PROGRESS' ? 'В процессе' : 'Завершено'}
                </div>
            </div>

            <div className="space-y-2 mb-6">
                {operation.resources?.map((res: any) => (
                    <div key={res.id} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0 text-slate-300">
                        <span>{res.name}</span>
                        <span className="font-mono text-white/70">{res.plannedAmount} {res.unit}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                {status === 'PLANNED' && (
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white gap-2"
                        onClick={() => onStart(operation.id)}
                    >
                        <Play className="w-4 h-4" /> Начать
                    </Button>
                )}

                {status === 'IN_PROGRESS' && (
                    <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                        onClick={() => onComplete(operation)}
                    >
                        <CheckCircle className="w-4 h-4" /> Завершить
                    </Button>
                )}

                {status === 'DONE' && (
                    <div className="flex-1 text-center py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                        Выполнено {new Date(operation.executionRecord?.actualDate).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>
        </div>
    );
};

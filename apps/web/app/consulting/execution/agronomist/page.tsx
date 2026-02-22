'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionCard } from '../components/ExecutionCard';
import { CompletionModal } from '../components/CompletionModal';
import { useGovernanceAction } from '@/shared/hooks/useGovernanceAction';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { TriggeredEffectsPanel } from '@/components/governance/TriggeredEffectsPanel';
import { ConflictPanel } from '@/components/governance/ConflictPanel';
import { Loader2, ShieldCheck, Activity, Filter, AlertTriangle, ThermometerSun, Droplets, Sprout, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ActionHistory } from '@/components/execution/ActionHistory';
import { clsx } from 'clsx';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * AgronomistContour
 * @description Рабочее место агронома: техническое исполнение и контроль агро-метрик.
 * Phase 4: Institutional Control Plane.
 */
export default function AgronomistContour() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [selectedOperation, setSelectedOperation] = useState<any>(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const { currentRole } = useAuthSimulationStore();

    const gov = useGovernanceAction('AGRO_EXECUTION');

    const { data: operations, isLoading, error } = useQuery({
        queryKey: ['consulting', 'active-operations', 'agro'],
        queryFn: () => api.consulting.execution.active().then(res => res.data),
    });

    const startMutation = useMutation({
        mutationFn: (id: string) => api.consulting.execution.start(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
            gov.execute();
        }
    });

    const completeMutation = useMutation({
        mutationFn: (data: any) => api.consulting.execution.complete(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
            setIsCompleteModalOpen(false);
            setSelectedOperation(null);
            gov.execute();
        }
    });

    const handleStart = (id: string) => {
        gov.initiate('R1');
        startMutation.mutate(id);
    };

    const handleCompleteRequest = (operation: any) => {
        setSelectedOperation(operation);
        gov.initiate(operation.riskLevel || 'R2');
        setIsCompleteModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-slate-900">Контур Агронома</h1>
                    </div>
                    <p className="text-sm text-slate-500 font-normal max-w-lg">
                        Технический контроль исполнения техкарт. Агрономические допущения и фиксация био-параметров.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Agro Metrics */}
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-black/5 mr-4">
                        <div className="flex items-center gap-2">
                            <ThermometerSun className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-medium">+24°C</span>
                        </div>
                        <div className="w-px h-4 bg-slate-100" />
                        <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium">62%</span>
                        </div>
                    </div>

                    <button
                        onClick={() => gov.detectConflict()}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-medium hover:bg-rose-100 transition-all font-mono"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" /> DETECT_CONFLICT
                    </button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                <div className="lg:col-span-8 space-y-6">
                    {error ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-rose-100/50">
                            <p className="text-rose-500 font-medium">Ошибка загрузки агро-операций</p>
                        </div>
                    ) : operations?.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-400">Нет активных агро-работ</h3>
                            <p className="text-slate-600 mt-1">Все операции в текущем контуре завершены или ожидают планирования.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {operations?.map((op: any) => (
                                <ExecutionCard
                                    key={op.id}
                                    operation={op}
                                    onStart={handleStart}
                                    onComplete={handleCompleteRequest}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6 sticky top-24">
                    <TriggeredEffectsPanel
                        effects={gov.context.effects}
                        isVisible={gov.state === 'effect_analysis' || gov.context.effects.length > 0}
                    />
                    <ConflictPanel
                        conflicts={gov.context.conflicts}
                        onResolve={gov.resolveConflict}
                        isVisible={gov.state === 'conflict_detected'}
                    />

                    <div className="p-6 bg-white border border-black/5 rounded-2xl">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">Агро-контроль</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Допущения по влажности</span>
                                <span className="text-emerald-600 font-medium">Соблюдено</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Окно внесения СЗР</span>
                                <span className="text-slate-900 font-medium tracking-tight">Открыто</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals & Overlays */}
            {selectedOperation && (
                <CompletionModal
                    isOpen={isCompleteModalOpen}
                    operation={selectedOperation}
                    onClose={() => setIsCompleteModalOpen(false)}
                    onConfirm={(data) => completeMutation.mutate(data)}
                    isSubmitting={completeMutation.isPending}
                />
            )}

            {/* Governance Sticky Bar */}
            {gov.state !== 'idle' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-white border border-black/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
                        <div className={clsx(
                            "p-2.5 rounded-xl text-white",
                            gov.context.riskLevel === 'R4' ? "bg-rose-600" : "bg-emerald-600"
                        )}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                                TRACE: {gov.context.traceId?.slice(0, 8) || '...'}
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                                {gov.isPending ? "Обработка..." : "Подтвердите выполнение"}
                            </p>
                        </div>
                        {gov.canExecute && (
                            <button
                                onClick={gov.execute}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all"
                            >
                                КОММИТ
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExecutionCard } from './components/ExecutionCard';
import { CompletionModal } from './components/CompletionModal';
import { useGovernanceAction } from '@/shared/hooks/useGovernanceAction';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { TriggeredEffectsPanel } from '@/components/governance/TriggeredEffectsPanel';
import { ConflictPanel } from '@/components/governance/ConflictPanel';
import { Loader2, ShieldCheck, Activity, Filter, AlertTriangle, Sprout, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionHistory } from '@/components/execution/ActionHistory';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { clsx } from 'clsx';

import { useRouter } from 'next/navigation';

/**
 * ExecutionHub
 * @description Центральный хаб модуля исполнения техкарт.
 * Фаза 4: Распределение по контурам управления.
 */
export default function ExecutionHub() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedOperation, setSelectedOperation] = useState<any>(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const { currentRole } = useAuthSimulationStore();

    // Временная заглушка ролевой логики для Хаба. 
    // В будущем AuthorityContext будет определять автоматический редирект.
    const navigateToAgro = () => router.push('/consulting/execution/agronomist');
    const navigateToManager = () => router.push('/consulting/execution/manager');

    // Phase 4 Governance Engine
    const gov = useGovernanceAction('EXECUTION_FLOW');

    // Fetch active operations
    const { data: operations, isLoading, error } = useQuery({
        queryKey: ['consulting', 'active-operations'],
        queryFn: () => api.consulting.execution.active().then(res => res.data),
    });

    // Mutations
    const startMutation = useMutation({
        mutationFn: (operationId: string) => api.consulting.execution.start(operationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
            gov.execute(); // Close current FSM cycle if applicable
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
        // Phase 4: Start FSM before action
        gov.initiate('R1');
        startMutation.mutate(id);
    };

    const handleCompleteRequest = (operation: any) => {
        setSelectedOperation(operation);
        // Phase 4: Identify risk level of completion
        const risk = operation.riskLevel || 'R1';
        gov.initiate(risk);
        setIsCompleteModalOpen(true);
    };

    const handleConfirmCompletion = (data: any) => {
        completeMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    const MOCK_HISTORY = []; // Assuming this is defined elsewhere or will be added.

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 group flex items-center">
                        <Activity className="mr-3 text-emerald-500 w-8 h-8" />
                        Execution Hub
                    </h1>
                    <p className="text-slate-500 font-medium flex items-center">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                        Active Harvest Cycle: 2026-ALPHA
                    </p>
                </div>

                {/* Governance Quick Info */}
                <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400">M{i}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Quorum</p>
                        <p className="text-xs font-bold text-slate-900 leading-none mt-1">Institutional</p>
                    </div>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Metrics items could go here */}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Control Column */}
                <div className="col-span-8 space-y-6">
                    {/* Contour Hub Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        <button
                            onClick={navigateToAgro}
                            className="group p-8 bg-white border border-black/5 rounded-[32px] text-left hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all outline-none"
                        >
                            <div className="p-4 bg-emerald-50 rounded-2xl w-fit mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Sprout className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 mb-2">Контур Агронома</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Технический контроль, фиксация агро-параметров и управление допущениями в полевых условиях.
                            </p>
                        </button>

                        <button
                            onClick={navigateToManager}
                            className="group p-8 bg-white border border-black/5 rounded-[32px] text-left hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all outline-none"
                        >
                            <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <BarChart3 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 mb-2">Контур Менеджера</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Операционный мониторинг, управление задержками и контроль дисциплины выполнения работ.
                            </p>
                        </button>
                    </div>

                    {/* Sub-Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-xl font-medium tracking-tight text-slate-900">Общая лента операций</h2>
                            <p className="text-xs text-slate-400 mt-1">Сводный лог всех активных процессов в системе</p>
                        </div>
                    </div>

                    {/* Active Operations List */}
                    <div className="space-y-4">
                        {error ? (
                            <div className="p-12 text-center bg-white rounded-3xl border border-rose-100/50">
                                <p className="text-rose-500 font-medium font-geist">Ошибка загрузки операционных данных</p>
                            </div>
                        ) : operations?.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-3xl border border-black/5">
                                <p className="text-slate-400">Нет активных операций</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
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
                </div>

                {/* Sidebar Analysis Column */}
                <div className="col-span-4 space-y-6">
                    <TriggeredEffectsPanel
                        effects={gov.context.effects}
                        isVisible={gov.state === 'effect_analysis' || gov.context.effects.length > 0}
                    />
                    <ConflictPanel
                        conflicts={gov.context.conflicts}
                        onResolve={gov.resolveConflict}
                        isVisible={gov.state === 'conflict_detected'}
                    />

                    {gov.state === 'idle' && (
                        <div className="p-6 bg-white border border-black/5 rounded-2xl">
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">Статус Governance</p>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <p className="text-xs text-slate-600 font-normal">Система готова к анализу действий</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedOperation && (
                <CompletionModal
                    isOpen={isCompleteModalOpen}
                    operation={selectedOperation}
                    onClose={() => setIsCompleteModalOpen(false)}
                    onConfirm={handleConfirmCompletion}
                    isSubmitting={completeMutation.isPending}
                />
            )}

            {/* Verification State Banner (Institutional Grade) */}
            {gov.state !== 'idle' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in slide-in-from-bottom-5">
                    <div className="bg-white border border-black/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
                        <div className={cn(
                            "p-2.5 rounded-xl text-white",
                            gov.context.riskLevel === 'R4' ? "bg-rose-600" : "bg-blue-600"
                        )}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                Trace ID: {gov.context.traceId || 'Wait...'}
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                                {gov.isPending ? "Идет институциональный анализ..." : "Готов к фиксации в Ledger"}
                            </p>
                        </div>
                        {gov.canExecute && (
                            <button
                                onClick={gov.execute}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-black transition-all shadow-lg shadow-black/10"
                            >
                                Коммит
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

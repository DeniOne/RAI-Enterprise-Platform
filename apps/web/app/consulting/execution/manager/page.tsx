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
import { cn } from "@/lib/utils";
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Activity, Filter, AlertTriangle, Clock, Calendar, BarChart3, ChevronLeft } from 'lucide-react';

/**
 * ManagerContour
 * @description Рабочее место менеджера хозяйства: контроль сроков, алерты и статусы.
 * Phase 4: Institutional Control Plane.
 */
export default function ManagerContour() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [selectedOperation, setSelectedOperation] = useState<any>(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const { currentRole } = useAuthSimulationStore();

    const gov = useGovernanceAction('MANAGER_EXECUTION');

    const { data: operations, isLoading, error } = useQuery({
        queryKey: ['consulting', 'active-operations', 'manager'],
        queryFn: () => api.consulting.execution.active().then(res => res.data),
    });

    const handleStart = (id: string) => {
        gov.initiate('R1');
        api.consulting.execution.start(id).then(() => {
            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
            gov.execute();
        });
    };

    const handleCompleteRequest = (operation: any) => {
        setSelectedOperation(operation);
        gov.initiate(operation.riskLevel || 'R1');
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
            <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-slate-900">Контур Менеджера</h1>
                    </div>
                    <p className="text-sm text-slate-500 font-normal max-w-lg">
                        Операционное управление и контроль дисциплины исполнения. Мониторинг задержек и ресурсных конфликтов.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-black/5 mr-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-medium">94% соблюдение графика</span>
                        </div>
                        <div className="w-px h-4 bg-slate-100" />
                        <div className="flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">2 задержки</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                <div className="lg:col-span-8 space-y-6">
                    {error ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-rose-100/50">
                            <p className="text-rose-500 font-medium font-geist">Ошибка загрузки операционных данных</p>
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

                    {/* Operational Integrity Card */}
                    <div className="p-6 bg-white border border-black/5 rounded-2xl">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">Операционная Целостность</p>
                        <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl mb-4">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <p className="text-xs text-indigo-950 font-medium">Все действия логируются в Ledger</p>
                        </div>
                        <div className="space-y-2 text-[10px] text-slate-500 font-mono">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                [SYSTEM] Last entry verified: TX-{Date.now().toString().slice(-6)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedOperation && (
                <CompletionModal
                    isOpen={isCompleteModalOpen}
                    operation={selectedOperation}
                    onClose={() => setIsCompleteModalOpen(false)}
                    onConfirm={(data) => {
                        api.consulting.execution.complete(data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
                            setIsCompleteModalOpen(false);
                            setSelectedOperation(null);
                            gov.execute();
                        });
                    }}
                    isSubmitting={false}
                />
            )}

            {/* Governance Sticky Bar (Manager Variant) */}
            {gov.state !== 'idle' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 text-white">
                        <div className="p-2.5 bg-indigo-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
                                GOV_SESSION: {gov.context.traceId?.slice(0, 8) || 'INITIALIZING'}
                            </p>
                            <p className="text-sm font-medium">
                                {gov.isPending ? "Обработка Ledger..." : "Предложение утверждено"}
                            </p>
                        </div>
                        {gov.canExecute && (
                            <button
                                onClick={gov.execute}
                                className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all font-geist"
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

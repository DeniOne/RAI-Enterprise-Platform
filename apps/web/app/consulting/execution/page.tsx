'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ExecutionCard } from './components/ExecutionCard';
import { CompletionModal } from './components/CompletionModal';
import { Loader2, Activity, Filter, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ExecutionDashboard() {
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOp, setSelectedOp] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchOperations = async () => {
        try {
            setLoading(true);
            const res = await api.consulting.execution.list();
            setOperations(res.data);
        } catch (err) {
            console.error('Failed to fetch operations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperations();
    }, []);

    const handleStart = async (id: string) => {
        try {
            await api.consulting.execution.start(id);
            fetchOperations();
        } catch (err) {
            alert('Ошибка при начале операции');
        }
    };

    const openCompleteModal = (op: any) => {
        setSelectedOp(op);
        setIsModalOpen(true);
    };

    const handleComplete = async (data: any) => {
        try {
            setSubmitting(true);
            await api.consulting.execution.complete(data);
            setIsModalOpen(false);
            fetchOperations();
        } catch (err) {
            alert('Ошибка при сохранении факта');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Операционный Дашборд</h1>
                        </div>
                        <p className="text-slate-400 max-w-2xl">
                            Управление исполнением технологических карт в реальном времени. Фиксация фактов списания ресурсов и синхронизация с бюджетом.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button onClick={fetchOperations} className="text-slate-400 gap-2 border-slate-700">
                            <RefreshCcw className="w-4 h-4" /> Обновить
                        </Button>
                        <Button className="text-slate-400 border-slate-700 hover:bg-slate-800 gap-2">
                            <Filter className="w-4 h-4" /> Фильтры
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <p className="text-sm text-slate-500 mb-1">Всего операций</p>
                        <p className="text-3xl font-bold text-white">{operations.length}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl">
                        <p className="text-sm text-blue-400 mb-1">В процессе</p>
                        <p className="text-3xl font-bold text-white">
                            {operations.filter(op => op.executionRecord?.status === 'IN_PROGRESS').length}
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                        <p className="text-sm text-emerald-400 mb-1">Выполнено</p>
                        <p className="text-3xl font-bold text-white">
                            {operations.filter(op => op.executionRecord?.status === 'DONE').length}
                        </p>
                    </div>
                </div>

                {/* Operations Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500 animate-pulse">Загрузка операционных данных...</p>
                    </div>
                ) : operations.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-400">Нет активных операций</h3>
                        <p className="text-slate-600 mt-1">Все техкарты на текущий момент либо не утверждены, либо завершены.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {operations.map(op => (
                            <ExecutionCard
                                key={op.id}
                                operation={op}
                                onStart={handleStart}
                                onComplete={openCompleteModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedOp && (
                <CompletionModal
                    isOpen={isModalOpen}
                    operation={selectedOp}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleComplete}
                    isSubmitting={submitting}
                />
            )}
        </div>
    );
}

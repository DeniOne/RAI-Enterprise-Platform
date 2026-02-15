'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import SystemStatusBar from '@/components/consulting/SystemStatusBar';

export default function YieldEntryPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [yieldData, setYieldData] = useState({
        plannedYield: 0,
        actualYield: 0,
        harvestedArea: 0,
        totalOutput: 0,
        marketPrice: 0,
        qualityClass: '1',
        harvestDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await api.consulting.plans();
                // Фильтруем только активные или утвержденные планы
                const activePlans = response.data.filter((p: any) =>
                    ['ACTIVE', 'APPROVED'].includes(p.status)
                );
                setPlans(activePlans);
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const selectedPlan = useMemo(() =>
        plans.find(p => p.id === selectedPlanId),
        [plans, selectedPlanId]);

    useEffect(() => {
        if (selectedPlan) {
            setYieldData(prev => ({
                ...prev,
                plannedYield: selectedPlan.optValue || 0
            }));
        }
    }, [selectedPlan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlanId) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            const techMap = selectedPlan.activeTechMap || selectedPlan.techMaps?.[0];

            const payload = {
                planId: selectedPlanId,
                fieldId: techMap?.fieldId || 'unknown',
                crop: techMap?.crop || 'unknown',
                ...yieldData
            };

            await api.consulting.yield.save(payload);
            setMessage({ type: 'success', text: 'Данные об урожае успешно сохранены и заархивированы в Audit Trail.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Ошибка при сохранении данных' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SystemStatusBar>
            <div className="p-8 max-w-4xl mx-auto font-geist">
                <div className="mb-10">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Ввод данных об урожае</h1>
                    <p className="text-base text-gray-500">Зафиксируйте результаты производства. Финансовый снимок будет сделан автоматически для расчета ROI.</p>
                </div>

                {message && (
                    <div className={`mb-8 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                        } text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-black/5 rounded-[32px] p-10 shadow-sm transition-all hover:shadow-md">
                    <div className="space-y-6">
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2 block">Выберите план уборки</span>
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none appearance-none"
                                required
                            >
                                <option value="">-- Выберите план --</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.id} | {p.account?.name || 'Без имени'} | {p.activeTechMap?.crop || 'Культура не указана'}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                            <div className="space-y-6">
                                <label className="block">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">План. урожайность (ц/га)</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={yieldData.plannedYield}
                                        onChange={(e) => setYieldData({ ...yieldData, plannedYield: Number(e.target.value) })}
                                        className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Факт. урожайность (ц/га)</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={yieldData.actualYield}
                                        onChange={(e) => setYieldData({ ...yieldData, actualYield: Number(e.target.value) })}
                                        className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                    />
                                </label>
                            </div>

                            <div className="space-y-6">
                                <label className="block">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Площадь уборки (га)</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={yieldData.harvestedArea}
                                        onChange={(e) => setYieldData({ ...yieldData, harvestedArea: Number(e.target.value) })}
                                        className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Валовый сбор (тонн)</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={yieldData.totalOutput}
                                        onChange={(e) => setYieldData({ ...yieldData, totalOutput: Number(e.target.value) })}
                                        className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Цена реализации (₽/т)</span>
                                <input
                                    type="number"
                                    value={yieldData.marketPrice}
                                    onChange={(e) => setYieldData({ ...yieldData, marketPrice: Number(e.target.value) })}
                                    className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Дата уборки</span>
                                <input
                                    type="date"
                                    value={yieldData.harvestDate}
                                    onChange={(e) => setYieldData({ ...yieldData, harvestDate: e.target.value })}
                                    className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2 block">Класс качества</span>
                            <select
                                value={yieldData.qualityClass}
                                onChange={(e) => setYieldData({ ...yieldData, qualityClass: e.target.value })}
                                className="mt-2 block w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all appearance-none"
                            >
                                <option value="1">1 Класс (Прод.)</option>
                                <option value="2">2 Класс</option>
                                <option value="3">3 Класс</option>
                                <option value="4">4 Класс (Фураж)</option>
                                <option value="NE">Некондиция</option>
                            </select>
                        </label>
                    </div>

                    <div className="pt-10 border-t border-black/5">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedPlanId}
                            className="w-full py-5 bg-black text-white rounded-[20px] text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            {isSubmitting ? 'Сохранение...' : 'Зафиксировать результат'}
                        </button>
                    </div>
                </form>
            </div>
        </SystemStatusBar>
    );
}

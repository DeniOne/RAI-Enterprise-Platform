'use client';

import React, { useState } from 'react';

export default function YieldEntryPage() {
    const [planId, setPlanId] = useState('');
    const [yieldData, setYieldData] = useState({
        plannedYield: 0,
        actualYield: 0,
        harvestedArea: 0,
        totalOutput: 0,
        marketPrice: 0,
        qualityClass: '1',
        harvestDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Saving yield data:', { planId, ...yieldData });
        // In real app: fetch('/api/consulting/yield', { method: 'POST', ... })
        alert('Данные об урожае сохранены (Демо)');
    };

    return (
        <div className="p-8 max-w-3xl mx-auto font-geist">
            <div className="mb-10">
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Ввод данных об урожае</h1>
                <p className="text-sm text-gray-500">Зафиксируйте результаты производства для расчета KPI и ROI</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">ID Плана</span>
                        <input
                            type="text"
                            value={planId}
                            onChange={(e) => setPlanId(e.target.value)}
                            className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                            placeholder="HP-2026-XXX"
                            required
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">План. урожайность (ц/га)</span>
                            <input
                                type="number"
                                value={yieldData.plannedYield}
                                onChange={(e) => setYieldData({ ...yieldData, plannedYield: Number(e.target.value) })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Факт. урожайность (ц/га)</span>
                            <input
                                type="number"
                                value={yieldData.actualYield}
                                onChange={(e) => setYieldData({ ...yieldData, actualYield: Number(e.target.value) })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Площадь уборки (га)</span>
                            <input
                                type="number"
                                value={yieldData.harvestedArea}
                                onChange={(e) => setYieldData({ ...yieldData, harvestedArea: Number(e.target.value) })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Валовый сбор (тонн)</span>
                            <input
                                type="number"
                                value={yieldData.totalOutput}
                                onChange={(e) => setYieldData({ ...yieldData, totalOutput: Number(e.target.value) })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Цена реализации (₽/т)</span>
                            <input
                                type="number"
                                value={yieldData.marketPrice}
                                onChange={(e) => setYieldData({ ...yieldData, marketPrice: Number(e.target.value) })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Дата уборки</span>
                            <input
                                type="date"
                                value={yieldData.harvestDate}
                                onChange={(e) => setYieldData({ ...yieldData, harvestDate: e.target.value })}
                                className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Класс качества</span>
                        <select
                            value={yieldData.qualityClass}
                            onChange={(e) => setYieldData({ ...yieldData, qualityClass: e.target.value })}
                            className="mt-2 block w-full px-4 py-3 bg-stone-50 border border-black/5 rounded-xl text-sm"
                        >
                            <option value="1">1 Класс</option>
                            <option value="2">2 Класс</option>
                            <option value="3">3 Класс</option>
                            <option value="4">4 Класс (Фураж)</option>
                            <option value="NE">Некондиция</option>
                        </select>
                    </label>
                </div>

                <div className="pt-6 border-t border-black/5">
                    <button
                        type="submit"
                        className="w-full py-4 bg-black text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10"
                    >
                        Сохранить результат
                    </button>
                </div>
            </form>
        </div>
    );
}

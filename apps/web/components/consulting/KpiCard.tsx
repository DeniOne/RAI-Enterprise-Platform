'use client';

import React from 'react';
import clsx from 'clsx';

interface KpiData {
    plannedYield: number;
    actualYield: number;
    yieldDelta: number;
    costPerTon: number;
    profitPerHectare: number;
    roi: number;
    sri: number;
    sriDelta: number;
    hasData: boolean;
}

interface KpiCardProps {
    data?: KpiData;
    isLoading?: boolean;
}

export function KpiCard({ data, isLoading }: KpiCardProps) {
    if (isLoading) return <div className="animate-pulse h-32 bg-gray-50 rounded-2xl" />;

    if (!data || !data.hasData) return (
        <div className="p-6 bg-stone-50/50 border border-dashed border-black/10 rounded-2xl text-center">
            <p className="text-xs text-gray-400 font-normal italic">Нет данных по урожаю для расчета KPI</p>
        </div>
    );

    const { plannedYield, actualYield, yieldDelta, costPerTon, profitPerHectare, roi } = data;

    const roiColor = roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : 'text-amber-600';
    const roiBg = roi > 0 ? 'bg-green-50' : roi < 0 ? 'bg-red-50' : 'bg-amber-50';

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-stone-50/30 border border-black/5 rounded-2xl shadow-sm mt-4">
            <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Урожайность</span>
                <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-gray-900">{actualYield}</span>
                    <span className="text-[10px] text-gray-400">ц/га</span>
                </div>
                <div className={clsx("text-[10px] font-medium", yieldDelta >= 0 ? "text-green-500" : "text-red-500")}>
                    {yieldDelta >= 0 ? '+' : ''}{yieldDelta.toFixed(1)}% к плану ({plannedYield})
                </div>
            </div>

            <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Себестоимость</span>
                <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-gray-900">{costPerTon.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400">₽/т</span>
                </div>
                <p className="text-[10px] text-gray-400">Прямые затраты</p>
            </div>

            <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Прибыль/Га</span>
                <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-gray-900">{profitPerHectare.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400">₽</span>
                </div>
                <p className="text-[10px] text-gray-400">Маржинальность</p>
            </div>

            <div className={clsx("p-3 rounded-xl flex flex-col justify-center items-center text-center", roiBg)}>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">ROI</span>
                <span className={clsx("text-xl font-medium", roiColor)}>
                    {roi.toFixed(1)}%
                </span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl flex flex-col justify-center items-center text-center border border-blue-100/30">
                <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider mb-1">SRI (Soil Health)</span>
                <span className="text-xl font-medium text-blue-600">
                    {data.sri.toFixed(2)}
                </span>
                <div className={clsx("text-[10px] font-medium", data.sriDelta >= 0 ? "text-green-500" : "text-red-500")}>
                    {data.sriDelta >= 0 ? '↑' : '↓'} {(data.sriDelta * 100).toFixed(1)}% Velocity
                </div>
            </div>
        </div>
    );
}

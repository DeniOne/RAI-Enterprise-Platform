'use client';

import React, { useState, useMemo } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';
import clsx from 'clsx';

const MOCK_DEVIATIONS = [
    { id: 'DEV-001', planName: 'Пшеница Озимая (Юг)', type: 'AGRO', severity: 'CRITICAL', title: 'Задержка внесения удобрений > 48ч', status: 'NEW' },
    { id: 'DEV-002', planName: 'Пшеница Озимая (Юг)', type: 'ECON', severity: 'WARNING', title: 'Превышение стоимости ГСМ на 15%', status: 'ANALYSIS' },
    { id: 'DEV-003', planName: 'Кукуруза (Центр)', type: 'AGRO', severity: 'INFO', title: 'Прогноз погоды: заморозки через 5 дней', status: 'RESOLVED' },
];

export default function DeviationsPage() {
    const [deviations] = useState(MOCK_DEVIATIONS);
    const [userRole] = useState<UserRole>('AGRONOMIST');

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 2,
        activeTechMap: true,
        lockedBudget: true,
        criticalDeviations: deviations.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length,
        advisoryRiskLevel: 'high'
    }), [deviations]);

    const groupedDeviations = useMemo(() => {
        return deviations.reduce((acc, dev) => {
            if (!acc[dev.planName]) acc[dev.planName] = [];
            acc[dev.planName].push(dev);
            return acc;
        }, {} as Record<string, typeof MOCK_DEVIATIONS>);
    }, [deviations]);

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Отклонения и Инциденты
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Мониторинг аномалий и операционных рисков в реальном времени
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar */}
            <SystemStatusBar context={domainContext} />

            {/* Main Content */}
            <div className="space-y-10">
                {Object.entries(groupedDeviations).map(([planName, devs]) => (
                    <div key={planName} className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-8 py-5 bg-gray-50/50 border-b border-black/5 flex justify-between items-center">
                            <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                                План: {planName}
                            </h2>
                            <span className="text-[10px] font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-black/5">
                                ИНЦИДЕНТОВ: {devs.length}
                            </span>
                        </div>

                        <div className="p-2">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                                        <th className="px-6 py-3">Тип / ID</th>
                                        <th className="px-6 py-3">Описание инцидента</th>
                                        <th className="px-6 py-3">Критичность</th>
                                        <th className="px-6 py-3">Статус</th>
                                        <th className="px-6 py-3 text-right">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devs.map(dev => (
                                        <tr key={dev.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-gray-900">{dev.type}</span>
                                                    <span className="text-[10px] text-gray-400">{dev.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700 font-normal">{dev.title}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-medium w-fit border",
                                                    dev.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        dev.severity === 'WARNING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                )}>
                                                    {dev.severity}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-500">{dev.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-medium text-black hover:underline underline-offset-4">
                                                    Разбор →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Filter Info */}
            <div className="mt-10 flex items-center space-x-6 text-xs text-gray-400 border-t border-black/5 pt-6">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>CRITICAL: Требует немедленного решения (Decision)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>WARNING: Изменение прогноза экономики</span>
                </div>
            </div>
        </div>
    );
}

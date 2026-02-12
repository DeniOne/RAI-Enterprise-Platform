'use client';

import React, { useState, useMemo } from 'react';
import { TechMapWorkbench } from '@/components/consulting/TechMapWorkbench';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';

const MOCK_TECHMAP = {
    id: 'TM-2026-BETA',
    status: 'ACTIVE' as const,
    operations: [
        { id: 'op1', title: 'Подготовка почвы (дискование)', status: 'DONE' as const },
        { id: 'op2', title: 'Внесение удобрений - Старт', status: 'PENDING' as const },
        { id: 'op3', title: 'Посев озимых', status: 'PENDING' as const },
    ]
};

export default function TechMapsPage() {
    const [techMap] = useState(MOCK_TECHMAP);
    const [userRole] = useState<UserRole>('AGRONOMIST');

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 1,
        activeTechMap: techMap.status === 'ACTIVE',
        lockedBudget: false,
        criticalDeviations: 0,
        advisoryRiskLevel: 'low'
    }), [techMap]);

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Технологические Карты
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Workbench проектирования и контроля технологических операций
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar */}
            <SystemStatusBar context={domainContext} />

            {/* MAIN ACTION: Workbench */}
            <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                <TechMapWorkbench
                    techMap={techMap}
                    userRole={userRole}
                    context={domainContext}
                />
            </div>

            {/* Context Notice */}
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-black/5">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Правила контурного проектирования</h3>
                <ul className="space-y-2">
                    <li className="text-xs text-gray-500 flex items-start space-x-2">
                        <span className="text-black font-medium">•</span>
                        <span>Техкарта переходит в статус <strong>ACTIVE</strong> только после проверки агрономом.</span>
                    </li>
                    <li className="text-xs text-gray-500 flex items-start space-x-2">
                        <span className="text-black font-medium">•</span>
                        <span>При статусе <strong>FROZEN</strong> интерфейс полностью блокирует ввод для предотвращения рассинхронизации.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Технологические Карты</h1>
                    <p className="text-sm text-slate-500 font-normal">
                        Workbench проектирования и контроля технологических операций
                    </p>
                </div>
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

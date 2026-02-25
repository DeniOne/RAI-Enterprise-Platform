'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';
import { useAuthSimulationStore } from '@/core/governance/Providers';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
}

/**
 * @layout AuthenticatedLayout
 * @description Основной макет для авторизованных пользователей.
 * ОБНОВЛЕНО: Интегрирован институциональный слой (GovernanceBar + WorkSurface).
 * Исправлено: Хедер теперь учитывает ширину сайдбара.
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    const { currentRole } = useAuthSimulationStore();

    return (
        <div className="flex bg-[#FAFAFA] min-h-screen text-[#171717] overflow-x-hidden">
            {/* Сайдбар — теперь часть flex-потока */}
            <Sidebar role={currentRole} />

            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
                {/* 
                  Институциональный хедер (GovernanceBar).
                  Теперь он находится в общем потоке и не перекрывается сайдбаром.
                */}
                <GovernanceBar />

                {/* 
                  WorkSurface — это наш институциональный холст.
                  Он включает в себя Эскалационные баннеры и логику блюра.
                */}
                <WorkSurface>
                    {children}
                </WorkSurface>
            </div>
        </div>
    );
}

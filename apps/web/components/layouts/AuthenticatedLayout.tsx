'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
    role: string;
}

/**
 * @layout AuthenticatedLayout
 * @description Основной макет для авторизованных пользователей.
 * ОБНОВЛЕНО: Интегрирован институциональный слой (GovernanceBar + WorkSurface).
 * Исправлено: Хедер теперь учитывает ширину сайдбара.
 */
export function AuthenticatedLayout({ children, role }: AuthenticatedLayoutProps) {
    return (
        <div className="flex bg-[#FAFAFA] min-h-screen text-[#171717] overflow-x-hidden">
            {/* Сайдбар — теперь часть flex-потока */}
            <Sidebar role={role} />

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

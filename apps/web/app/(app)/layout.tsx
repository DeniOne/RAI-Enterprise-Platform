'use client';

import React from 'react';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { Sidebar } from '@/components/navigation/Sidebar';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';
import { AiChatRoot } from '@/components/ai-chat/AiChatRoot';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentRole } = useAuthSimulationStore();

    return (
        <div style={{ display: 'flex', background: '#FAFAFA', minHeight: '100vh', color: '#171717', overflowX: 'hidden' }}>
            <Sidebar role={currentRole} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
                <GovernanceBar />
                <WorkSurface>
                    {children}
                </WorkSurface>
            </div>

            {/* Глобальная точка входа AI-Ассистента */}
            <AiChatRoot />
        </div>
    );
}

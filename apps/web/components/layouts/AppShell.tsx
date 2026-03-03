'use client';

import React from 'react';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { TopNav } from '@/components/navigation/TopNav';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';
import { LeftRaiChatDock } from '@/components/ai-chat/LeftRaiChatDock';
import { RaiOutputOverlay } from '@/components/ai-chat/RaiOutputOverlay';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const { currentRole } = useAuthSimulationStore();

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] text-[#171717]">
            <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-visible">
                <GovernanceBar />
                <TopNav role={currentRole} />
                <WorkSurface>
                    <div className="flex items-start gap-6">
                        <LeftRaiChatDock />
                        <div className="relative min-w-0 flex-1">
                            <div className="min-w-0 flex-1">{children}</div>
                            <RaiOutputOverlay />
                        </div>
                    </div>
                </WorkSurface>
            </div>
        </div>
    );
}

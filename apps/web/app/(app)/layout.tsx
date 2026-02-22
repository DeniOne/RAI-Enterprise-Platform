'use client';

import React from 'react';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { Sidebar } from '@/components/navigation/Sidebar';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentRole } = useAuthSimulationStore();

    return (
        <div className="flex bg-[#FAFAFA] min-h-screen text-[#171717] overflow-x-hidden">
            <Sidebar role={currentRole} />
            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
                <GovernanceBar />
                <WorkSurface>
                    {children}
                </WorkSurface>
            </div>
        </div>
    );
}

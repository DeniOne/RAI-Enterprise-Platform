'use client';

import React from 'react';
import { useAuthPrincipalStore } from '@/core/governance/Providers';
import { TopNav } from '@/components/navigation/TopNav';
import { GovernanceBar } from '@/shared/components/GovernanceBar';
import { WorkSurface } from '@/shared/components/WorkSurface';
import { LeftRaiChatDock } from '@/components/ai-chat/LeftRaiChatDock';
import { RaiOutputOverlay } from '@/components/ai-chat/RaiOutputOverlay';

interface AppShellProps {
    children: React.ReactNode;
    role?: string;
    isExternalFrontOffice?: boolean;
}

export function AppShell({ children, role, isExternalFrontOffice }: AppShellProps) {
    const { currentRole } = useAuthPrincipalStore();
    const effectiveRole = role ?? currentRole;
    const externalContour = isExternalFrontOffice || effectiveRole === 'FRONT_OFFICE_USER';

    if (externalContour) {
        return (
            <div className="h-screen overflow-hidden bg-[#FAFAFA] text-[#171717]">
                <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                    <WorkSurface>
                        <div className="min-w-0 flex-1">{children}</div>
                    </WorkSurface>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-[#FAFAFA] text-[#171717]">
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <GovernanceBar />
                <TopNav role={effectiveRole} />
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

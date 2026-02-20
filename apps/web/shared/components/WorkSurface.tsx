'use client';

import React from 'react';

/**
 * @file WorkSurface.tsx
 * @description Основная область холста. 
 * Включает слот для EscalationBanner (Phase 3) и основной контент.
 */

export const WorkSurface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <main className="flex-1 min-h-[calc(100vh-64px)] bg-[#FDFDFD] p-8 overflow-y-auto relative">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Placeholder for EscalationBanner (Phase 3) */}
                <div className="hidden" id="escalation-target-portal" />

                {/* Main Interface Content */}
                {children}
            </div>
        </main>
    );
};

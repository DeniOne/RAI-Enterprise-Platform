'use client';

import React from 'react';
import { useGovernanceStore } from '../store/governance.store';
import { EscalationBanner } from '../../components/governance/EscalationBanner';
import { QuorumVisualizer } from '../../components/governance/QuorumVisualizer';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * @file WorkSurface.tsx
 * @description Основная область холста. 
 * Включает слот для EscalationBanner (Phase 3) и основной контент.
 */

export const WorkSurface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeEscalation, isQuorumModalOpen, setQuorumModalOpen } = useGovernanceStore();

    return (
        <main className="flex-1 min-h-[calc(100vh-64px)] bg-[#FDFDFD] p-8 overflow-y-auto relative">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Institutional Escalation Banner (Phase 3) */}
                {activeEscalation && (
                    <EscalationBanner
                        level={activeEscalation.level}
                        traceId={activeEscalation.traceId}
                        description={activeEscalation.description}
                        status={activeEscalation.status}
                        onOpenQuorum={() => setQuorumModalOpen(true)}
                    />
                )}

                {/* Main Interface Content */}
                <div className={clsx(
                    "transition-all duration-500",
                    activeEscalation?.level === 'R4' && activeEscalation.status === 'COLLECTING' && "blur-sm pointer-events-none opacity-50"
                )}>
                    {children}
                </div>
            </div>

            {/* Quorum Modal (Institutional Overlay) */}
            {isQuorumModalOpen && activeEscalation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-2xl transform transition-all animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setQuorumModalOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <QuorumVisualizer
                            threshold={activeEscalation.threshold}
                            members={activeEscalation.members}
                        />
                    </div>
                </div>
            )}
        </main>
    );
};

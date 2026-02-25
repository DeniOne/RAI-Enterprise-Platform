'use client';

import React from 'react';
import { useGovernanceStore } from '../store/governance.store';
import { EscalationBanner } from '../../components/governance/EscalationBanner';
import { QuorumVisualizer } from '../../components/governance/QuorumVisualizer';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useSessionIntegrity } from '../hooks/useSessionIntegrity';

/**
 * @file WorkSurface.tsx
 * @description Основная область холста. 
 * Включает слот для EscalationBanner (Phase 3) и основной контент.
 */

export const WorkSurface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeEscalation, isQuorumModalOpen, setQuorumModalOpen } = useGovernanceStore();
    const { integrityStatus, mismatch, traceId } = useSessionIntegrity();
    const isFrozenByIntegrity = integrityStatus === 'MISMATCH';

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
                    (activeEscalation?.level === 'R4' && activeEscalation.status === 'COLLECTING') && "blur-sm pointer-events-none opacity-50",
                    isFrozenByIntegrity && "pointer-events-none opacity-20 blur-[2px]"
                )}>
                    {children}
                </div>
            </div>

            {isFrozenByIntegrity && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-red-950/80 p-6" data-testid="integrity-freeze-overlay">
                    <div className="w-full max-w-3xl rounded-xl border border-red-500 bg-black p-6 text-white shadow-2xl">
                        <h2 className="font-mono text-sm uppercase tracking-widest text-red-300">Integrity Freeze Activated</h2>
                        <p className="mt-3 text-sm text-red-100">
                            Ledger mismatch detected. UI is frozen until forensic replay verification completes.
                        </p>
                        <div className="mt-4 space-y-1 font-mono text-xs text-red-200">
                            <div>TRACE_ID: {traceId}</div>
                            <div>EXPECTED_HASH: {mismatch?.expectedHash ?? 'N/A'}</div>
                            <div>ACTUAL_HASH: {mismatch?.actualHash ?? 'N/A'}</div>
                        </div>
                        <a
                            href={`/forensics/replay?traceId=${encodeURIComponent(traceId)}`}
                            className="mt-5 inline-flex rounded border border-red-400 px-3 py-2 font-mono text-xs text-red-100 hover:bg-red-900/50"
                        >
                            Open Trace Replay
                        </a>
                    </div>
                </div>
            )}

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

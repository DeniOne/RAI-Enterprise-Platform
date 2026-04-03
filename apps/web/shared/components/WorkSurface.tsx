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
    const {
        activeEscalation,
        isQuorumModalOpen,
        setQuorumModalOpen,
        confirmTechCouncilDecision,
        quorumDecisionHandler,
    } = useGovernanceStore();
    const { integrityStatus, mismatch, traceId } = useSessionIntegrity();
    const isFrozenByIntegrity = integrityStatus === 'MISMATCH';

    return (
        <main className="relative min-h-0 flex-1 overflow-y-auto bg-[#FDFDFD] px-8 py-6">
            <div className="w-full space-y-6">
                {/* TechCouncil escalation banner (Phase 3) */}
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
                        <h2 className="font-mono text-sm uppercase tracking-widest text-red-300">Активирована блокировка целостности</h2>
                        <p className="mt-3 text-sm text-red-100">
                            Обнаружено расхождение журнала. Интерфейс заблокирован до завершения проверки воспроизведения трассы.
                        </p>
                        <div className="mt-4 space-y-1 font-mono text-xs text-red-200">
                            <div>Трасса: скрыта в пользовательском контуре</div>
                            <div>Ожидаемый отпечаток: доступен</div>
                            <div>Текущий отпечаток: доступен</div>
                        </div>
                        <a
                            href={`/forensics/replay?traceId=${encodeURIComponent(traceId)}`}
                            className="mt-5 inline-flex rounded border border-red-400 px-3 py-2 font-mono text-xs text-red-100 hover:bg-red-900/50"
                        >
                            Открыть проверку трассировки
                        </a>
                    </div>
                </div>
            )}

            {/* TechCouncil modal overlay */}
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
                            canConfirmDecision={Boolean(quorumDecisionHandler)}
                            onConfirmDecision={() => {
                                const confirmed = confirmTechCouncilDecision();
                                if (confirmed) {
                                    setQuorumModalOpen(false);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </main>
    );
};

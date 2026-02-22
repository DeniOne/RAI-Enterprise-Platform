'use client';

import React from 'react';
import { InstitutionalEffect } from '@/core/governance/InstitutionalContracts';
import { Zap, Shield, Link, Timer } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TriggeredEffectsPanelProps {
    effects: InstitutionalEffect[];
    isVisible: boolean;
}

/**
 * TriggeredEffectsPanel
 * @description Панель визуализации детерминированных эффектов (Phase 4).
 * Канон: Light Theme, Geist, Институциональная прозрачность.
 */
export const TriggeredEffectsPanel: React.FC<TriggeredEffectsPanelProps> = ({ effects, isVisible }) => {
    if (!isVisible || effects.length === 0) return null;

    return (
        <div className="w-full bg-white border border-black/10 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100/50">
                    <Zap className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-900">Deterministic Impact</h3>
                    <p className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">Детерминированные последствия</p>
                </div>
            </div>

            <div className="space-y-3">
                {effects.map((effect) => (
                    <div key={effect.effectId} className="group relative p-4 bg-slate-50/50 rounded-xl border border-black/[0.03] hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-900">{effect.action}</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium border uppercase",
                                        effect.impactLevel === 'R4' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                        {effect.impactLevel}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-normal">Домен: {effect.domain}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-mono text-slate-400">{effect.effectId}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 border-t border-black/[0.02]">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <Timer className="w-3 h-3" />
                                <span>{new Date(effect.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <Shield className="w-3 h-3" />
                                <span>{effect.requiresEscalation ? 'Требуется эскалация' : 'Авто-аппрув'}</span>
                            </div>
                        </div>

                        {effect.immutableHash && (
                            <div className="mt-2 flex items-center gap-2 py-1.5 px-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                <Link className="w-3 h-3 text-emerald-600" />
                                <span className="text-[9px] font-mono text-emerald-700 truncate">
                                    LEDGER_HASH: {effect.immutableHash}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center gap-2 py-2 px-3 bg-blue-50/50 rounded-lg border border-blue-100/30">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[9px] text-blue-600 font-medium tracking-tight">
                    Invariant-4.3: Все эффекты вычислены и хешированы (RFC8785)
                </p>
            </div>
        </div>
    );
};

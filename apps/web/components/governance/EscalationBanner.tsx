'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, Signature, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface EscalationBannerProps {
    level: 'R3' | 'R4';
    traceId: string;
    description: string;
    status: 'COLLECTING' | 'MET' | 'REJECTED';
    onOpenQuorum: (traceId: string) => void;
}

/**
 * EscalationBanner — Институциональный баннер для отображения состояния эскалации.
 * Появляется в верхней части WorkSurface при обнаружении рисков R3/R4.
 * 
 * DESIGN_CANON: 
 * - R4: Red (Semantic Error) + Pulse Animation
 * - R3: Amber (Warning)
 * - MET: Emerald (Success)
 */
export const EscalationBanner: React.FC<EscalationBannerProps> = ({
    level,
    traceId,
    description,
    status,
    onOpenQuorum
}) => {
    const isR4 = level === 'R4';
    const isMet = status === 'MET';

    return (
        <div className={clsx(
            "w-full rounded-xl p-4 mb-6 border-l-4 shadow-sm flex flex-col md:flex-row items-center justify-between transition-all duration-300 animate-in fade-in slide-in-from-top-4",
            isR4 ? "bg-red-50 border-red-500 shadow-red-100" : "bg-amber-50 border-amber-500 shadow-amber-100",
            isMet && "bg-emerald-50 border-emerald-500 shadow-emerald-100"
        )}>
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className={clsx(
                    "p-3 rounded-full shadow-inner",
                    isR4 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600",
                    isMet && "bg-emerald-100 text-emerald-600",
                    !isMet && isR4 && "animate-pulse"
                )}>
                    {isMet ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                </div>

                <div>
                    <div className="flex items-center space-x-2">
                        <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            isR4 ? "bg-red-200 text-red-800 border-red-300" : "bg-amber-200 text-amber-800 border-amber-300",
                            isMet && "bg-emerald-200 text-emerald-800 border-emerald-300"
                        )}>
                            Level {level} Escalation
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">TRC://{traceId.substring(0, 12)}...</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1 flex items-center">
                        {isMet
                            ? "Решение Валидировано Комитетом"
                            : isR4 ? "КРИТИЧЕСКАЯ БЛОКИРОВКА (Hard Lock)" : "ТРЕБУЕТСЯ КВОРУМ (Escalated)"
                        }
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-lg leading-relaxed">{description}</p>
                </div>
            </div>

            <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-right px-4 border-r border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Status</span>
                    <span className={clsx(
                        "text-xs font-bold font-mono",
                        status === 'COLLECTING' ? "text-amber-600" :
                            status === 'MET' ? "text-emerald-600" : "text-red-600"
                    )}>
                        {status}
                    </span>
                </div>

                <button
                    onClick={() => onOpenQuorum(traceId)}
                    className={clsx(
                        "flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                        isR4
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                            : "bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg",
                        isMet && "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg",
                        "transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    )}
                >
                    <Signature size={16} />
                    <span>{isMet ? "Архив Подписей" : "Управление Кворумом"}</span>
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

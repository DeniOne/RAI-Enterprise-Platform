import React from 'react';
import { AlertTriangle, ShieldCheck, FileText, Info } from 'lucide-react';
import clsx from 'clsx';

interface ExplanationReason {
    type: 'LEGAL' | 'FSM' | 'RISK' | 'INFO';
    title: string;
    description: string;
    ref?: string;
    version?: string;
}

interface ExplanationLayerProps {
    reasons: ExplanationReason[];
    className?: string;
}

export function ExplanationLayer({ reasons, className }: ExplanationLayerProps) {
    if (!reasons || reasons.length === 0) return null;

    return (
        <div className={clsx("space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5", className)}>
            <div className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Info size={12} />
                Слой объяснений (Why Layer)
            </div>

            <div className="space-y-3">
                {reasons.map((reason, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="mt-1">
                            {reason.type === 'LEGAL' && <ShieldCheck size={16} className="text-[#FF005C]" />}
                            {reason.type === 'FSM' && <AlertTriangle size={16} className="text-[#FFD600]" />}
                            {reason.type === 'RISK' && <AlertTriangle size={16} className="text-[#FF005C]" />}
                            {reason.type === 'INFO' && <FileText size={16} className="text-white/40" />}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="text-xs font-medium tracking-tight">
                                {reason.title}
                                {reason.ref && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 text-[9px] opacity-60">
                                        {reason.ref}
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] leading-relaxed opacity-60">
                                {reason.description}
                            </div>
                            {reason.version && (
                                <div className="text-[9px] opacity-30 italic">
                                    Версия проверки: {reason.version}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

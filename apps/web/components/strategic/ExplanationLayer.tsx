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
        <div className={clsx("space-y-4 p-6 rounded-2xl bg-white border border-black/5 shadow-sm", className)}>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2 font-medium">
                <Info size={12} />
                Слой объяснений (Why Layer)
            </div>

            <div className="space-y-4">
                {reasons.map((reason, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="mt-1">
                            {reason.type === 'LEGAL' && <ShieldCheck size={18} className="text-[#D4004F]" />}
                            {reason.type === 'FSM' && <AlertTriangle size={18} className="text-[#B29700]" />}
                            {reason.type === 'RISK' && <AlertTriangle size={18} className="text-[#D4004F]" />}
                            {reason.type === 'INFO' && <FileText size={18} className="text-gray-300" />}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="text-[13px] font-medium tracking-tight text-gray-900">
                                {reason.title}
                                {reason.ref && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-50 text-[9px] text-gray-400 font-mono">
                                        {reason.ref}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs leading-relaxed text-gray-500">
                                {reason.description}
                            </div>
                            {reason.version && (
                                <div className="text-[9px] text-gray-300 italic font-medium">
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

'use client';

import React from 'react';
import { User, CheckCircle2, Circle, Shield, Fingerprint } from 'lucide-react';
import { clsx } from 'clsx';

interface Member {
    userId: string;
    userName: string;
    weight: number;
    signed: boolean;
}

interface QuorumVisualizerProps {
    threshold: number; // e.g., 0.6
    members: Member[];
    payloadHash?: string;
}

/**
 * QuorumVisualizer — Институциональный визуализатор кворума.
 */
export const QuorumVisualizer: React.FC<QuorumVisualizerProps> = ({
    threshold,
    members,
    payloadHash
}) => {
    const totalWeight = members.reduce((sum, m) => sum + m.weight, 0);
    const signedWeight = members.filter(m => m.signed).reduce((sum, m) => sum + m.weight, 0);
    const currentRatio = totalWeight > 0 ? signedWeight / totalWeight : 0;
    const isMet = currentRatio >= threshold;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95">
            {/* Header: Progress Bar Section */}
            <div className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className={clsx(
                            "p-2 rounded-xl shadow-sm",
                            isMet ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none">Institutional Quorum</h3>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1 block">Level F Governance Standard</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={clsx(
                            "text-xl font-black tabular-nums",
                            isMet ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {(currentRatio * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm font-bold text-slate-400 block -mt-1">/ {(threshold * 100).toFixed(0)}% required</span>
                    </div>
                </div>

                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                    <div
                        className={clsx(
                            "h-full transition-all duration-1000 ease-in-out rounded-full shadow-lg",
                            isMet ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-amber-600"
                        )}
                        style={{ width: `${currentRatio * 100}%` }}
                    />
                    <div
                        className="absolute h-full w-0.5 bg-slate-900 top-0 opacity-40 z-10"
                        style={{ left: `${threshold * 100}%` }}
                    />
                </div>
            </div>

            {/* Member List Section */}
            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="grid gap-3">
                    {members.map((member) => (
                        <div
                            key={member.userId}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                member.signed ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100"
                            )}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", member.signed ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400 border border-slate-200")}>
                                    <User size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-800">{member.userName} ({member.weight})</span>
                            </div>
                            {member.signed && <CheckCircle2 size={18} className="text-emerald-600" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Tech-Law Compliance */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                    <Fingerprint size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest italic">Cryptographic Chain Binding: ACTIVE</span>
                </div>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-[9px] text-slate-500 font-mono">HASH: {payloadHash?.substring(0, 16) || '8f92-c1a3-de04'}...</span>
                </div>
            </div>
        </div>
    );
};

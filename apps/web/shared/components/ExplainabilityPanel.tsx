'use client';

import React, { useState } from 'react';
import {
    ShieldCheck,
    Info,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Zap,
    Database,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthority } from '@/core/governance/AuthorityContext';

export interface ExplainabilityFactor {
    name: string;
    weight: number;
    impact: number;
    description?: string;
}

export interface Counterfactual {
    scenarioName: string;
    deltaInput: Record<string, any>;
    expectedOutcome: string;
    probabilityShift: number;
}

export interface ForensicMetadata {
    modelVersion: string;
    canonicalHash: string;
    seed: string;
    ledgerId: string;
    signature?: string;
}

export interface AIExplainability {
    confidence: number;
    verdict: string;
    factors: ExplainabilityFactor[];
    counterfactuals?: Counterfactual[];
    forensic?: ForensicMetadata;
    limitationsDisclosed: boolean;
}

interface ExplainabilityPanelProps {
    data: AIExplainability;
    className?: string;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ data, className }) => {
    const [expanded, setExpanded] = useState(false);
    const [showForensic, setShowForensic] = useState(false);
    const { canOverride, canSign } = useAuthority();

    // К форензик-данным имеют доступ только те, кто может подписывать или оверрайдить (аналог RISK_OFFICER/ADMIN)
    const hasForensicAccess = canOverride || canSign;

    const confidencePercent = Math.round(data.confidence * 100);

    return (
        <div className={clsx(
            "bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden transition-all duration-300",
            expanded ? "shadow-xl" : "shadow-sm",
            className
        )}>
            {/* Level 1: Surface (Always Visible) */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center space-x-3">
                    <div className={clsx(
                        "p-2 rounded-xl",
                        confidencePercent > 80 ? "bg-green-50 text-green-600" :
                            confidencePercent > 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                    )}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 leading-tight">AI Обоснование</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Confidence: {confidencePercent}%</span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-1000",
                                        confidencePercent > 80 ? "bg-green-500" :
                                            confidencePercent > 50 ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${confidencePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {data.verdict}
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>

            {/* Level 2: Analytical (Visible on Expand) */}
            {expanded && (
                <div className="p-4 border-t border-white/20 bg-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* Factors Section */}
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <Zap size={14} className="text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ключевые факторы</span>
                        </div>
                        <div className="space-y-2">
                            {data.factors.map((factor, idx) => (
                                <div key={idx} className="bg-white/40 p-3 rounded-xl border border-white/40 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium text-gray-800 block">{factor.name}</span>
                                        {factor.description && (
                                            <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">{factor.description}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={clsx(
                                            "text-xs font-bold",
                                            factor.impact > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                                        </span>
                                        <div className="text-[9px] text-gray-400 font-medium uppercase mt-0.5">Вес: {Math.round(factor.weight * 100)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Counterfactuals Section */}
                    {data.counterfactuals && data.counterfactuals.length > 0 && (
                        <div>
                            <div className="flex items-center space-x-2 mb-3">
                                <Info size={14} className="text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Контрфактуальный анализ</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {data.counterfactuals.map((cf, idx) => (
                                    <div key={idx} className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 flex items-start space-x-3">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                            <AlertCircle size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-blue-900 leading-tight mb-1">Что если: {cf.scenarioName}?</p>
                                            <p className="text-[10px] text-blue-700/70 leading-relaxed italic">
                                                Результат: {cf.expectedOutcome} (Вероятность {cf.probabilityShift > 0 ? 'вырастет' : 'упадет'} на {Math.abs(Math.round(cf.probabilityShift * 100))}%)
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Level 3: Forensic (Gated by Authority) */}
                    {hasForensicAccess && (
                        <div className="pt-2 border-t border-black/5 mt-4">
                            <button
                                onClick={() => setShowForensic(!showForensic)}
                                className="flex items-center justify-between w-full p-2 bg-gray-900/5 hover:bg-gray-900/10 rounded-xl transition-colors group"
                            >
                                <div className="flex items-center space-x-2">
                                    <Database size={14} className="text-gray-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Forensic Audit Layer</span>
                                </div>
                                <ChevronRight size={14} className={clsx("text-gray-400 transition-transform", showForensic && "rotate-90")} />
                            </button>

                            {showForensic && data.forensic && (
                                <div className="mt-3 p-4 bg-gray-900 rounded-2xl text-white font-mono text-[10px] space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center opacity-60">
                                        <span>MODEL_VERSION</span>
                                        <span>{data.forensic.modelVersion}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span>CANONICAL_HASH</span>
                                        <span className="truncate ml-4">{data.forensic.canonicalHash}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span>DETERMINISTIC_SEED</span>
                                        <span>{data.forensic.seed}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-blue-400">LEDGER_TRACE</span>
                                        <a
                                            href={`/consulting/ledger/${data.forensic.ledgerId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 pb-0.5"
                                        >
                                            <span>Verify in Ledger</span>
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {data.limitationsDisclosed && (
                        <div className="flex items-center justify-center space-x-1 py-1 opacity-40">
                            <ShieldCheck size={10} />
                            <span className="text-[9px] font-medium uppercase">Institutional Integrity Guaranteed</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

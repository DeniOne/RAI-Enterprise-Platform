'use client';

import React from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

interface EvidenceGuardBannerProps {
    title: string;
    loading?: boolean;
    isBlocking: boolean;
    readyText: string;
    blockedText: string;
    missingEvidenceTypes?: string[];
    requiredCount?: number;
    presentCount?: number;
    compact?: boolean;
    onSelectMissingEvidenceType?: (evidenceType: string) => void;
}

export function EvidenceGuardBanner({
    title,
    loading = false,
    isBlocking,
    readyText,
    blockedText,
    missingEvidenceTypes = [],
    requiredCount,
    presentCount,
    compact = false,
    onSelectMissingEvidenceType,
}: EvidenceGuardBannerProps) {
    const toneClass = isBlocking
        ? 'border-rose-100 bg-rose-50'
        : 'border-emerald-100 bg-emerald-50';
    const titleClass = isBlocking ? 'text-rose-700' : 'text-emerald-700';
    const bodyClass = isBlocking ? 'text-rose-700' : 'text-emerald-700';

    return (
        <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
            <div className="flex items-start gap-3">
                {loading ? (
                    <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-slate-500" />
                ) : isBlocking ? (
                    <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-600" />
                ) : (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        {title}
                    </p>
                    <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} ${bodyClass}`}>
                        {loading
                            ? 'Проверяем completeness evidence...'
                            : isBlocking
                                ? blockedText
                                : readyText}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {!loading && (
                            <span className={`rounded-full bg-white px-2.5 py-1 text-[10px] font-medium border ${titleClass} ${isBlocking ? 'border-rose-100' : 'border-emerald-100'}`}>
                                {isBlocking ? 'Pending' : 'OK'}
                            </span>
                        )}
                        {typeof requiredCount === 'number' && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-black/5">
                                required: {requiredCount}
                            </span>
                        )}
                        {typeof presentCount === 'number' && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-black/5">
                                present: {presentCount}
                            </span>
                        )}
                        {missingEvidenceTypes.map((item) => (
                            onSelectMissingEvidenceType ? (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => onSelectMissingEvidenceType(item)}
                                    className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-rose-700 border border-rose-100 hover:bg-rose-100/70"
                                >
                                    {`missing: ${item} -> выбрать`}
                                </button>
                            ) : (
                                <span
                                    key={item}
                                    className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-rose-700 border border-rose-100"
                                >
                                    missing: {item}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

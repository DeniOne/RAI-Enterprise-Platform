'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { AuthorityContextType } from '@/core/governance/AuthorityContext';
import { formatStatusLabel } from '@/lib/ui-language';
import { hasForensicAuthority, hasSurfaceContractViolation, shouldDisableLedgerVerify } from './ai-recommendation.policy';

export interface ExplainabilityFactorDto {
    name: string;
    weight: number;
    impact: number;
    description?: string;
}

export interface CounterfactualDto {
    scenarioName: string;
    deltaInput: Record<string, unknown>;
    expectedOutcome: string;
    probabilityShift: number;
}

export interface ForensicMetadataDto {
    modelVersion: string;
    inferenceTimestamp: string;
    inputCanonicalHash: string;
    featureVectorHash?: string;
    explainabilityCanonicalHash: string;
    ledgerTraceId: string;
    ledgerTxId?: string;
    merkleRoot?: string;
    merkleProof?: string[];
    environment?: 'prod' | 'staging' | 'dev';
}

export interface AIExplainabilityDto {
    confidence: number;
    verdict: string;
    factors: ExplainabilityFactorDto[];
    counterfactuals?: CounterfactualDto[];
    forensic?: ForensicMetadataDto;
    limitationsDisclosed: boolean;
}

interface AIRecommendationBlockProps {
    explainability?: AIExplainabilityDto;
    traceId?: string;
    traceStatus: 'AVAILABLE' | 'PENDING';
    authority: AuthorityContextType;
    className?: string;
}

const formatConfidence = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const AIRecommendationBlock: React.FC<AIRecommendationBlockProps> = ({
    explainability,
    traceId,
    traceStatus,
    authority,
    className,
}) => {
    const [analyticalOpen, setAnalyticalOpen] = useState(false);
    const [forensicOpen, setForensicOpen] = useState(false);
    const hasForensicAccess = hasForensicAuthority(authority);
    const effectiveTraceId = traceId ?? explainability?.forensic?.ledgerTraceId;
    const verifyDisabled = shouldDisableLedgerVerify(traceStatus, effectiveTraceId);

    const forensicRows = useMemo(() => {
        if (!explainability?.forensic) return [];
        return [
            ['MODEL_VERSION', explainability.forensic.modelVersion],
            ['INFERENCE_TIMESTAMP', explainability.forensic.inferenceTimestamp],
            ['INPUT_CANONICAL_HASH', explainability.forensic.inputCanonicalHash],
            ['EXPLAINABILITY_CANONICAL_HASH', explainability.forensic.explainabilityCanonicalHash],
            ['LEDGER_TRACE_ID', explainability.forensic.ledgerTraceId],
            ['LEDGER_TX_ID', explainability.forensic.ledgerTxId ?? '—'],
            ['MERKLE_ROOT', explainability.forensic.merkleRoot ?? '—'],
            ['ENVIRONMENT', explainability.forensic.environment ? formatStatusLabel(explainability.forensic.environment) : '—'],
        ];
    }, [explainability?.forensic]);

    const copyValue = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            console.warn('[AUDIT] clipboard write failed');
        }
    };

    if (!explainability || hasSurfaceContractViolation(explainability, traceStatus)) {
        console.error('[AUDIT] EXPLAINABILITY_MISSING_POLICY_VIOLATION', { traceId: effectiveTraceId ?? 'N/A' });
        return (
            <div className={clsx('mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-left', className)}>
                <p className="text-xs font-semibold text-red-700">Данные обоснования не пришли. Это нарушает институциональную политику.</p>
                <p className="mt-1 text-[11px] text-red-700/80">Идентификатор трассировки: {effectiveTraceId ?? '—'}</p>
            </div>
        );
    }

    return (
        <div className={clsx('mt-2 rounded-2xl border border-white/20 bg-white/40 p-3 text-left backdrop-blur-sm', className)}>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold text-gray-900">{formatStatusLabel(explainability.verdict)}</p>
                    <p className="text-[11px] text-gray-600">Уверенность: {formatConfidence(explainability.confidence)}</p>
                </div>
                <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-medium', traceStatus === 'PENDING' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
                    {traceStatus === 'PENDING' ? 'Трассировка ожидается' : 'Трассировка привязана'}
                </span>
            </div>

            <p className="mt-2 text-[11px] text-gray-600">
                Рекомендация ИИ носит консультативный характер. Финальное решение принимает контур управления.
            </p>

            <div className="mt-3 flex items-center gap-2">
                <button className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700" onClick={() => setAnalyticalOpen(true)}>
                    Почему так
                </button>
                <button
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setForensicOpen(true)}
                    disabled={verifyDisabled}
                    title={verifyDisabled ? 'Ждём запись в журнале' : undefined}
                >
                    Проверка в журнале
                </button>
                {effectiveTraceId && !verifyDisabled && (
                    <a className="text-[11px] text-blue-700 underline" href={`/consulting/ledger/${effectiveTraceId}`}>
                        Открыть запись в журнале
                    </a>
                )}
            </div>

            {analyticalOpen && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/30 bg-white/20 p-3">
                    {explainability.factors.map((factor, index) => (
                        <div key={`${factor.name}-${index}`} className="rounded-lg border border-white/40 bg-white/50 p-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-800">{factor.name}</span>
                                <span className="text-[11px] text-gray-600">вес {factor.weight.toFixed(2)} • влияние {factor.impact.toFixed(2)}</span>
                            </div>
                            {factor.description && <p className="mt-1 text-[11px] text-gray-600">{factor.description}</p>}
                        </div>
                    ))}
                    {explainability.counterfactuals?.map((cf, index) => (
                        <div key={`${cf.scenarioName}-${index}`} className="rounded-lg border border-blue-100 bg-blue-50/40 p-2 text-[11px] text-blue-900">
                            {cf.scenarioName}: {cf.expectedOutcome} (сдвиг {cf.probabilityShift.toFixed(2)})
                        </div>
                    ))}
                </div>
            )}

            {forensicOpen && (
                <div className="mt-3 rounded-lg border border-gray-300 bg-white p-3 font-mono text-[11px] text-gray-900">
                    {!hasForensicAccess && (
                        <p className="text-xs text-gray-700">Детализированный слой разбора доступен только при наличии права подписи или ручного переопределения.</p>
                    )}
                    {hasForensicAccess && !explainability.forensic && (
                        <p className="text-xs text-gray-700">Метаданные разбора недоступны.</p>
                    )}
                    {hasForensicAccess && explainability.forensic && (
                        <div className="space-y-2">
                            {forensicRows.map(([label, value]) => (
                                <div key={label} className="grid grid-cols-[170px_1fr_auto] items-center gap-2 border-b border-gray-200 pb-1">
                                    <span>{label}</span>
                                    <span className="truncate">{value}</span>
                                    <button className="rounded border border-gray-400 px-1 text-[10px]" onClick={() => copyValue(value)}>
                                        Копировать
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

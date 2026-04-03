'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import {
    formatCanonicalBranchLabel,
    formatChangeOrderTypeLabel,
    formatCropFormLabel,
    formatCropLabel,
    formatEvidenceTypeLabel,
    formatEvidenceSourceKindLabel,
    formatGenerationStrategyLabel,
    formatParityDiffCodeLabel,
    formatPriorityLabel,
    formatResourceUnitLabel,
    formatRolloutModeLabel,
    formatRunbookActionLabel,
    formatSeverityLabel,
    formatSourceSchemeLabel,
    formatStatusLabel,
    formatTechExplainabilityMessage,
    formatTechMapBlockLabel,
    formatTechStageCodeLabel,
} from '@/lib/ui-language';

type MapResource = {
    id: string;
    type: string;
    name: string;
    amount: number;
    unit: string;
};

type MapOperation = {
    id: string;
    name: string;
    description?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    durationHours?: number;
    resources: MapResource[];
};

type MapStage = {
    id: string;
    name: string;
    sequence: number;
    aplStageId?: string;
    stageGoal?: string | null;
    bbchScope?: unknown;
    controlPoints?: Array<{
        id: string;
        name: string;
        severityOnFailure?: string | null;
    }>;
    operations: MapOperation[];
};

type TechMap = {
    id: string;
    seasonId?: string | null;
    harvestPlanId?: string;
    crop?: string;
    cropForm?: string | null;
    canonicalBranch?: string | null;
    status: string;
    version: number;
    updatedAt?: string;
    generationMetadata?: {
        blueprintVersion?: string;
        source?: string;
        targetYieldTHa?: number;
        generationStrategy?: string;
        schemaVersion?: string;
        ruleRegistryVersion?: string;
        ontologyVersion?: string;
        generationTraceId?: string;
        rolloutMode?: string;
        fallbackUsed?: boolean;
        fallbackReason?: string | null;
    } | null;
    stages: MapStage[];
};

type ExplainabilityPayload = {
    cropForm?: string | null;
    canonicalBranch?: string | null;
    fieldAdmissionResult?: {
        verdict?: string;
        isBlocking?: boolean;
        blockers?: Array<{ message: string }>;
        requirements?: Array<{ message: string }>;
    } | null;
    generationExplanationTrace?: {
        traceId?: string;
        summary?: {
            branchSelectionReasons?: string[];
            mandatoryBlocks?: string[];
            admissionVerdict?: string;
        } | null;
    } | null;
    generationObservability?: {
        rolloutMode?: string | null;
        fallbackUsed?: boolean;
        fallbackReason?: string | null;
        featureFlagSnapshot?: {
            mode?: string | null;
            companyId?: string | null;
            companyFilter?: string | null;
        } | null;
        versionPinning?: {
            schemaVersion?: string | null;
            ruleRegistryVersion?: string | null;
            ontologyVersion?: string | null;
            generationTraceId?: string | null;
            generatorVersion?: string | null;
        } | null;
        shadowParitySummary?: {
            traceId?: string;
            hasBlockingDiffs?: boolean;
            diffCount?: number;
            severityCounts?: {
                P0?: number;
                P1?: number;
                P2?: number;
            };
        } | null;
        shadowParityReport?: {
            diffs?: Array<{
                severity?: string;
                code?: string;
                message?: string;
            }>;
        } | null;
        explainabilityTracePresent?: boolean;
        completenessScore?: number | null;
    } | null;
    recommendations?: Array<{
        id: string;
        severity: string;
        title: string;
        message: string;
    }>;
    decisionGates?: Array<{
        id: string;
        severity: string;
        status: string;
        title: string;
    }>;
    runtimeArtifacts?: {
        changeOrders?: Array<{
            id: string;
            changeType: string;
            status: string;
            deltaCostRub?: number | null;
            approvals?: Array<{
                id: string;
                decision?: string | null;
            }>;
        }>;
        deviationReviews?: Array<{
            id: string;
            deviationSummary: string;
            severity?: string;
            status?: string;
        }>;
        evidenceAudit?: {
            artifactEvidenceCount?: number;
            intermediateRouteEvidenceCount?: number;
            unresolvedRouteEvidenceTypes?: string[];
        };
    };
    controlPoints?: Array<{
        id: string;
        name: string;
        mapStage?: {
            id: string;
            name: string;
        } | null;
        outcomeExplanations?: Array<{
            id: string;
            outcome: string;
            severity: string;
            summary: string;
            createdAt?: string;
            payload?: {
                decisionGateId?: string | null;
                recommendationId?: string | null;
                changeOrderId?: string | null;
                deviationReviewId?: string | null;
                operationId?: string | null;
                observationId?: string | null;
            } | null;
            evidenceAudit?: {
                artifactEvidenceCount?: number;
                intermediateRouteEvidenceCount?: number;
                unresolvedRouteEvidenceTypes?: string[];
            } | null;
            attachedEvidence?: Array<{
                id: string;
                evidenceType: string;
                fileUrl: string;
                capturedAt?: string | null;
                createdAt?: string | null;
                sourceAudit?: {
                    urlKind?: 'artifact' | 'intermediate_route' | 'unknown';
                    sourceScheme?: string | null;
                } | null;
            }>;
        }>;
    }>;
    rolloutIncidents?: Array<{
        id: string;
        subtype?: string | null;
        severity: string;
        status: string;
        createdAt?: string;
        traceId?: string | null;
        techMapId?: string | null;
        runbookSuggestedAction?: 'REQUIRE_HUMAN_REVIEW' | 'ROLLBACK_CHANGE_REQUEST' | null;
        detailSummary?: string | null;
    }>;
};

type ControlPointExplainability = NonNullable<ExplainabilityPayload['controlPoints']>[number];
type ControlPointOutcomeExplainability = NonNullable<ControlPointExplainability['outcomeExplanations']>[number];

function nextStatuses(current: string): string[] {
    if (current === 'GENERATED_DRAFT' || current === 'DRAFT') return ['REVIEW'];
    if (current === 'REVIEW') return ['APPROVED'];
    if (current === 'APPROVED') return ['ACTIVE'];
    if (current === 'ACTIVE') return ['ARCHIVED'];
    return [];
}

function renderRuntimeLinks(payload?: {
    decisionGateId?: string | null;
    recommendationId?: string | null;
    changeOrderId?: string | null;
    deviationReviewId?: string | null;
} | null) {
    if (!payload) return null;

    const items = [
        payload.decisionGateId
            ? {
                id: payload.decisionGateId,
                href: `#decision-gate-${payload.decisionGateId}`,
                label: `Шлюз решения ${payload.decisionGateId}`,
            }
            : null,
        payload.recommendationId
            ? {
                id: payload.recommendationId,
                href: `#recommendation-${payload.recommendationId}`,
                label: `Рекомендация ${payload.recommendationId}`,
            }
            : null,
        payload.changeOrderId
            ? {
                id: payload.changeOrderId,
                href: `#change-order-${payload.changeOrderId}`,
                label: `Изменение ${payload.changeOrderId}`,
            }
            : null,
        payload.deviationReviewId
            ? {
                id: payload.deviationReviewId,
                href: `#deviation-review-${payload.deviationReviewId}`,
                label: `Разбор отклонения ${payload.deviationReviewId}`,
            }
            : null,
    ].filter(Boolean) as Array<{ id: string; href: string; label: string }>;

    if (items.length === 0) return null;

    return (
        <div className='mt-2 flex flex-wrap gap-2'>
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.href}
                    className='px-2.5 py-1 rounded-full bg-white border border-black/5 text-[10px] font-medium text-blue-700 hover:underline'
                >
                    {item.label}
                </a>
            ))}
        </div>
    );
}

function renderEvidenceAuditSummary(summary?: {
    artifactEvidenceCount?: number;
    intermediateRouteEvidenceCount?: number;
    unresolvedRouteEvidenceTypes?: string[];
} | null) {
    if (!summary) return null;

    return (
        <div className='mt-2 flex flex-wrap gap-2'>
            <span className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                подтверждений: {summary.artifactEvidenceCount || 0}
            </span>
            <span className='px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100'>
                промежуточных маршрутов: {summary.intermediateRouteEvidenceCount || 0}
            </span>
            {(summary.unresolvedRouteEvidenceTypes || []).map((item) => (
                <span key={item} className='px-2.5 py-1 rounded-full bg-white text-amber-700 text-[10px] font-medium border border-amber-100'>
                    требует разбора: {formatTechExplainabilityMessage(item)}
                </span>
            ))}
        </div>
    );
}

export default function TechMapDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [techMap, setTechMap] = useState<TechMap | null>(null);
    const [explainability, setExplainability] = useState<ExplainabilityPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyStatus, setBusyStatus] = useState<string | null>(null);
    const [busyRunbookIncidentId, setBusyRunbookIncidentId] = useState<string | null>(null);
    const controlPointOutcomeById = useMemo(() => {
        const entries = new Map<string, ControlPointOutcomeExplainability>();
        for (const point of explainability?.controlPoints || []) {
            const latest = (point.outcomeExplanations || [])[0];
            if (latest) {
                entries.set(point.id, latest);
            }
        }
        return entries;
    }, [explainability]);

    const load = async () => {
        setLoading(true);
        try {
            const [techMapResponse, explainabilityResponse] = await Promise.all([
                api.consulting.techmaps.get(id),
                api.consulting.techmaps.explainability(id),
            ]);
            setTechMap(techMapResponse.data);
            setExplainability(explainabilityResponse.data);
        } catch (error) {
            console.error('Failed to load tech map:', error);
            setTechMap(null);
            setExplainability(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const counters = useMemo(() => {
        const stages = techMap?.stages || [];
        const operations = stages.flatMap((stage) => stage.operations);
        const resources = operations.flatMap((operation) => operation.resources);

        return {
            stages: stages.length,
            operations: operations.length,
            resources: resources.length,
        };
    }, [techMap]);

    const handleTransition = async (targetStatus: string) => {
        if (!techMap) return;

        setBusyStatus(targetStatus);
        try {
            await api.consulting.techmaps.transition(techMap.id, targetStatus);
            await load();
        } catch (error: any) {
            console.error('Failed to transition tech map:', error);
            alert(error?.response?.data?.message || 'Ошибка перехода техкарты');
        } finally {
            setBusyStatus(null);
        }
    };

    const handleRunbook = async (incidentId: string, action: 'REQUIRE_HUMAN_REVIEW' | 'ROLLBACK_CHANGE_REQUEST') => {
        setBusyRunbookIncidentId(incidentId);
        try {
            await api.governance.executeRunbook(incidentId, {
                action,
                comment: 'TechMap rollout incident escalated from consulting surface',
            });
            await load();
        } catch (error: any) {
            console.error('Failed to execute incident runbook:', error);
            alert(error?.response?.data?.message || 'Ошибка запуска регламентного действия');
        } finally {
            setBusyRunbookIncidentId(null);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900'>Технологическая карта</h1>
                    <p className='text-sm text-gray-500'>Просмотр состава карты, статусов и переход к исполнению.</p>
                </div>
                <div className='flex items-center gap-3'>
                    {techMap?.harvestPlanId && (
                        <Link href={`/consulting/plans/${techMap.harvestPlanId}`} className='text-sm text-blue-600 hover:underline'>
                            План
                        </Link>
                    )}
                    <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                        {'<- Назад к техкартам'}
                    </Link>
                </div>
            </div>

            {loading ? (
                <Card>
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                </Card>
            ) : !techMap ? (
                <Card>
                    <p className='text-sm text-gray-500'>Техкарта не найдена.</p>
                </Card>
            ) : (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Культура</p>
                            <p className='font-semibold'>{formatCropLabel(techMap.crop)}</p>
                            <p className='text-xs text-gray-500 mt-1'>
                                {techMap.cropForm || explainability?.cropForm
                                    ? formatCropFormLabel(techMap.cropForm || explainability?.cropForm)
                                    : formatCanonicalBranchLabel(techMap.canonicalBranch || explainability?.canonicalBranch)}
                            </p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Статус</p>
                            <p className='font-semibold'>{formatStatusLabel(techMap.status)}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Версия</p>
                            <p className='font-semibold'>v{techMap.version}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Обновлена</p>
                            <p className='font-semibold'>
                                {techMap.updatedAt ? new Date(techMap.updatedAt).toLocaleString('ru-RU') : '-'}
                            </p>
                        </Card>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Стадии</p>
                            <p className='text-2xl font-semibold'>{counters.stages}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Операции</p>
                            <p className='text-2xl font-semibold'>{counters.operations}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Ресурсы</p>
                            <p className='text-2xl font-semibold'>{counters.resources}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Генерация</p>
                            <p className='font-semibold'>{formatGenerationStrategyLabel(techMap.generationMetadata?.generationStrategy || techMap.generationMetadata?.source)}</p>
                            <p className='text-xs text-gray-500 mt-1'>схема {techMap.generationMetadata?.schemaVersion || '-'}</p>
                        </Card>
                    </div>

                    <Card>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Ветка</p>
                                <p className='font-semibold'>{formatCanonicalBranchLabel(techMap.canonicalBranch || explainability?.canonicalBranch)}</p>
                                <p className='text-xs text-gray-500 mt-2'>
                                    Трасса генерации: {(techMap.generationMetadata?.generationTraceId || explainability?.generationExplanationTrace?.traceId) ? 'доступна' : 'не зафиксирована'}
                                </p>
                                <div className='mt-3 space-y-1'>
                                    {(explainability?.generationExplanationTrace?.summary?.branchSelectionReasons || []).map((reason) => (
                                        <p key={reason} className='text-sm text-gray-600'>{formatTechExplainabilityMessage(reason)}</p>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Допуск</p>
                                <p className='font-semibold'>{formatStatusLabel(explainability?.fieldAdmissionResult?.verdict || explainability?.generationExplanationTrace?.summary?.admissionVerdict)}</p>
                                <div className='mt-3 space-y-1'>
                                    {(explainability?.fieldAdmissionResult?.blockers || []).map((item, index) => (
                                        <p key={`blocker-${index}`} className='text-sm text-rose-700'>{formatTechExplainabilityMessage(item.message)}</p>
                                    ))}
                                    {(explainability?.fieldAdmissionResult?.requirements || []).map((item, index) => (
                                        <p key={`requirement-${index}`} className='text-sm text-amber-700'>{formatTechExplainabilityMessage(item.message)}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='flex items-start justify-between gap-4 flex-wrap'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Инциденты развёртывания</p>
                                <p className='text-sm text-gray-600'>
                                    Сохранённые управленческие сигналы по расхождениям и резервному сценарию для этой техкарты.
                                </p>
                            </div>
                            <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                                Вернуться в реестр развёртывания
                            </Link>
                        </div>
                        <div className='mt-4 space-y-3'>
                            {(explainability?.rolloutIncidents || []).length === 0 ? (
                                <p className='text-sm text-gray-500'>Инциденты развёртывания для этой техкарты не зафиксированы.</p>
                            ) : (
                                (explainability?.rolloutIncidents || []).map((incident) => (
                                    <div key={incident.id} className='rounded-2xl border border-black/10 p-4'>
                                        <div className='flex items-start justify-between gap-3 flex-wrap'>
                                            <div>
                                                <p className='text-xs text-gray-500'>
                                                    {incident.subtype ? formatTechExplainabilityMessage(incident.subtype) : 'Инцидент развёртывания'} • {formatSeverityLabel(incident.severity)} • {formatStatusLabel(incident.status)}
                                                </p>
                                                <p className='text-sm font-medium text-gray-900 mt-1'>
                                                    {incident.detailSummary ? formatTechExplainabilityMessage(incident.detailSummary) : 'Инцидент развёртывания'}
                                                </p>
                                                <p className='text-xs text-gray-500 mt-1'>
                                                    {incident.createdAt ? new Date(incident.createdAt).toLocaleString('ru-RU') : '-'}
                                                    {incident.traceId ? ' • трасса зафиксирована' : ''}
                                                </p>
                                            </div>
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                {incident.runbookSuggestedAction && incident.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => handleRunbook(incident.id, incident.runbookSuggestedAction!)}
                                                        disabled={busyRunbookIncidentId === incident.id}
                                                        className='px-3 py-2 rounded-xl bg-black text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                                    >
                                                        {busyRunbookIncidentId === incident.id
                                                            ? 'Запуск...'
                                                            : incident.runbookSuggestedAction === 'REQUIRE_HUMAN_REVIEW'
                                                                ? 'Передать на ручную проверку'
                                                                : 'Запустить откат'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Развёртывание и резервный сценарий</p>
                                <p className='font-semibold'>
                                    {formatRolloutModeLabel(explainability?.generationObservability?.rolloutMode || techMap.generationMetadata?.rolloutMode)}
                                </p>
                                <div className='mt-2 flex flex-wrap gap-2'>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                        explainability?.generationObservability?.fallbackUsed
                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                        {explainability?.generationObservability?.fallbackUsed ? 'использован резервный сценарий' : 'канонический путь активен'}
                                    </span>
                                    {explainability?.generationObservability?.fallbackReason && (
                                        <span className='px-2.5 py-1 rounded-full bg-white text-amber-700 text-[10px] font-medium border border-amber-100'>
                                            {formatTechExplainabilityMessage(explainability.generationObservability.fallbackReason)}
                                        </span>
                                    )}
                                    {explainability?.generationObservability?.featureFlagSnapshot?.mode && (
                                        <span className='px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium border border-sky-100'>
                                            режим флага: {formatRolloutModeLabel(explainability.generationObservability.featureFlagSnapshot.mode)}
                                        </span>
                                    )}
                                </div>
                                <div className='mt-3 space-y-1 text-sm text-gray-600'>
                                    <p>схема: {explainability?.generationObservability?.versionPinning?.schemaVersion || techMap.generationMetadata?.schemaVersion || '-'}</p>
                                    <p>правила: {explainability?.generationObservability?.versionPinning?.ruleRegistryVersion || techMap.generationMetadata?.ruleRegistryVersion || '-'}</p>
                                    <p>онтология: {explainability?.generationObservability?.versionPinning?.ontologyVersion || techMap.generationMetadata?.ontologyVersion || '-'}</p>
                                    <p>генератор: {explainability?.generationObservability?.versionPinning?.generatorVersion || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Теневое сравнение</p>
                                <p className='font-semibold'>
                                    {explainability?.generationObservability?.shadowParitySummary?.diffCount ?? 0} расхождений
                                </p>
                                <div className='mt-2 flex flex-wrap gap-2'>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                        explainability?.generationObservability?.shadowParitySummary?.hasBlockingDiffs
                                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                        {explainability?.generationObservability?.shadowParitySummary?.hasBlockingDiffs ? 'есть блокирующие расхождения' : 'блокирующих расхождений нет'}
                                    </span>
                                    <span className='px-2.5 py-1 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                                        {formatPriorityLabel('P0')}: {explainability?.generationObservability?.shadowParitySummary?.severityCounts?.P0 || 0}
                                    </span>
                                    <span className='px-2.5 py-1 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                                        {formatPriorityLabel('P1')}: {explainability?.generationObservability?.shadowParitySummary?.severityCounts?.P1 || 0}
                                    </span>
                                    <span className='px-2.5 py-1 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                                        {formatPriorityLabel('P2')}: {explainability?.generationObservability?.shadowParitySummary?.severityCounts?.P2 || 0}
                                    </span>
                                </div>
                                <p className='text-xs text-gray-500 mt-3'>
                                    трассировка обоснования: {explainability?.generationObservability?.explainabilityTracePresent ? 'есть' : 'нет'} • полнота {typeof explainability?.generationObservability?.completenessScore === 'number'
                                        ? explainability.generationObservability.completenessScore.toFixed(2)
                                        : '-'}
                                </p>
                                <div className='mt-3 space-y-2'>
                                    {(explainability?.generationObservability?.shadowParityReport?.diffs || []).slice(0, 5).map((diff, index) => (
                                        <div key={`${diff.code || 'diff'}-${index}`} className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                            <p className='text-xs text-gray-500'>
                                                {formatPriorityLabel(diff.severity)} / {formatParityDiffCodeLabel(diff.code)}
                                            </p>
                                            <p className='text-sm text-gray-700 mt-1'>{formatTechExplainabilityMessage(diff.message)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Обязательные блоки</p>
                                <div className='flex flex-wrap gap-2'>
                                    {(explainability?.generationExplanationTrace?.summary?.mandatoryBlocks || []).map((block) => (
                                        <span key={block} className='px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium'>
                                            {formatTechMapBlockLabel(block)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Рекомендации и шлюзы решения</p>
                                <div className='space-y-2'>
                                    {(explainability?.recommendations || []).slice(0, 4).map((recommendation) => (
                                        <div key={recommendation.id} id={`recommendation-${recommendation.id}`} className='rounded-xl border border-gray-100 p-3 scroll-mt-24'>
                                            <p className='text-xs text-gray-500'>{formatSeverityLabel(recommendation.severity)}</p>
                                            <p className='text-sm font-medium text-gray-900'>{recommendation.title}</p>
                                            <p className='text-sm text-gray-600'>{recommendation.message}</p>
                                        </div>
                                    ))}
                                    {(explainability?.decisionGates || []).slice(0, 2).map((gate) => (
                                        <div key={gate.id} id={`decision-gate-${gate.id}`} className='rounded-xl border border-amber-200 bg-amber-50 p-3 scroll-mt-24'>
                                            <p className='text-xs text-amber-700'>{formatSeverityLabel(gate.severity)} / {formatStatusLabel(gate.status)}</p>
                                            <p className='text-sm font-medium text-amber-900'>{gate.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Изменения</p>
                                <div className='space-y-2'>
                                    {(explainability?.runtimeArtifacts?.changeOrders || []).length === 0 ? (
                                        <p className='text-sm text-gray-500'>Изменения пока не создавались.</p>
                                    ) : (
                                        (explainability?.runtimeArtifacts?.changeOrders || []).map((changeOrder) => (
                                            <div
                                                key={changeOrder.id}
                                                id={`change-order-${changeOrder.id}`}
                                                className='rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 scroll-mt-24'
                                            >
                                                <p className='text-xs text-indigo-700'>{formatChangeOrderTypeLabel(changeOrder.changeType)} / {formatStatusLabel(changeOrder.status)}</p>
                                                <p className='text-sm font-medium text-indigo-950'>{changeOrder.id}</p>
                                                <p className='text-xs text-indigo-800 mt-1'>
                                                    согласований: {changeOrder.approvals?.length || 0}
                                                    {typeof changeOrder.deltaCostRub === 'number' ? ` • изменение ${changeOrder.deltaCostRub} ₽` : ''}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Разбор отклонений</p>
                                <div className='space-y-2'>
                                    {(explainability?.runtimeArtifacts?.deviationReviews || []).length === 0 ? (
                                        <p className='text-sm text-gray-500'>Разборы отклонений времени исполнения пока не зафиксированы.</p>
                                    ) : (
                                        (explainability?.runtimeArtifacts?.deviationReviews || []).map((review) => (
                                            <div
                                                key={review.id}
                                                id={`deviation-review-${review.id}`}
                                                className='rounded-xl border border-rose-100 bg-rose-50/60 p-3 scroll-mt-24'
                                            >
                                                <p className='text-xs text-rose-700'>{formatSeverityLabel(review.severity)} / {formatStatusLabel(review.status)}</p>
                                                <p className='text-sm font-medium text-rose-950'>{review.id}</p>
                                                <p className='text-sm text-rose-900 mt-1'>{review.deviationSummary}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {renderEvidenceAuditSummary(explainability?.runtimeArtifacts?.evidenceAudit)}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Статусные действия</p>
                                <p className='text-sm text-gray-600'>Переведите карту в состояние «Активно», чтобы операции появились в контуре исполнения.</p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {nextStatuses(techMap.status).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleTransition(status)}
                                        disabled={busyStatus !== null}
                                        className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                    >
                                        {busyStatus === status ? 'Обновление...' : `→ ${formatStatusLabel(status)}`}
                                    </button>
                                ))}
                                {techMap.status === 'ACTIVE' && (
                                    <Link
                                        href='/consulting/execution'
                                        className='px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold'
                                    >
                                        Открыть контур исполнения
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className='space-y-6'>
                        {techMap.stages.map((stage) => (
                            <div key={stage.id} className='relative pl-8 border-l-2 border-gray-100 pb-12 last:pb-0'>
                                <div className='absolute left-[-9px] top-0 h-4 w-4 bg-black rounded-full ring-4 ring-white' />

                                <div className='space-y-4'>
                                    <div>
                                        <h2 className='text-lg font-medium text-gray-900'>{stage.sequence}. {stage.name}</h2>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            {stage.aplStageId ? formatTechStageCodeLabel(stage.aplStageId) : 'Этап техкарты уточняется'}
                                        </p>
                                        {stage.stageGoal && (
                                            <p className='text-sm text-gray-600 mt-2'>{stage.stageGoal}</p>
                                        )}
                                        {(stage.controlPoints || []).length > 0 && (
                                            <div className='mt-3 flex flex-wrap gap-2'>
                                                {stage.controlPoints?.map((point) => (
                                                    <div key={point.id} className='rounded-xl border border-amber-100 bg-amber-50 px-3 py-2'>
                                                        <p className='text-xs font-medium text-amber-700'>
                                                            Контрольная точка: {point.name} {point.severityOnFailure ? `(${formatSeverityLabel(point.severityOnFailure)})` : ''}
                                                        </p>
                                                        {controlPointOutcomeById.get(point.id) && (
                                                            <div>
                                                                <p className='mt-1 text-xs text-gray-600'>
                                                                    {formatSeverityLabel(controlPointOutcomeById.get(point.id)?.severity)}: {formatTechExplainabilityMessage(controlPointOutcomeById.get(point.id)?.summary)}
                                                                </p>
                                                                {renderEvidenceAuditSummary(controlPointOutcomeById.get(point.id)?.evidenceAudit)}
                                                                {((controlPointOutcomeById.get(point.id)?.attachedEvidence || []).length > 0) && (
                                                                    <div className='mt-2 space-y-1'>
                                                                        {(controlPointOutcomeById.get(point.id)?.attachedEvidence || []).map((evidence) => (
                                                                            <div key={evidence.id} className='rounded-lg border border-black/5 bg-white px-2.5 py-2'>
                                                                                <div className='flex flex-wrap items-center gap-2'>
                                                                                    <span className='text-[10px] font-medium text-gray-800'>{formatEvidenceTypeLabel(evidence.evidenceType)}</span>
                                                                                    {evidence.sourceAudit?.urlKind && (
                                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                                                            evidence.sourceAudit.urlKind === 'artifact'
                                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                                                : evidence.sourceAudit.urlKind === 'intermediate_route'
                                                                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                                                                        }`}>
                                                                                            {formatEvidenceSourceKindLabel(evidence.sourceAudit.urlKind)}
                                                                                        </span>
                                                                                    )}
                                                                                    {evidence.sourceAudit?.sourceScheme && (
                                                                                        <span className='px-2 py-0.5 rounded-full text-[10px] font-medium border border-black/5 bg-slate-50 text-slate-600'>
                                                                                            {formatSourceSchemeLabel(evidence.sourceAudit.sourceScheme)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <a
                                                                                    href={evidence.fileUrl}
                                                                                    target='_blank'
                                                                                    rel='noreferrer'
                                                                                    className='mt-1 block text-[11px] text-blue-600 hover:underline'
                                                                                >
                                                                                    Открыть файл подтверждения
                                                                                </a>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {renderRuntimeLinks(controlPointOutcomeById.get(point.id)?.payload)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className='grid grid-cols-1 gap-4'>
                                        {stage.operations.map((operation) => (
                                            <Card key={operation.id} className='p-6 rounded-2xl'>
                                                <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                                                    <div>
                                                        <h3 className='font-medium text-base text-gray-900'>{operation.name}</h3>
                                                        {operation.description && (
                                                            <p className='text-sm text-gray-500 mt-1'>{operation.description}</p>
                                                        )}
                                                    </div>
                                                    <div className='text-xs text-gray-500 min-w-56'>
                                                        <p>Старт: {operation.plannedStartTime ? new Date(operation.plannedStartTime).toLocaleString('ru-RU') : '-'}</p>
                                                        <p>Финиш: {operation.plannedEndTime ? new Date(operation.plannedEndTime).toLocaleString('ru-RU') : '-'}</p>
                                                        <p>Длительность: {operation.durationHours ?? '-'} ч</p>
                                                    </div>
                                                </div>

                                                {operation.resources.length > 0 && (
                                                    <div className='mt-4 pt-4 border-t border-gray-50'>
                                                        <h4 className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-3'>
                                                            Ресурсы
                                                        </h4>
                                                        <div className='flex flex-wrap gap-2'>
                                                            {operation.resources.map((resource) => (
                                                                <div
                                                                    key={resource.id}
                                                                    className='px-3 py-1 bg-gray-50 border border-black/5 rounded-lg text-sm'
                                                                >
                                                                    <span className='text-gray-600'>{resource.name}:</span>
                                                                    <span className='ml-1 font-medium'>
                                                                        {resource.amount} {formatResourceUnitLabel(resource.unit)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

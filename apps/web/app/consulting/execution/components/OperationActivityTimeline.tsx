'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, CheckCircle2, ClipboardList, Link2, Loader2, Radar, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

interface OperationActivityTimelineProps {
    operation: any;
    limit?: number;
}

function buildRefLabel(kind: string, item: any) {
    switch (kind) {
        case 'decisionGate':
            return `Gate ${item.id} • ${item.status}`;
        case 'recommendation':
            return `Recommendation ${item.id} • ${item.severity}`;
        case 'changeOrder':
            return `ChangeOrder ${item.id} • ${item.status}`;
        case 'deviationReview':
            return `Deviation ${item.id} • ${item.status}`;
        default:
            return item.id;
    }
}

function buildRefBadge(kind: string, item: any) {
    switch (kind) {
        case 'changeOrder':
            return item.approvalSummary
                ? `${item.approvalSummary.approved}/${item.approvalSummary.total} approved`
                : null;
        case 'decisionGate':
            return item.severity || null;
        case 'recommendation':
            return item.title || null;
        case 'deviationReview':
            return item.severity || null;
        default:
            return null;
    }
}

function toTimestamp(value?: string | null) {
    return value ? new Date(value).getTime() : 0;
}

function clipText(value?: string | null, fallback?: string) {
    const normalized = value?.trim();
    if (!normalized) {
        return fallback || 'Без дополнительного описания';
    }

    return normalized.length > 90 ? `${normalized.slice(0, 87)}...` : normalized;
}

export function OperationActivityTimeline({
    operation,
    limit = 6,
}: OperationActivityTimelineProps) {
    const operationId = operation?.id;
    const techMapId = operation?.mapStage?.techMap?.id;

    const { data: observations, isLoading } = useQuery({
        queryKey: ['consulting', 'execution-observations', operationId],
        queryFn: () => api.consulting.execution.observations(operationId).then((res) => res.data),
        enabled: Boolean(operationId),
        initialData: operation?.recentObservations || [],
    });

    const timeline = useMemo(() => {
        const governanceSummary = operation?.governanceSummary || {};
        const gateById = new Map((governanceSummary.decisionGates || []).map((item: any) => [item.id, item]));
        const recommendationById = new Map((governanceSummary.recommendations || []).map((item: any) => [item.id, item]));
        const changeOrderById = new Map((governanceSummary.changeOrders || []).map((item: any) => [item.id, item]));
        const deviationById = new Map((governanceSummary.deviationReviews || []).map((item: any) => [item.id, item]));
        const evidenceSummary = operation?.evidenceSummary;

        const evidenceStatusItems = evidenceSummary
            ? [{
                id: `evidence-status:${operationId}`,
                kind: 'evidence_status',
                title: evidenceSummary.isComplete ? 'Evidence completeness: OK' : 'Evidence completeness: Pending',
                subtitle: evidenceSummary.isComplete
                    ? `Все обязательные evidence прикреплены: ${(evidenceSummary.presentEvidenceTypes || []).join(', ') || 'none'}`
                    : `Не хватает evidence: ${(evidenceSummary.missingEvidenceTypes || []).join(', ') || 'не определено'}`,
                timestamp: (operation?.evidence || [])[0]?.capturedAt || (operation?.evidence || [])[0]?.createdAt || operation?.plannedStartTime,
                meta: evidenceSummary.isComplete ? 'OK' : 'Pending',
                badges: [
                    evidenceSummary.requiredEvidenceTypes?.length
                        ? `required ${evidenceSummary.requiredEvidenceTypes.length}`
                        : 'required 0',
                    evidenceSummary.presentEvidenceTypes?.length
                        ? `present ${evidenceSummary.presentEvidenceTypes.length}`
                        : 'present 0',
                ],
            }]
            : [];

        const evidenceItems = (operation?.evidence || []).map((item: any) => ({
            id: `evidence:${item.id}`,
            kind: 'evidence',
            title: `Evidence ${item.evidenceType}`,
            subtitle: item.fileUrl,
            timestamp: item.capturedAt || item.createdAt,
            meta: item.evidenceType,
        }));

        const outcomeItems = (operation?.mapStage?.controlPoints || [])
            .flatMap((point: any) =>
                (point.outcomeExplanations || []).map((outcome: any) => ({
                    id: `outcome:${outcome.id}`,
                    kind: 'outcome',
                    title: `${point.name}: ${outcome.outcome}`,
                    subtitle: clipText(outcome.summary, 'Control point outcome'),
                    timestamp: outcome.createdAt,
                    meta: outcome.severity,
                    refs: techMapId
                        ? [
                            outcome.payload?.decisionGateId && gateById.get(outcome.payload.decisionGateId)
                                ? {
                                    id: `gate:${outcome.payload.decisionGateId}`,
                                    href: `/consulting/techmaps/${techMapId}#decision-gate-${outcome.payload.decisionGateId}`,
                                    label: buildRefLabel('decisionGate', gateById.get(outcome.payload.decisionGateId)),
                                    badge: buildRefBadge('decisionGate', gateById.get(outcome.payload.decisionGateId)),
                                }
                                : null,
                            outcome.payload?.recommendationId && recommendationById.get(outcome.payload.recommendationId)
                                ? {
                                    id: `recommendation:${outcome.payload.recommendationId}`,
                                    href: `/consulting/techmaps/${techMapId}#recommendation-${outcome.payload.recommendationId}`,
                                    label: buildRefLabel('recommendation', recommendationById.get(outcome.payload.recommendationId)),
                                    badge: buildRefBadge('recommendation', recommendationById.get(outcome.payload.recommendationId)),
                                }
                                : null,
                            outcome.payload?.changeOrderId && changeOrderById.get(outcome.payload.changeOrderId)
                                ? {
                                    id: `change-order:${outcome.payload.changeOrderId}`,
                                    href: `/consulting/techmaps/${techMapId}#change-order-${outcome.payload.changeOrderId}`,
                                    label: buildRefLabel('changeOrder', changeOrderById.get(outcome.payload.changeOrderId)),
                                    badge: buildRefBadge('changeOrder', changeOrderById.get(outcome.payload.changeOrderId)),
                                }
                                : null,
                            outcome.payload?.deviationReviewId && deviationById.get(outcome.payload.deviationReviewId)
                                ? {
                                    id: `deviation:${outcome.payload.deviationReviewId}`,
                                    href: `/consulting/techmaps/${techMapId}#deviation-review-${outcome.payload.deviationReviewId}`,
                                    label: buildRefLabel('deviationReview', deviationById.get(outcome.payload.deviationReviewId)),
                                    badge: buildRefBadge('deviationReview', deviationById.get(outcome.payload.deviationReviewId)),
                                }
                                : null,
                        ].filter(Boolean)
                        : [],
                })),
            );

        const observationItems = (observations || []).map((item: any) => ({
            id: `observation:${item.id}`,
            kind: 'observation',
            title: `Observation ${item.type}`,
            subtitle: clipText(item.content, item.photoUrl || item.voiceUrl || 'Полевой артефакт без текста'),
            timestamp: item.createdAt,
            meta: item.integrityStatus,
        }));

        return [...evidenceStatusItems, ...observationItems, ...evidenceItems, ...outcomeItems]
            .sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp))
            .slice(0, limit);
    }, [
        limit,
        observations,
        operation?.evidence,
        operation?.evidenceSummary,
        operation?.mapStage?.controlPoints,
        operation?.governanceSummary,
        operation?.plannedStartTime,
        operationId,
        techMapId,
    ]);

    const renderIcon = (kind: string) => {
        switch (kind) {
            case 'observation':
                return <Camera className="w-4 h-4 text-sky-600" />;
            case 'evidence':
                return <Link2 className="w-4 h-4 text-emerald-600" />;
            case 'evidence_status':
                return (operation?.evidenceSummary?.isComplete
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : <ShieldAlert className="w-4 h-4 text-amber-600" />);
            case 'outcome':
                return <Radar className="w-4 h-4 text-amber-600" />;
            default:
                return <ClipboardList className="w-4 h-4 text-slate-500" />;
        }
    };

    if (isLoading && timeline.length === 0) {
        return (
            <div className="rounded-xl border border-black/5 bg-white p-4 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка execution timeline...
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="rounded-xl border border-black/5 bg-white p-4 text-xs text-slate-500">
                Execution timeline пока пуст: ещё нет observations, evidence или control-point outcomes.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-black/5 bg-white p-4 space-y-3">
            {timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-black/5 bg-slate-50 px-3 py-3">
                    <div className="mt-0.5">
                        {renderIcon(item.kind)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-slate-900">{item.title}</p>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {item.timestamp ? new Date(item.timestamp).toLocaleString('ru-RU') : '-'}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 break-all">{item.subtitle}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-black/5">
                                {item.meta}
                            </span>
                            {item.kind === 'observation' && (
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700 border border-sky-100">
                                    field-observation
                                </span>
                            )}
                            {item.kind === 'evidence_status' && (
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${operation?.evidenceSummary?.isComplete
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                    evidence-gate
                                </span>
                            )}
                            {Array.isArray((item as any).badges) && (item as any).badges.map((badge: string) => (
                                <span key={badge} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-black/5">
                                    {badge}
                                </span>
                            ))}
                        </div>
                        {Array.isArray((item as any).refs) && (item as any).refs.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {(item as any).refs.map((ref: any) => (
                                    <div key={ref.id} className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1 border border-black/5">
                                        <Link
                                            href={ref.href}
                                            className="text-[10px] font-medium text-blue-700 hover:underline"
                                        >
                                            {ref.label}
                                        </Link>
                                        {ref.badge && (
                                            <span className="text-[10px] text-slate-500">
                                                {ref.badge}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

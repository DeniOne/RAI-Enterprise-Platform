'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    api,
    type ChiefAgronomistReviewRequest,
    type ChiefAgronomistReviewResponse,
} from '@/lib/api';
import { webFeatureFlags } from '@/lib/feature-flags';
import { DetailOverlay } from '@/components/strategic/DetailOverlay';
import clsx from 'clsx';

interface ChiefAgronomistReviewDrawerProps {
    request: ChiefAgronomistReviewRequest;
    title: string;
    subtitle?: string;
    triggerLabel?: string;
    triggerClassName?: string;
}

type OutcomeAction = 'accept' | 'hand_off' | 'create_task';

const DEFAULT_TRIGGER_CLASS_NAME =
    'rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#030213] transition hover:bg-slate-50';

export function ChiefAgronomistReviewDrawer({
    request,
    title,
    subtitle,
    triggerLabel = 'Запросить экспертное заключение',
    triggerClassName,
}: ChiefAgronomistReviewDrawerProps) {
    const router = useRouter();
    const enabled = webFeatureFlags.chiefAgronomistPanel;
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<ChiefAgronomistReviewResponse | null>(null);
    const [outcomeLoading, setOutcomeLoading] = useState<OutcomeAction | null>(null);

    async function openAndLoad() {
        setIsOpen(true);
        if (!enabled) {
            setError('Экспертная эскалация сейчас недоступна: выключен release gate или feature flag.');
            return;
        }

        if (loading) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.experts.chiefAgronomistReview(request);
            setReview(response.data);
        } catch (nextError) {
            setError((nextError as Error).message ?? 'Не удалось получить экспертное заключение');
        } finally {
            setLoading(false);
        }
    }

    async function applyOutcome(action: OutcomeAction) {
        if (!review) {
            return;
        }

        const note = window.prompt('Комментарий к решению (опционально)', '') ?? '';

        try {
            setOutcomeLoading(action);
            setError(null);
            const response = await api.experts.applyReviewOutcome(review.reviewId, {
                action,
                ...(note.trim() ? { note: note.trim() } : {}),
            });
            setReview(response.data);
        } catch (nextError) {
            setError((nextError as Error).message ?? 'Не удалось применить outcome по expert review');
        } finally {
            setOutcomeLoading(null);
        }
    }

    const canResolve = review && !review.outcomeAction && !review.resolvedAt;
    const showFullOutcomeSet = review?.status !== 'needs_more_context';

    return (
        <>
            <button
                type="button"
                onClick={openAndLoad}
                disabled={!enabled}
                className={clsx(DEFAULT_TRIGGER_CLASS_NAME, triggerClassName)}
            >
                {triggerLabel}
            </button>

            <DetailOverlay
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={title}
                subtitle={subtitle ?? 'Контекстное экспертное заключение Мега-Агронома'}
            >
                <div className="space-y-4">
                    <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
                        <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                            Контекст запроса
                        </p>
                        <div className="mt-3 space-y-1 text-[13px] text-[#030213]">
                            <p>Сущность: {request.entityType} / {request.entityId}</p>
                            <p>Причина: {request.reason}</p>
                            {request.fieldId && <p>Field: {request.fieldId}</p>}
                            {request.seasonId && <p>Season: {request.seasonId}</p>}
                            {request.planId && <p>Plan: {request.planId}</p>}
                        </div>
                    </div>

                    {loading && (
                        <div className="rounded-2xl border border-black/10 bg-white px-4 py-4 text-[14px] text-[#717182]">
                            Формируем экспертное заключение...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-[13px] text-red-700">
                            {error}
                        </div>
                    )}

                    {review && (
                        <>
                            <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                                <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                                    Verdict
                                </p>
                                <p className="mt-2 text-[15px] leading-relaxed text-[#030213]">
                                    {review.verdict}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <CompactCard label="Status" value={review.status} />
                                <CompactCard label="Risk tier" value={review.riskTier} />
                            </div>

                            {(review.outcomeAction || review.resolvedAt) && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                                    <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-800">
                                        Outcome
                                    </p>
                                    <p className="mt-2 text-[13px] text-emerald-900">
                                        {review.outcomeAction ?? 'resolved'}
                                        {review.resolvedAt ? ` • ${new Date(review.resolvedAt).toLocaleString('ru-RU')}` : ''}
                                    </p>
                                    {review.outcomeNote && (
                                        <p className="mt-2 text-[13px] text-emerald-900">{review.outcomeNote}</p>
                                    )}
                                    {review.createdTaskId && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <p className="text-[13px] text-emerald-900">
                                                Task ID: {review.createdTaskId}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/front-office/tasks/${review.createdTaskId}`)}
                                                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-100"
                                            >
                                                Открыть задачу
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {review.status === 'needs_more_context' && review.missingContext?.length ? (
                                <ListCard
                                    title="Чего не хватает"
                                    items={review.missingContext}
                                    emptyLabel="Контекст полный."
                                />
                            ) : null}

                            <ListCard
                                title="Что делать сейчас"
                                items={review.actionsNow}
                                emptyLabel="Пока нет прямых действий."
                            />
                            <ListCard
                                title="Альтернативы"
                                items={review.alternatives}
                                emptyLabel="Альтернативы не предложены."
                            />
                            <ListCard
                                title="На чём основано"
                                items={review.basedOn}
                                emptyLabel="Источник аргументации не раскрыт."
                            />

                            <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                                <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                                    Evidence
                                </p>
                                <div className="mt-3 space-y-2">
                                    {review.evidence.length > 0 ? (
                                        review.evidence.map((item) => (
                                            <div
                                                key={`${item.sourceType}:${item.sourceId}:${item.claim}`}
                                                className="rounded-xl border border-black/10 bg-slate-50 px-3 py-3"
                                            >
                                                <p className="text-[13px] font-medium text-[#030213]">{item.claim}</p>
                                                <p className="mt-1 text-[12px] text-[#717182]">
                                                    {item.sourceType} • {item.sourceId} • {(item.confidenceScore * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[13px] text-[#717182]">Evidence не найдено.</p>
                                    )}
                                </div>
                            </div>

                            {canResolve && (
                                <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                                        Outcome actions
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {showFullOutcomeSet && (
                                            <>
                                                <OutcomeButton
                                                    label="Принять"
                                                    tone="dark"
                                                    busy={outcomeLoading === 'accept'}
                                                    onClick={() => applyOutcome('accept')}
                                                />
                                                <OutcomeButton
                                                    label="Создать задачу"
                                                    tone="emerald"
                                                    busy={outcomeLoading === 'create_task'}
                                                    onClick={() => applyOutcome('create_task')}
                                                />
                                            </>
                                        )}
                                        <OutcomeButton
                                            label="Передать человеку"
                                            tone="slate"
                                            busy={outcomeLoading === 'hand_off'}
                                            onClick={() => applyOutcome('hand_off')}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DetailOverlay>
        </>
    );
}

function CompactCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">{label}</p>
            <p className="mt-2 text-[14px] font-medium text-[#030213]">{value}</p>
        </div>
    );
}

function ListCard({
    title,
    items,
    emptyLabel,
}: {
    title: string;
    items: string[];
    emptyLabel: string;
}) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">{title}</p>
            {items.length > 0 ? (
                <ul className="mt-3 space-y-2 text-[13px] text-[#030213]">
                    {items.map((item) => (
                        <li key={item}>• {item}</li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-[13px] text-[#717182]">{emptyLabel}</p>
            )}
        </div>
    );
}

function OutcomeButton({
    label,
    tone,
    busy,
    onClick,
}: {
    label: string;
    tone: 'dark' | 'slate' | 'emerald';
    busy: boolean;
    onClick: () => void;
}) {
    const toneClassName =
        tone === 'dark'
            ? 'border-[#030213] bg-[#030213] text-white hover:bg-black'
            : tone === 'emerald'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                : 'border-black/10 bg-slate-50 text-[#030213] hover:bg-slate-100';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            className={clsx(
                'rounded-xl border px-3 py-2 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                toneClassName,
            )}
        >
            {busy ? '...' : label}
        </button>
    );
}

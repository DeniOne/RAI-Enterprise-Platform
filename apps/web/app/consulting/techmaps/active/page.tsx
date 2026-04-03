'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';
import { ChiefAgronomistReviewDrawer } from '@/components/experts/ChiefAgronomistReviewDrawer';
import {
  formatCanonicalBranchLabel,
  formatCropFormLabel,
  formatCropLabel,
  formatGenerationStrategyLabel,
  formatRolloutModeLabel,
  formatStatusLabel,
} from '@/lib/ui-language';

type TechMapItem = {
    id: string;
    fieldId?: string;
    seasonId?: string;
    harvestPlanId?: string;
    status?: string;
    version?: number;
    crop?: string;
    cropForm?: string | null;
    canonicalBranch?: string | null;
    updatedAt?: string;
    generationMetadata?: {
        generationStrategy?: string;
        rolloutMode?: string;
        fallbackUsed?: boolean;
        shadowParitySummary?: {
            hasBlockingDiffs?: boolean;
            diffCount?: number;
            severityCounts?: {
                P0?: number;
            };
        } | null;
    } | null;
};

type RowItem = {
    code: string;
    item: TechMapItem;
};

function MapTable({ rows, isFocused }: { rows: RowItem[]; isFocused: (row: RowItem) => boolean }) {
    if (rows.length === 0) {
        return <p className='text-sm text-gray-500'>Нет записей.</p>;
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
                <thead>
                    <tr className='text-left text-gray-500 border-b'>
                        <th className='py-2 pr-4'>Код</th>
                        <th className='py-2 pr-4'>Версия</th>
                        <th className='py-2 pr-4'>Культура</th>
                        <th className='py-2 pr-4'>Генерация</th>
                        <th className='py-2 pr-4'>Статус</th>
                        <th className='py-2'>Обновлено</th>
                        <th className='py-2 text-right'>Эксперт</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const focused = isFocused(row);
                        return (
                            <tr key={row.item.id} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                <td className='py-2 pr-4 font-medium text-gray-900'>{row.code}</td>
                                <td className='py-2 pr-4'>{row.item.version ?? '-'}</td>
                                <td className='py-2 pr-4'>{formatCropLabel(row.item.crop)}</td>
                                <td className='py-2 pr-4'>
                                    <div className='flex flex-wrap gap-1.5'>
                                        {renderGenerationBadges(row.item)}
                                    </div>
                                </td>
                                <td className='py-2 pr-4'>{formatStatusLabel(row.item.status)}</td>
                                <td className='py-2'>{row.item.updatedAt ? new Date(row.item.updatedAt).toLocaleDateString('ru-RU') : '-'}</td>
                                <td className='py-2 text-right'>
                                    <ChiefAgronomistReviewDrawer
                                        title={row.code}
                                        subtitle={row.item.crop ? `${formatCropLabel(row.item.crop)} • ${formatStatusLabel(row.item.status)}` : formatStatusLabel(row.item.status)}
                                        triggerLabel='Экспертное заключение'
                                        triggerClassName='px-3 py-1.5'
                                        request={{
                                            entityType: 'techmap',
                                            entityId: row.item.id,
                                            reason: `Контекстная экспертная проверка техкарты ${row.code}`,
                                            ...(row.item.fieldId ? { fieldId: row.item.fieldId } : {}),
                                            ...(row.item.seasonId ? { seasonId: row.item.seasonId } : {}),
                                            ...(row.item.harvestPlanId ? { planId: row.item.harvestPlanId } : {}),
                                            workspaceRoute: '/consulting/techmaps/active',
                                        }}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <PageInner />
        </Suspense>
    );
}

function PageInner() {
    const [maps, setMaps] = useState<TechMapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const setActiveEntityRefs = useWorkspaceContextStore((s) => s.setActiveEntityRefs);
    const setSelectedRowSummary = useWorkspaceContextStore((s) => s.setSelectedRowSummary);
    const setFilters = useWorkspaceContextStore((s) => s.setFilters);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.consulting.techmaps.list();
                setMaps(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Failed to load active techmaps:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeRows = useMemo<RowItem[]>(() => {
        const activeMaps = maps.filter((m) => String(m.status) === 'ACTIVE');
        return activeMaps.map((item, index) => ({
            code: `Техкарта ${String(index + 1).padStart(3, '0')}`,
            item,
        }));
    }, [maps]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: activeRows,
        matchItem: (row, context) => includesFocus([row.code, row.item.id, row.item.crop, row.item.status], context.focusEntity),
        watch: [activeRows.length],
    });

    useEffect(() => {
        const focusedRow = activeRows.find((r) => isFocused(r));
        setFilters({
            status: 'ACTIVE',
            ...(focusedRow?.item.seasonId ? { seasonId: focusedRow.item.seasonId } : {}),
            ...(focusedRow?.item.harvestPlanId ? { harvestPlanId: focusedRow.item.harvestPlanId } : {}),
        });
    }, [activeRows, isFocused, setFilters]);

    useEffect(() => {
        const focusedRow = activeRows.find((r) => isFocused(r));
        if (focusedRow) {
            setActiveEntityRefs([
                { kind: 'techmap', id: focusedRow.item.id },
                ...(focusedRow.item.fieldId ? [{ kind: 'field' as const, id: focusedRow.item.fieldId }] : []),
            ]);
            setSelectedRowSummary({
                kind: 'techmap',
                id: focusedRow.item.id,
                title: focusedRow.code,
                subtitle: formatCropLabel(focusedRow.item.crop),
                status: focusedRow.item.status,
            });
        }
    }, [activeRows, isFocused, setActiveEntityRefs, setSelectedRowSummary]);

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between gap-3'>
                <h1 className='text-xl font-medium text-gray-900'>Техкарты — Активные</h1>
                <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                    Открыть реестр развёртывания
                </Link>
            </div>
            <Card>
                <p className='text-sm text-gray-700'>Техкарты, допущенные к исполнению.</p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена сущность: ${focusEntity}. Строка подсвечена.`
                            : `Сущность ${focusEntity} не найдена среди активных техкарт.`}
                    </p>
                </Card>
            )}

            <Card>{loading ? <p className='text-sm text-gray-500'>Загрузка...</p> : <MapTable rows={activeRows} isFocused={isFocused} />}</Card>
        </div>
    );
}

function renderGenerationBadges(item: TechMapItem) {
    const badges = [];

    if (item.generationMetadata?.generationStrategy) {
        badges.push(
                <span key="strategy" className='px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium border border-sky-100'>
                {formatGenerationStrategyLabel(item.generationMetadata.generationStrategy)}
            </span>,
        );
    }

    if (item.generationMetadata?.rolloutMode) {
        badges.push(
            <span key="mode" className='px-2 py-0.5 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                режим {formatRolloutModeLabel(item.generationMetadata.rolloutMode)}
            </span>,
        );
    }

    if (item.generationMetadata?.fallbackUsed) {
        badges.push(
            <span key="fallback" className='px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100'>
                резервный сценарий
            </span>,
        );
    }

    if (item.generationMetadata?.shadowParitySummary?.hasBlockingDiffs) {
        badges.push(
                <span key="parity-p0" className='px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-100'>
                критических расхождений {item.generationMetadata.shadowParitySummary.severityCounts?.P0 || 0}
            </span>,
        );
    } else if (typeof item.generationMetadata?.shadowParitySummary?.diffCount === 'number') {
        badges.push(
            <span key="parity" className='px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                расхождений {item.generationMetadata.shadowParitySummary.diffCount}
            </span>,
        );
    }

    if (item.cropForm || item.canonicalBranch) {
        badges.push(
                <span key="branch" className='px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                {item.cropForm ? formatCropFormLabel(item.cropForm) : formatCanonicalBranchLabel(item.canonicalBranch)}
            </span>,
        );
    }

    return badges;
}

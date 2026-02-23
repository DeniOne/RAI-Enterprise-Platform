'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type PlanItem = {
    id: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    account?: { name?: string | null } | null;
};

export default function Page() {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.crm.plans();
                setPlans(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const groupedByStatus = useMemo(() => {
        const acc: Record<string, number> = {};
        plans.forEach((p) => {
            const key = String(p.status || 'UNKNOWN');
            acc[key] = (acc[key] || 0) + 1;
        });
        return Object.entries(acc).sort((a, b) => b[1] - a[1]);
    }, [plans]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: plans,
        matchItem: (plan, context) => includesFocus([plan.id, plan.status, plan.account?.name], context.focusEntity),
        watch: [plans.length],
    });

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>История сезонов</h1>
            <Card>
                <p className='text-sm text-gray-700'>История формируется по жизненному циклу планов и их текущим статусам.</p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена сущность: ${focusEntity}. Запись подсвечена.`
                            : `Сущность ${focusEntity} не найдена в истории.`}
                    </p>
                </Card>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                    <h3 className='text-sm font-semibold mb-3'>Сводка по статусам</h3>
                    {loading ? (
                        <p className='text-sm text-gray-500'>Загрузка...</p>
                    ) : groupedByStatus.length === 0 ? (
                        <p className='text-sm text-gray-500'>Данных пока нет.</p>
                    ) : (
                        <ul className='space-y-2 text-sm'>
                            {groupedByStatus.map(([status, count]) => {
                                const focused = includesFocus([status], focusEntity);
                                return (
                                    <li key={status} data-focus={focused ? 'true' : 'false'} className={clsx('flex justify-between border-b last:border-b-0 py-2', focused && 'bg-sky-50 ring-1 ring-sky-200 rounded px-2')}>
                                        <span>{status}</span>
                                        <span className='font-semibold'>{count}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <Card>
                    <h3 className='text-sm font-semibold mb-3'>Последние изменения</h3>
                    {loading ? (
                        <p className='text-sm text-gray-500'>Загрузка...</p>
                    ) : plans.length === 0 ? (
                        <p className='text-sm text-gray-500'>Данных пока нет.</p>
                    ) : (
                        <ul className='space-y-2 text-sm'>
                            {plans
                                .slice()
                                .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
                                .slice(0, 8)
                                .map((plan) => {
                                    const focused = isFocused(plan);

                                    return (
                                        <li key={plan.id} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0 py-2', focused && 'bg-sky-50 ring-1 ring-sky-200 rounded px-2')}>
                                            <div className='text-gray-900'>{plan.account?.name || 'Без хозяйства'}</div>
                                            <div className='text-xs text-gray-500'>
                                                {plan.status || 'UNKNOWN'} • {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('ru-RU') : '-'}
                                            </div>
                                        </li>
                                    );
                                })}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

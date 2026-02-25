'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type PlanItem = {
    id: string;
    status?: string;
    account?: { name?: string | null } | null;
    updatedAt?: string;
};

export default function Page() {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.consulting.plans();
                setPlans(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Failed to load archive plans:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const archivedPlans = useMemo(
        () => plans.filter((p) => ['DONE', 'ARCHIVE'].includes(String(p.status))),
        [plans],
    );

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Планы урожая — Архив</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Завершённые и архивные планы для ретроспективы и анализа.
                </p>
            </Card>
            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : archivedPlans.length === 0 ? (
                    <p className='text-sm text-gray-500'>Архивных планов не найдено.</p>
                ) : (
                    <ul className='space-y-2 text-sm'>
                        {archivedPlans.map((plan) => (
                            <li key={plan.id} className='border-b last:border-b-0 py-2'>
                                <div className='text-gray-900'>{plan.account?.name || 'Без хозяйства'}</div>
                                <div className='text-xs text-gray-500'>
                                    {plan.status || 'UNKNOWN'} • {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('ru-RU') : '-'}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

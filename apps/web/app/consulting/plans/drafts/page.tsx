'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type PlanItem = {
    id: string;
    status?: string;
    account?: { name?: string | null } | null;
    createdAt?: string;
};

function PlansTable({ title, plans }: { title: string; plans: PlanItem[] }) {
    return (
        <Card>
            <h3 className='text-sm font-semibold mb-3'>{title}</h3>
            {plans.length === 0 ? (
                <p className='text-sm text-gray-500'>Нет записей для этого статуса.</p>
            ) : (
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='text-left text-gray-500 border-b'>
                                <th className='py-2 pr-4'>ID</th>
                                <th className='py-2 pr-4'>Хозяйство</th>
                                <th className='py-2 pr-4'>Статус</th>
                                <th className='py-2'>Создан</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id} className='border-b last:border-b-0'>
                                    <td className='py-2 pr-4 font-mono text-xs'>{plan.id.slice(0, 10)}</td>
                                    <td className='py-2 pr-4'>{plan.account?.name || 'Без хозяйства'}</td>
                                    <td className='py-2 pr-4'>{plan.status || 'UNKNOWN'}</td>
                                    <td className='py-2'>
                                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('ru-RU') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

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
                console.error('Failed to load draft plans:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const draftPlans = useMemo(
        () => plans.filter((p) => String(p.status) === 'DRAFT'),
        [plans],
    );

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Планы урожая — Черновики</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Черновые планы до отправки на проверку и согласование.
                </p>
            </Card>
            {loading ? <Card><p className='text-sm text-gray-500'>Загрузка...</p></Card> : <PlansTable title='Статус DRAFT' plans={draftPlans} />}
        </div>
    );
}

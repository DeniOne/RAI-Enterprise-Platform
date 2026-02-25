'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type PlanItem = {
    id: string;
    account?: { name?: string | null } | null;
};

type HarvestResult = {
    plannedYield?: number;
    actualYield?: number;
    totalOutput?: number;
    marketPrice?: number;
};

export default function Page() {
    const [rows, setRows] = useState<Array<{ plan: PlanItem; result: HarvestResult | null }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const plansRes = await api.consulting.plans();
                const plans = Array.isArray(plansRes.data) ? plansRes.data : [];

                const data = await Promise.all(
                    plans.slice(0, 20).map(async (plan: PlanItem) => {
                        try {
                            const resultRes = await api.consulting.yield.getByPlan(plan.id);
                            return { plan, result: (resultRes.data || null) as HarvestResult | null };
                        } catch {
                            return { plan, result: null };
                        }
                    }),
                );

                setRows(data);
            } catch (error) {
                console.error('Failed to load performance data:', error);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const summary = useMemo(() => {
        const values = rows
            .map(({ result }) => {
                if (!result) return null;
                const delta = (result.actualYield ?? 0) - (result.plannedYield ?? 0);
                const output = result.totalOutput ?? 0;
                const price = result.marketPrice ?? 0;
                return Math.max(0, delta) * output * price;
            })
            .filter((v): v is number => v !== null);

        const total = values.reduce((acc, v) => acc + v, 0);
        return {
            plans: values.length,
            total,
            avg: values.length > 0 ? total / values.length : 0,
        };
    }, [rows]);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Performance-оплата</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Оценка вознаграждения на базе доступного план/факт результата (предварительный расчет).
                </p>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Card>
                    <p className='text-xs text-gray-500 mb-1'>Планов в расчете</p>
                    <p className='text-2xl font-semibold'>{loading ? '...' : summary.plans}</p>
                </Card>
                <Card>
                    <p className='text-xs text-gray-500 mb-1'>Суммарная база</p>
                    <p className='text-2xl font-semibold'>{loading ? '...' : summary.total.toFixed(2)}</p>
                </Card>
                <Card>
                    <p className='text-xs text-gray-500 mb-1'>Средняя база</p>
                    <p className='text-2xl font-semibold'>{loading ? '...' : summary.avg.toFixed(2)}</p>
                </Card>
            </div>

            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : rows.length === 0 ? (
                    <p className='text-sm text-gray-500'>Данных нет.</p>
                ) : (
                    <ul className='space-y-2 text-sm'>
                        {rows.map(({ plan, result }) => {
                            if (!result) {
                                return (
                                    <li key={plan.id} className='border-b last:border-b-0 py-2'>
                                        {plan.account?.name || 'Без хозяйства'} • нет результата
                                    </li>
                                );
                            }

                            const delta = (result.actualYield ?? 0) - (result.plannedYield ?? 0);
                            const base = Math.max(0, delta) * (result.totalOutput ?? 0) * (result.marketPrice ?? 0);

                            return (
                                <li key={plan.id} className='border-b last:border-b-0 py-2 flex justify-between'>
                                    <span>{plan.account?.name || 'Без хозяйства'}</span>
                                    <span className='font-semibold'>{base.toFixed(2)}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
}

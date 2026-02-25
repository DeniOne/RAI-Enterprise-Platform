'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type PlanItem = {
    id: string;
    status?: string;
    account?: { name?: string | null } | null;
};

type HarvestResult = {
    plannedYield?: number;
    actualYield?: number;
    totalOutput?: number;
    marketPrice?: number;
};

export default function Page() {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [rows, setRows] = useState<Array<{ plan: PlanItem; result: HarvestResult | null }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const plansRes = await api.consulting.plans();
                const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
                setPlans(plansData);

                const withResults = await Promise.all(
                    plansData.slice(0, 20).map(async (plan: PlanItem) => {
                        try {
                            const resultRes = await api.consulting.yield.getByPlan(plan.id);
                            return { plan, result: (resultRes.data || null) as HarvestResult | null };
                        } catch {
                            return { plan, result: null };
                        }
                    }),
                );

                setRows(withResults);
            } catch (error) {
                console.error('Failed to load plan-fact data:', error);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const summary = useMemo(() => {
        const withResult = rows.filter((r) => r.result);
        const count = withResult.length;
        const avgDelta = count === 0
            ? null
            : withResult.reduce((acc, r) => {
                const planned = r.result?.plannedYield ?? 0;
                const actual = r.result?.actualYield ?? 0;
                return acc + (actual - planned);
            }, 0) / count;
        return { count, avgDelta };
    }, [rows]);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Сравнение с планом</h1>
            <Card>
                <p className='text-sm text-gray-700'>План/факт анализ по доступным результатам урожая.</p>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                    <p className='text-xs text-gray-500 mb-1'>Планов с результатом</p>
                    <p className='text-2xl font-semibold'>{loading ? '...' : summary.count}</p>
                </Card>
                <Card>
                    <p className='text-xs text-gray-500 mb-1'>Средний Δ урожайности</p>
                    <p className='text-2xl font-semibold'>
                        {loading ? '...' : summary.avgDelta === null ? '-' : summary.avgDelta.toFixed(2)}
                    </p>
                </Card>
            </div>

            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : rows.length === 0 ? (
                    <p className='text-sm text-gray-500'>Данных нет.</p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-gray-500 border-b'>
                                    <th className='py-2 pr-4'>Хозяйство</th>
                                    <th className='py-2 pr-4'>План</th>
                                    <th className='py-2 pr-4'>Факт</th>
                                    <th className='py-2'>Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ plan, result }) => {
                                    const planned = result?.plannedYield ?? null;
                                    const actual = result?.actualYield ?? null;
                                    const delta = planned === null || actual === null ? null : actual - planned;
                                    return (
                                        <tr key={plan.id} className='border-b last:border-b-0'>
                                            <td className='py-2 pr-4'>{plan.account?.name || 'Без хозяйства'}</td>
                                            <td className='py-2 pr-4'>{planned ?? '-'}</td>
                                            <td className='py-2 pr-4'>{actual ?? '-'}</td>
                                            <td className='py-2'>{delta === null ? '-' : delta.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

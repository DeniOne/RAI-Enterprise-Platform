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
    id: string;
    crop?: string;
    actualYield?: number;
    totalOutput?: number;
    marketPrice?: number;
    harvestDate?: string;
};

export default function Page() {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [result, setResult] = useState<HarvestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingResult, setLoadingResult] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.consulting.plans();
                const data = Array.isArray(response.data) ? response.data : [];
                setPlans(data);
                if (data.length > 0) {
                    setSelectedPlanId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to load plans for results:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadResult = async () => {
            if (!selectedPlanId) {
                setResult(null);
                return;
            }
            setLoadingResult(true);
            try {
                const response = await api.consulting.yield.getByPlan(selectedPlanId);
                setResult(response.data || null);
            } catch {
                setResult(null);
            } finally {
                setLoadingResult(false);
            }
        };
        loadResult();
    }, [selectedPlanId]);

    const selectedPlanName = useMemo(() => {
        const plan = plans.find((p) => p.id === selectedPlanId);
        return plan?.account?.name || 'Без хозяйства';
    }, [plans, selectedPlanId]);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Фактический урожай</h1>
            <Card>
                <p className='text-sm text-gray-700'>Просмотр фактических результатов по выбранному плану.</p>
            </Card>

            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка планов...</p>
                ) : plans.length === 0 ? (
                    <p className='text-sm text-gray-500'>Планы отсутствуют.</p>
                ) : (
                    <div className='space-y-4'>
                        <label className='block text-sm'>
                            План:
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className='mt-1 w-full md:w-96 border border-gray-300 rounded-xl px-3 py-2'
                            >
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.account?.name || 'Без хозяйства'} • {plan.status || 'UNKNOWN'}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {loadingResult ? (
                            <p className='text-sm text-gray-500'>Загрузка результата...</p>
                        ) : !result ? (
                            <p className='text-sm text-gray-500'>По выбранному плану пока нет зафиксированного результата.</p>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                                <Card>
                                    <p className='text-xs text-gray-500'>Хозяйство</p>
                                    <p className='font-semibold'>{selectedPlanName}</p>
                                </Card>
                                <Card>
                                    <p className='text-xs text-gray-500'>Культура</p>
                                    <p className='font-semibold'>{result.crop || '-'}</p>
                                </Card>
                                <Card>
                                    <p className='text-xs text-gray-500'>Факт. урожайность</p>
                                    <p className='font-semibold'>{result.actualYield ?? '-'} </p>
                                </Card>
                                <Card>
                                    <p className='text-xs text-gray-500'>Валовый сбор</p>
                                    <p className='font-semibold'>{result.totalOutput ?? '-'}</p>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { getEntityTransitions, HarvestPlanStatus } from '@/lib/consulting/ui-policy';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';

type Plan = {
    id: string;
    status?: HarvestPlanStatus;
    targetMetric?: string;
    period?: string;
    accountId?: string;
    activeTechMapId?: string | null;
    deviationReviews?: Array<unknown>;
    account?: { name?: string | null } | null;
    createdAt?: string;
    updatedAt?: string;
};

export default function PlanDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const authority = useAuthority();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [transitionLoading, setTransitionLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.consulting.plans();
                const loadedPlans = Array.isArray(response.data) ? response.data : [];
                setPlans(loadedPlans);
                const found = loadedPlans.find((p: Plan) => p.id === params.id) || null;
                setPlan(found);
            } catch (error) {
                console.error('Failed to load plan details:', error);
                setPlan(null);
                setPlans([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id]);

    const title = useMemo(() => {
        if (!plan) return 'План не найден';
        return plan.targetMetric || `План ${plan.id.slice(0, 8)}`;
    }, [plan]);

    const domainContext = useMemo<DomainUiContext>(() => {
        const hasActiveTechMap = plans.some((p) => Boolean(p.activeTechMapId));
        const hasLockedBudget = plans.some((p) => p.status === 'ACTIVE');
        const criticalDeviations = plans.reduce((acc, p) => acc + (p.deviationReviews?.length || 0), 0);

        return {
            plansCount: plans.length,
            activeTechMap: hasActiveTechMap,
            lockedBudget: hasLockedBudget,
            criticalDeviations,
            advisoryRiskLevel: criticalDeviations > 0 ? 'medium' : 'low',
        };
    }, [plans]);

    const transitions = useMemo(() => {
        if (!plan?.status) return null;
        return getEntityTransitions('harvest-plan', plan.status, authority, domainContext);
    }, [plan?.status, authority, domainContext]);

    const handleTransition = async (targetStatus: string) => {
        if (!plan) return;

        setTransitionLoading(true);
        try {
            await api.consulting.transitionPlan(plan.id, targetStatus);
            router.push(`/consulting/plans?updated=${Date.now()}`);
            router.refresh();
        } catch (error) {
            console.error('Failed to transition plan:', error);
            alert('Ошибка при смене статуса плана');
        } finally {
            setTransitionLoading(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h1 className='text-xl font-medium text-gray-900'>{title}</h1>
                <Link href='/consulting/plans' className='text-sm text-blue-600 hover:underline'>
                    {'<- Назад к планам'}
                </Link>
            </div>

            {loading ? (
                <Card>
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                </Card>
            ) : !plan ? (
                <Card>
                    <p className='text-sm text-gray-500'>План с таким ID не найден.</p>
                </Card>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>ID плана</p>
                        <p className='font-mono text-sm'>{plan.id}</p>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Статус</p>
                        <p className='font-semibold'>{plan.status || 'UNKNOWN'}</p>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-3'>Действия по статусу</p>
                        <div className='flex flex-wrap gap-2'>
                            {(transitions?.allowedTransitions || []).map((t) => (
                                <button
                                    key={t.target}
                                    onClick={() => handleTransition(t.target)}
                                    disabled={transitionLoading}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {transitionLoading ? 'Обновление...' : t.label}
                                </button>
                            ))}
                            {(!transitions || transitions.allowedTransitions.length === 0) && (
                                <p className='text-xs text-gray-500'>
                                    Для текущего статуса нет доступных переходов.
                                </p>
                            )}
                        </div>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Хозяйство</p>
                        <p className='font-semibold'>{plan.account?.name || 'Без названия'}</p>
                        <p className='text-xs text-gray-500 mt-1'>accountId: {plan.accountId || '-'}</p>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Период</p>
                        <p className='font-semibold'>{plan.period || '-'}</p>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Создан</p>
                        <p className='font-semibold'>{plan.createdAt ? new Date(plan.createdAt).toLocaleString('ru-RU') : '-'}</p>
                    </Card>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Обновлён</p>
                        <p className='font-semibold'>{plan.updatedAt ? new Date(plan.updatedAt).toLocaleString('ru-RU') : '-'}</p>
                    </Card>
                </div>
            )}
        </div>
    );
}

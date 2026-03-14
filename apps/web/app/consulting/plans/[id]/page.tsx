'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { getEntityTransitions, HarvestPlanStatus } from '@/lib/consulting/ui-policy';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';

type LinkedTechMap = {
    id: string;
    status: string;
    version?: number;
    crop?: string | null;
    updatedAt?: string;
};

type Plan = {
    id: string;
    status?: HarvestPlanStatus;
    targetMetric?: string;
    period?: string;
    accountId?: string;
    seasonId?: string | null;
    activeTechMapId?: string | null;
    deviationReviews?: Array<unknown>;
    techMaps?: LinkedTechMap[];
    account?: { name?: string | null } | null;
    createdAt?: string;
    updatedAt?: string;
};

type SeasonOption = {
    id: string;
    year?: number;
    fieldId?: string | null;
    startDate?: string;
};

export default function PlanDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const authority = useAuthority();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [seasons, setSeasons] = useState<SeasonOption[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState('');
    const [loading, setLoading] = useState(true);
    const [transitionLoading, setTransitionLoading] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [planResponse, seasonsResponse] = await Promise.all([
                api.consulting.plan(params.id),
                api.seasons.list(),
            ]);

            const nextPlan = planResponse.data as Plan;
            const nextSeasons = Array.isArray(seasonsResponse.data) ? seasonsResponse.data : [];

            setPlan(nextPlan);
            setSeasons(nextSeasons);
            setSelectedSeasonId(nextPlan?.seasonId || nextSeasons[0]?.id || '');
        } catch (error) {
            console.error('Failed to load plan details:', error);
            setPlan(null);
            setSeasons([]);
            setSelectedSeasonId('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [params.id]);

    const title = useMemo(() => {
        if (!plan) return 'План не найден';
        return plan.targetMetric || `План ${plan.id.slice(0, 8)}`;
    }, [plan]);

    const domainContext = useMemo<DomainUiContext>(() => {
        const hasActiveTechMap = Boolean(
            plan?.activeTechMapId || plan?.techMaps?.some((map) => map.status === 'ACTIVE'),
        );

        return {
            plansCount: plan ? 1 : 0,
            activeTechMap: hasActiveTechMap,
            lockedBudget: false,
            criticalDeviations: plan?.deviationReviews?.length || 0,
            advisoryRiskLevel: (plan?.deviationReviews?.length || 0) > 0 ? 'medium' : 'low',
        };
    }, [plan]);

    const transitions = useMemo(() => {
        if (!plan?.status) return null;
        return getEntityTransitions('harvest-plan', plan.status, authority, domainContext);
    }, [plan?.status, authority, domainContext]);

    const handleTransition = async (targetStatus: string) => {
        if (!plan) return;

        setTransitionLoading(true);
        try {
            await api.consulting.transitionPlan(plan.id, targetStatus);
            await load();
            router.refresh();
        } catch (error) {
            console.error('Failed to transition plan:', error);
            alert('Ошибка при смене статуса плана');
        } finally {
            setTransitionLoading(false);
        }
    };

    const handleGenerateTechMap = async () => {
        if (!plan) return;
        if (!selectedSeasonId.trim()) {
            alert('Выберите сезон для генерации техкарты');
            return;
        }

        setGenerateLoading(true);
        try {
            const response = await api.consulting.techmaps.generate({
                harvestPlanId: plan.id,
                seasonId: selectedSeasonId,
            });

            const techMapId = response?.data?.id;
            await load();

            if (techMapId) {
                router.push(`/consulting/techmaps/${techMapId}`);
                router.refresh();
            }
        } catch (error: any) {
            console.error('Failed to generate tech map:', error);
            alert(error?.response?.data?.message || 'Ошибка генерации техкарты');
        } finally {
            setGenerateLoading(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900'>{title}</h1>
                    <p className='text-sm text-gray-500'>План, связанный с подготовкой и исполнением техкарты.</p>
                </div>
                <div className='flex items-center gap-3'>
                    <Link href='/consulting/techmaps/demo' className='text-sm text-blue-600 hover:underline'>
                        Демо-поток
                    </Link>
                    <Link href='/consulting/plans' className='text-sm text-blue-600 hover:underline'>
                        {'<- Назад к планам'}
                    </Link>
                </div>
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
                <>
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
                            <p className='text-xs text-gray-500 mb-1'>Хозяйство</p>
                            <p className='font-semibold'>{plan.account?.name || 'Без названия'}</p>
                            <p className='text-xs text-gray-500 mt-1'>accountId: {plan.accountId || '-'}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Сезон</p>
                            <p className='font-semibold'>{plan.seasonId || 'Не привязан'}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Период</p>
                            <p className='font-semibold'>{plan.period || '-'}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Создан</p>
                            <p className='font-semibold'>{plan.createdAt ? new Date(plan.createdAt).toLocaleString('ru-RU') : '-'}</p>
                        </Card>
                    </div>

                    <Card>
                        <p className='text-xs text-gray-500 mb-3'>Статусные переходы плана</p>
                        <div className='flex flex-wrap gap-2'>
                            {(transitions?.allowedTransitions || []).map((transition) => (
                                <button
                                    key={transition.target}
                                    onClick={() => handleTransition(transition.target)}
                                    disabled={transitionLoading}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {transitionLoading ? 'Обновление...' : transition.label}
                                </button>
                            ))}
                            {(!transitions || transitions.allowedTransitions.length === 0) && (
                                <p className='text-xs text-gray-500'>Для текущего статуса нет доступных переходов.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                            <div className='space-y-1'>
                                <p className='text-xs text-gray-500'>Генерация техкарты</p>
                                <p className='text-sm text-gray-600'>
                                    Генератор создаст непустую карту со стадиями, операциями и нормами ресурсов.
                                </p>
                            </div>
                            <div className='flex flex-col md:flex-row gap-3 md:items-center'>
                                <select
                                    value={selectedSeasonId}
                                    onChange={(event) => setSelectedSeasonId(event.target.value)}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm min-w-72 bg-white'
                                >
                                    <option value=''>Выберите сезон</option>
                                    {seasons.map((season) => (
                                        <option key={season.id} value={season.id}>
                                            {`Сезон ${season.year ?? '-'} • ${season.fieldId ?? 'без поля'}`}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleGenerateTechMap}
                                    disabled={generateLoading}
                                    className='px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {generateLoading ? 'Генерация...' : 'Сгенерировать техкарту'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='flex items-center justify-between gap-3 mb-4'>
                            <div>
                                <p className='text-xs text-gray-500'>Связанные техкарты</p>
                                <p className='text-sm text-gray-600'>Из этого блока можно перейти к содержимому карты и её статусам.</p>
                            </div>
                            <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                                Открыть реестр техкарт
                            </Link>
                        </div>

                        {!plan.techMaps || plan.techMaps.length === 0 ? (
                            <p className='text-sm text-gray-500'>По этому плану техкарты ещё не созданы.</p>
                        ) : (
                            <div className='space-y-3'>
                                {plan.techMaps.map((techMap) => (
                                    <div key={techMap.id} className='border border-black/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                                        <div>
                                            <p className='font-semibold text-gray-900'>
                                                {(techMap.crop || 'Культура не указана').toUpperCase()} • v{techMap.version ?? '-'}
                                            </p>
                                            <p className='text-xs text-gray-500'>
                                                {techMap.id} • {techMap.status} • {techMap.updatedAt ? new Date(techMap.updatedAt).toLocaleString('ru-RU') : '-'}
                                            </p>
                                        </div>
                                        <div className='flex items-center gap-3'>
                                            {techMap.id === plan.activeTechMapId && (
                                                <span className='px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold'>
                                                    activeTechMap
                                                </span>
                                            )}
                                            <Link
                                                href={`/consulting/techmaps/${techMap.id}`}
                                                className='px-4 py-2 border border-black/10 rounded-xl text-sm hover:bg-gray-50'
                                            >
                                                Открыть техкарту
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}

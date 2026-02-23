'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type PlanItem = {
    id: string;
    status?: string;
    account?: { id?: string; name?: string | null } | null;
};

export default function Page() {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    const load = async () => {
        setLoading(true);
        setErrorMessage(null);
        setForbidden(false);
        try {
            const response = await api.crm.plans();
            setPlans(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to load farms:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить реестр хозяйств. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const farms = useMemo(() => {
        const map = new Map<string, { id: string; name: string; plans: number; active: number }>();
        plans.forEach((plan) => {
            const id = String(plan.account?.id || plan.account?.name || 'UNKNOWN');
            const name = String(plan.account?.name || 'Не указано');
            const current = map.get(id) || { id, name, plans: 0, active: 0 };
            current.plans += 1;
            if (['REVIEW', 'APPROVED', 'ACTIVE'].includes(String(plan.status))) {
                current.active += 1;
            }
            map.set(id, current);
        });
        return Array.from(map.values()).sort((a, b) => b.plans - a.plans);
    }, [plans]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: farms,
        matchItem: (farm, context) => includesFocus([farm.id, farm.name], context.focusEntity),
        watch: [farms.length],
    });

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Реестр хозяйств</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Сформировано по данным планов урожая и привязанных аккаунтов.
                </p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена сущность: ${focusEntity}. Запись подсвечена.`
                            : `Сущность ${focusEntity} не найдена в текущем списке.`}
                    </p>
                </Card>
            )}

            {forbidden ? (
                <Card className='border-amber-200 bg-amber-50'>
                    <p className='text-sm text-amber-700'>Недостаточно прав для просмотра реестра хозяйств.</p>
                </Card>
            ) : errorMessage ? (
                <Card className='border-rose-200 bg-rose-50'>
                    <p className='text-sm text-rose-700 mb-3'>{errorMessage}</p>
                    <button onClick={() => void load()} className='text-sm font-medium text-rose-700 hover:underline'>
                        Повторить запрос
                    </button>
                </Card>
            ) : (
                <Card>
                    {loading ? (
                        <p className='text-sm text-gray-500'>Загрузка...</p>
                    ) : farms.length === 0 ? (
                        <div className='space-y-3'>
                            <p className='text-sm text-gray-500'>Данные пока отсутствуют.</p>
                            <Link href='/consulting/plans/drafts' className='text-sm font-medium text-gray-900 hover:underline'>
                                Перейти к созданию первого плана
                            </Link>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='text-left text-gray-500 border-b'>
                                        <th className='py-2 pr-4'>Хозяйство</th>
                                        <th className='py-2 pr-4'>Планов</th>
                                        <th className='py-2'>Активных</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {farms.map((farm) => {
                                        const focused = isFocused(farm);

                                        return (
                                            <tr key={farm.id} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                                <td className='py-2 pr-4 text-gray-900'>{farm.name}</td>
                                                <td className='py-2 pr-4'>{farm.plans}</td>
                                                <td className='py-2'>{farm.active}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}

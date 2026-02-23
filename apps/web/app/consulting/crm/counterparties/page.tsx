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

type Counterparty = {
    id: string;
    name: string;
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
            console.error('Failed to load counterparties:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить список контрагентов. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const counterparties = useMemo<Counterparty[]>(() => {
        const map = new Map<string, Counterparty>();
        plans.forEach((plan) => {
            const id = String(plan.account?.id || plan.account?.name || '').trim();
            const name = String(plan.account?.name || '').trim();
            if (!id || !name) return;
            map.set(id, { id, name });
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [plans]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: counterparties,
        matchItem: (counterparty, context) => includesFocus([counterparty.id, counterparty.name], context.focusEntity),
        watch: [counterparties.length],
    });

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Контрагенты</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Текущий список контрагентов, участвующих в планах урожая.
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
                    <p className='text-sm text-amber-700'>Недостаточно прав для просмотра списка контрагентов.</p>
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
                    ) : counterparties.length === 0 ? (
                        <div className='space-y-3'>
                            <p className='text-sm text-gray-500'>Контрагенты пока не найдены.</p>
                            <Link href='/consulting/crm/farms' className='text-sm font-medium text-gray-900 hover:underline'>
                                Перейти в реестр хозяйств
                            </Link>
                        </div>
                    ) : (
                        <ul className='space-y-2 text-sm'>
                            {counterparties.map((counterparty) => {
                                const focused = isFocused(counterparty);

                                return (
                                    <li key={counterparty.id} data-focus={focused ? 'true' : 'false'} className={clsx('py-2 border-b last:border-b-0 text-gray-900', focused && 'bg-sky-50 ring-1 ring-sky-200 rounded px-2')}>
                                        {counterparty.name}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            )}
        </div>
    );
}

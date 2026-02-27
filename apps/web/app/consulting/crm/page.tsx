'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type FieldItem = {
    id: string;
    name?: string;
    areaHa?: number;
    status?: string;
};

type PlanItem = {
    id: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    account?: { id?: string; name?: string | null } | null;
};

const sections = [
    { href: '/assets/farms', label: 'Реестр хозяйств', desc: 'Asset:FARM как единый источник истины.' },
    { href: '/parties', label: 'Контрагенты', desc: 'Party-реестр без смешения с хозяйствами.' },
    { href: '/assets/fields', label: 'Поля', desc: 'Реестр активов FIELD.' },
    { href: '/assets/objects', label: 'Объекты', desc: 'Реестр активов OBJECT.' },
];

export default function Page() {
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    const load = async () => {
        setLoading(true);
        setErrorMessage(null);
        setForbidden(false);
        try {
            const [fieldsRes, plansRes] = await Promise.all([
                api.crm.fields(),
                api.crm.plans(),
            ]);
            setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
            setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        } catch (error) {
            console.error('CRM load failed:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить данные CRM. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const stats = useMemo(() => {
        const uniqueAccounts = new Set(
            plans
                .map((p) => p.account?.id || p.account?.name || '')
                .filter(Boolean),
        );
        const activePlans = plans.filter((p) => ['REVIEW', 'APPROVED', 'ACTIVE'].includes(String(p.status))).length;
        return {
            fields: fields.length,
            farms: uniqueAccounts.size,
            plans: plans.length,
            activePlans,
        };
    }, [fields, plans]);

    const latestCounterparties = useMemo(() => {
        const byCounterparty = new Map<string, { id: string; name: string; date: Date; status: string }>();

        plans.forEach((plan) => {
            const id = String(plan.account?.id || plan.account?.name || '').trim();
            const name = String(plan.account?.name || '').trim();
            if (!id || !name) return;

            const rawDate = plan.updatedAt || plan.createdAt || '';
            const parsed = rawDate ? new Date(rawDate) : new Date(0);
            const current = byCounterparty.get(id);

            if (!current || parsed.getTime() > current.date.getTime()) {
                byCounterparty.set(id, {
                    id,
                    name,
                    date: parsed,
                    status: String(plan.status || 'UNKNOWN'),
                });
            }
        });

        return Array.from(byCounterparty.values())
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
    }, [plans]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: sections,
        matchItem: (section, context) => includesFocus([section.label, section.desc, section.href], context.focusEntity),
        watch: [sections.length],
    });

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>CRM — Хозяйства и контрагенты</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Единая точка входа в реестр хозяйств, контрагентов, полей и истории сезонов.
                </p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена сущность: ${focusEntity}. Раздел подсвечен.`
                            : `Сущность ${focusEntity} не найдена в текущем списке.`}
                    </p>
                </Card>
            )}

            {forbidden ? (
                <Card className='border-amber-200 bg-amber-50'>
                    <p className='text-sm text-amber-700'>Недостаточно прав для просмотра CRM-данных.</p>
                </Card>
            ) : errorMessage ? (
                <Card className='border-rose-200 bg-rose-50'>
                    <p className='text-sm text-rose-700 mb-3'>{errorMessage}</p>
                    <button onClick={() => void load()} className='text-sm font-medium text-rose-700 hover:underline'>
                        Повторить запрос
                    </button>
                </Card>
            ) : (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <Link href='/assets/farms'><Card><p className='text-xs text-gray-500 mb-1'>Хозяйства</p><p className='text-2xl font-semibold'>{loading ? '...' : stats.farms}</p></Card></Link>
                        <Link href='/assets/fields'><Card><p className='text-xs text-gray-500 mb-1'>Поля</p><p className='text-2xl font-semibold'>{loading ? '...' : stats.fields}</p></Card></Link>
                        <Link href='/consulting/plans'><Card><p className='text-xs text-gray-500 mb-1'>Планы</p><p className='text-2xl font-semibold'>{loading ? '...' : stats.plans}</p></Card></Link>
                        <Link href='/consulting/plans/active'><Card><p className='text-xs text-gray-500 mb-1'>Активные планы</p><p className='text-2xl font-semibold'>{loading ? '...' : stats.activePlans}</p></Card></Link>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {sections.map((section) => {
                            const focused = isFocused(section);

                            return (
                                <Link key={section.href} href={section.href}>
                                    <Card data-focus={focused ? 'true' : 'false'} className={clsx('h-full hover:border-black/30 transition-colors', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                        <h3 className='text-sm font-semibold mb-2 text-gray-900'>{section.label}</h3>
                                        <p className='text-sm text-gray-600'>{section.desc}</p>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>

                    <Card>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-sm font-semibold text-gray-900'>Последние добавленные контрагенты</h3>
                            <Link href='/parties' className='text-xs font-medium text-gray-700 hover:underline'>
                                Открыть весь реестр
                            </Link>
                        </div>
                        {loading ? (
                            <p className='text-sm text-gray-500'>Загрузка...</p>
                        ) : latestCounterparties.length === 0 ? (
                            <p className='text-sm text-gray-500'>Контрагенты пока не найдены.</p>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm'>
                                    <thead>
                                        <tr className='text-left text-gray-500 border-b'>
                                            <th className='py-2 pr-4'>Наименование</th>
                                            <th className='py-2 pr-4'>Дата</th>
                                            <th className='py-2'>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestCounterparties.map((counterparty) => (
                                            <tr key={counterparty.id} className='border-b last:border-b-0'>
                                                <td className='py-2 pr-4 text-gray-900'>
                                                    <Link href={`/parties?entity=${encodeURIComponent(counterparty.name)}`} className='hover:underline'>
                                                        {counterparty.name}
                                                    </Link>
                                                </td>
                                                <td className='py-2 pr-4'>
                                                    {counterparty.date.getTime() > 0 ? counterparty.date.toLocaleDateString('ru-RU') : '-'}
                                                </td>
                                                <td className='py-2'>{counterparty.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}

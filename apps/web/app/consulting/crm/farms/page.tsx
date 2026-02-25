'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type FarmSeverity = 'ok' | 'warning' | 'critical';

type FarmItem = {
    id: string;
    name: string;
    plans: number;
    active: number;
    severity: FarmSeverity;
};

type FarmStats = { total: number; ok: number; warning: number; critical: number };

function severityLabel(severity: FarmSeverity): string {
    if (severity === 'critical') return 'Критично';
    if (severity === 'warning') return 'Риск';
    return 'В норме';
}

export default function Page() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const severity = String(searchParams.get('severity') || '').trim().toLowerCase();
    const sort = String(searchParams.get('sort') || 'plans_desc').trim().toLowerCase();
    const onlyRisk = String(searchParams.get('onlyRisk') || '').trim().toLowerCase() === 'true';
    const [farms, setFarms] = useState<FarmItem[]>([]);
    const [stats, setStats] = useState<FarmStats>({ total: 0, ok: 0, warning: 0, critical: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    const updateQueryParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams.toString());
        if (!value) next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    };

    const load = async () => {
        setLoading(true);
        setErrorMessage(null);
        setForbidden(false);
        try {
            const meRes = await api.users.me();
            const companyId = meRes?.data?.companyId;
            if (!companyId) {
                setErrorMessage('Не удалось определить компанию пользователя.');
                setFarms([]);
                return;
            }

            const response = await api.crm.farmsRegistry(companyId, {
                search: debouncedSearch.trim() || undefined,
                severity: severity || undefined,
                sort: sort || undefined,
                onlyRisk,
                page,
                pageSize: 20,
            });
            setFarms(Array.isArray(response.data?.items) ? response.data.items : []);
            setStats(response.data?.stats || { total: 0, ok: 0, warning: 0, critical: 0 });
            setTotalPages(Number(response.data?.totalPages || 1));
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
    }, [page, debouncedSearch, severity, sort, onlyRisk]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { focusEntity, focusSeverity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: farms,
        matchItem: (farm, context) => (
            includesFocus([farm.id, farm.name], context.focusEntity)
            || String(farm.severity).toUpperCase() === context.focusSeverity
        ),
        watch: [farms.length],
    });

    useEffect(() => {
        setPage(1);
    }, [severity]);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Реестр хозяйств</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Сформировано по данным планов урожая и привязанных аккаунтов.
                </p>
            </Card>
            <div className='flex flex-wrap gap-2'>
                <label className='flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-black/10'>
                    <input
                        type='checkbox'
                        checked={onlyRisk}
                        onChange={(event) => updateQueryParam('onlyRisk', event.target.checked ? 'true' : null)}
                    />
                    Только риск/критично
                </label>
                <select
                    value={sort}
                    onChange={(event) => updateQueryParam('sort', event.target.value)}
                    className='text-xs px-3 py-1.5 rounded-lg border border-black/10 bg-white'
                >
                    <option value='plans_desc'>Сортировка: планов ↓</option>
                    <option value='plans_asc'>Сортировка: планов ↑</option>
                    <option value='active_desc'>Сортировка: активных ↓</option>
                    <option value='active_asc'>Сортировка: активных ↑</option>
                    <option value='name_asc'>Сортировка: имя А-Я</option>
                    <option value='name_desc'>Сортировка: имя Я-А</option>
                </select>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Link href='/consulting/crm/farms'>
                    <Card>
                        <p className='text-xs text-gray-500 mb-1'>Всего хозяйств</p>
                        <p className='text-2xl font-semibold'>{loading ? '...' : stats.total}</p>
                    </Card>
                </Link>
                <Link href='/consulting/crm/farms?severity=ok'>
                    <Card className='border-emerald-200 bg-emerald-50'>
                        <p className='text-xs text-emerald-700 mb-1'>В норме</p>
                        <p className='text-2xl font-semibold text-emerald-900'>{loading ? '...' : stats.ok}</p>
                    </Card>
                </Link>
                <Link href='/consulting/crm/farms?severity=warning'>
                    <Card className='border-amber-200 bg-amber-50'>
                        <p className='text-xs text-amber-700 mb-1'>Риск</p>
                        <p className='text-2xl font-semibold text-amber-900'>{loading ? '...' : stats.warning}</p>
                    </Card>
                </Link>
                <Link href='/consulting/crm/farms?severity=critical'>
                    <Card className='border-red-400 bg-red-100'>
                        <p className='text-xs text-red-800 mb-1'>Критично</p>
                        <p className='text-2xl font-semibold text-red-900'>{loading ? '...' : stats.critical}</p>
                    </Card>
                </Link>
            </div>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найден фокус: ${focusEntity || focusSeverity}. Запись подсвечена.`
                            : `Фокус ${focusEntity || focusSeverity} не найден в текущем списке.`}
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
                    <div className='mb-4'>
                        <label htmlFor='farm-search' className='text-xs text-gray-500 block mb-1'>Поиск по хозяйствам</label>
                        <input
                            id='farm-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Введите название или ID хозяйства'
                            className='w-full md:w-96 px-3 py-2 border border-black/10 rounded-xl text-sm'
                        />
                    </div>
                    {loading ? (
                        <p className='text-sm text-gray-500'>Загрузка...</p>
                    ) : farms.length === 0 ? (
                        <div className='space-y-3'>
                            <p className='text-sm text-gray-500'>
                                {search.trim()
                                    ? 'По вашему запросу нет рискованных или критичных хозяйств.'
                                    : 'Рискованные и критичные хозяйства не найдены.'}
                            </p>
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
                                        <th className='py-2 pr-4'>Активных</th>
                                        <th className='py-2 pr-4'>Серьезность</th>
                                        <th className='py-2'>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {farms.map((farm) => {
                                        const focused = isFocused(farm);

                                        return (
                                        <tr key={farm.id} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                                <td className='py-2 pr-4 text-gray-900'>
                                                    <Link href={`/consulting/crm/farms/${encodeURIComponent(farm.id)}`} className='hover:underline'>
                                                        {farm.name}
                                                    </Link>
                                                </td>
                                                <td className='py-2 pr-4'>{farm.plans}</td>
                                                <td className='py-2'>{farm.active}</td>
                                                <td className='py-2 pr-4'>{severityLabel(farm.severity)}</td>
                                                <td className='py-2'>
                                                    <Link href={`/consulting/crm/history?entity=${encodeURIComponent(farm.name)}`} className='text-xs font-medium text-gray-700 hover:underline'>
                                                        История
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className='flex items-center justify-between mt-4'>
                        <p className='text-xs text-gray-500'>Страница {page} из {totalPages}</p>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page <= 1 || loading}
                                className='px-3 py-1.5 text-xs border border-black/10 rounded-lg disabled:opacity-50'
                            >
                                Назад
                            </button>
                            <button
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page >= totalPages || loading}
                                className='px-3 py-1.5 text-xs border border-black/10 rounded-lg disabled:opacity-50'
                            >
                                Далее
                            </button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

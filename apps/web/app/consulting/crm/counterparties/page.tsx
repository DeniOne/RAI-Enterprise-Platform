'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type AccountItem = {
    id: string;
    name?: string | null;
    inn?: string | null;
    type?: string | null;
    status?: string | null;
    riskCategory?: string | null;
    holdingId?: string | null;
};

type HoldingItem = {
    id: string;
    name: string;
    description?: string | null;
};

type RegistryRow =
    | { entity: 'HOLDING'; id: string; name: string; description?: string | null }
    | { entity: 'LEGAL_ENTITY'; id: string; name: string; inn?: string | null; type?: string | null; status?: string | null; riskCategory?: string | null; holdingId?: string | null };

type CreateForm = {
    entityKind: 'HOLDING' | 'LEGAL_ENTITY';
    name: string;
    inn: string;
    type: string;
    holdingId: string;
    description: string;
};
type CreatedHoldingHint = {
    id: string;
    name: string;
};

function sanitizeOptional(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
}

function accountTypeLabel(type?: string | null): string {
    const normalized = String(type || '').trim().toUpperCase();
    if (!normalized) return 'Не задано';
    if (normalized === 'NOT_SET') return 'Не задано';
    if (normalized === 'CLIENT') return 'Клиент';
    return normalized;
}

export default function CounterpartiesPage() {
    const [companyId, setCompanyId] = useState('');
    const [accounts, setAccounts] = useState<AccountItem[]>([]);
    const [holdings, setHoldings] = useState<HoldingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterRisk, setFilterRisk] = useState('ALL');
    const [filterResponsible, setFilterResponsible] = useState('');
    const [createForm, setCreateForm] = useState<CreateForm>({
        entityKind: 'LEGAL_ENTITY',
        name: '',
        inn: '',
        type: 'NOT_SET',
        holdingId: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [updatingHoldingId, setUpdatingHoldingId] = useState<string | null>(null);
    const [createdHoldingHint, setCreatedHoldingHint] = useState<CreatedHoldingHint | null>(null);

    const load = async () => {
        setLoading(true);
        setForbidden(false);
        setErrorMessage(null);
        try {
            const meRes = await api.users.me();
            const nextCompanyId = String(meRes?.data?.companyId || '').trim();
            if (!nextCompanyId) {
                setErrorMessage('Не удалось определить компанию пользователя.');
                setAccounts([]);
                setHoldings([]);
                return;
            }
            setCompanyId(nextCompanyId);
            const [accountsRes, holdingsRes] = await Promise.all([
                api.crm.accounts(nextCompanyId, {
                    search: search.trim() || undefined,
                    type: filterType !== 'ALL' && filterType !== 'HOLDING' ? filterType : undefined,
                    status: filterStatus !== 'ALL' ? filterStatus : undefined,
                    riskCategory: filterRisk !== 'ALL' ? filterRisk : undefined,
                    responsibleId: filterResponsible.trim() || undefined,
                }),
                api.crm.holdings(nextCompanyId),
            ]);
            setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
            setHoldings(Array.isArray(holdingsRes.data) ? holdingsRes.data : []);
        } catch (error) {
            console.error('Failed to load counterparties:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить реестр контрагентов. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [search, filterType, filterStatus, filterRisk, filterResponsible]);

    const rows = useMemo<RegistryRow[]>(() => {
        const mappedHoldings: RegistryRow[] = holdings.map((holding) => ({
            entity: 'HOLDING',
            id: holding.id,
            name: holding.name,
            description: holding.description,
        }));
        const mappedAccounts: RegistryRow[] = accounts.map((account) => ({
            entity: 'LEGAL_ENTITY',
            id: account.id,
            name: String(account.name || account.id),
            inn: account.inn,
            type: account.type,
            status: account.status,
            riskCategory: account.riskCategory,
            holdingId: account.holdingId,
        }));
        const joined = [...mappedHoldings, ...mappedAccounts];
        if (filterType === 'HOLDING') {
            return joined.filter((item) => item.entity === 'HOLDING');
        }
        return joined;
    }, [holdings, accounts, filterType]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: rows,
        matchItem: (row, context) => includesFocus([row.id, row.name, row.entity === 'LEGAL_ENTITY' ? row.inn : null], context.focusEntity),
        watch: [rows.length],
    });

    const onCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!companyId || submitting) return;
        const name = createForm.name.trim();
        if (!name) return;
        setSubmitting(true);
        setErrorMessage(null);
        try {
            if (createForm.entityKind === 'HOLDING') {
                const createdHolding = await api.crm.createHolding({
                    companyId,
                    name,
                    description: sanitizeOptional(createForm.description),
                });
                const createdHoldingId = String(createdHolding?.data?.id || '').trim();
                if (createdHoldingId) {
                    setCreatedHoldingHint({
                        id: createdHoldingId,
                        name,
                    });
                    setCreateForm({
                        entityKind: 'LEGAL_ENTITY',
                        name: '',
                        inn: '',
                        type: 'NOT_SET',
                        holdingId: createdHoldingId,
                        description: '',
                    });
                    setTimeout(() => {
                        const input = document.getElementById('counterparty-create-name');
                        if (input instanceof HTMLInputElement) input.focus();
                    }, 0);
                }
            } else {
                await api.crm.createAccount({
                    companyId,
                    name,
                    inn: sanitizeOptional(createForm.inn),
                    type: sanitizeOptional(createForm.type),
                    holdingId: sanitizeOptional(createForm.holdingId),
                });
                setCreateForm({
                    entityKind: 'LEGAL_ENTITY',
                    name: '',
                    inn: '',
                    type: 'NOT_SET',
                    holdingId: '',
                    description: '',
                });
                setCreatedHoldingHint(null);
            }
            await load();
        } catch (error) {
            console.error('Failed to create entity:', error);
            setErrorMessage('Не удалось создать запись. Проверьте поля и повторите.');
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdateHolding = async (accountId: string, holdingId: string) => {
        if (!companyId) return;
        setUpdatingHoldingId(accountId);
        setErrorMessage(null);
        try {
            await api.crm.updateAccountHolding(accountId, {
                companyId,
                holdingId: sanitizeOptional(holdingId) ?? null,
            });
            setAccounts((prev) => prev.map((item) => (item.id === accountId ? { ...item, holdingId: sanitizeOptional(holdingId) ?? null } : item)));
        } catch (error) {
            console.error('Failed to update holding:', error);
            setErrorMessage('Не удалось обновить привязку к холдингу. Повторите действие.');
        } finally {
            setUpdatingHoldingId(null);
        }
    };

    const prepareLegalEntityForHolding = (holdingId: string) => {
        const holding = holdings.find((item) => item.id === holdingId);
        setCreatedHoldingHint({
            id: holdingId,
            name: holding?.name || holdingId,
        });
        setCreateForm((prev) => ({
            ...prev,
            entityKind: 'LEGAL_ENTITY',
            type: 'NOT_SET',
            holdingId,
        }));
        const input = document.getElementById('counterparty-create-name');
        if (input instanceof HTMLInputElement) input.focus();
    };

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Контрагенты CRM</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Управление структурой клиентов: Холдинг → Юрлица → Хозяйства. Контрагент и Хозяйство ведутся раздельно.
                </p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена запись: ${focusEntity}. Запись подсвечена.`
                            : `Запись ${focusEntity} не найдена в текущем списке.`}
                    </p>
                </Card>
            )}

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
                <Card className='xl:col-span-2'>
                    <div className='flex items-center justify-between gap-3 mb-4'>
                        <h2 className='text-sm font-semibold text-gray-900'>Реестр контрагентов</h2>
                        <span className='text-xs text-gray-500'>Всего: {rows.length}</span>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-5 gap-2 mb-4'>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Поиск'
                            className='h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                        />
                        <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className='h-9 rounded-md border border-gray-300 px-2 text-xs text-gray-900 outline-none focus:border-gray-400'>
                            <option value='ALL'>Категория: все</option>
                            <option value='HOLDING'>Категория: холдинги</option>
                            <option value='NOT_SET'>Категория: не задано</option>
                            <option value='CLIENT'>Категория: клиенты</option>
                        </select>
                        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className='h-9 rounded-md border border-gray-300 px-2 text-xs text-gray-900 outline-none focus:border-gray-400'>
                            <option value='ALL'>Статус: все</option>
                            <option value='ACTIVE'>ACTIVE</option>
                            <option value='RISK'>RISK</option>
                            <option value='FROZEN'>FROZEN</option>
                        </select>
                        <select value={filterRisk} onChange={(event) => setFilterRisk(event.target.value)} className='h-9 rounded-md border border-gray-300 px-2 text-xs text-gray-900 outline-none focus:border-gray-400'>
                            <option value='ALL'>Риск: все</option>
                            <option value='CRITICAL'>CRITICAL</option>
                            <option value='HIGH'>HIGH</option>
                            <option value='MEDIUM'>MEDIUM</option>
                            <option value='LOW'>LOW</option>
                            <option value='NONE'>NONE</option>
                        </select>
                        <input
                            value={filterResponsible}
                            onChange={(event) => setFilterResponsible(event.target.value)}
                            placeholder='Ответственный (userId)'
                            className='h-9 rounded-md border border-gray-300 px-3 text-xs text-gray-900 outline-none focus:border-gray-400'
                        />
                    </div>

                    {forbidden ? (
                        <p className='text-sm text-amber-700'>Недостаточно прав для управления контрагентами.</p>
                    ) : errorMessage ? (
                        <div className='space-y-3'>
                            <p className='text-sm text-rose-700'>{errorMessage}</p>
                            <button onClick={() => void load()} className='text-sm font-medium text-rose-700 hover:underline'>
                                Повторить запрос
                            </button>
                        </div>
                    ) : loading ? (
                        <p className='text-sm text-gray-500'>Загрузка...</p>
                    ) : rows.length === 0 ? (
                        <p className='text-sm text-gray-500'>По фильтрам ничего не найдено.</p>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='text-left text-gray-500 border-b'>
                                        <th className='py-2 pr-3'>Категория</th>
                                        <th className='py-2 pr-3'>ИНН</th>
                                        <th className='py-2 pr-3'>Тип/статус</th>
                                        <th className='py-2 pr-3'>Холдинг</th>
                                        <th className='py-2 pr-3'>Структура</th>
                                        <th className='py-2'>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const focused = isFocused(row);
                                        const isSavingRow = updatingHoldingId === row.id;
                                        const isHolding = row.entity === 'HOLDING';
                                        return (
                                            <tr key={`${row.entity}:${row.id}`} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                                <td className='py-2 pr-3'>
                                                    <div className='text-gray-900 font-medium'>{row.name || row.id}</div>
                                                    <div className='text-xs text-gray-500'>{row.id}</div>
                                                </td>
                                                <td className='py-2 pr-3 text-gray-700'>{row.entity === 'LEGAL_ENTITY' ? row.inn || '-' : '-'}</td>
                                                <td className='py-2 pr-3 text-xs text-gray-700'>
                                                    {isHolding ? 'Холдинг' : `${accountTypeLabel(row.type)} / ${row.status || '-'}`}
                                                </td>
                                                <td className='py-2 pr-3'>
                                                    {row.entity === 'LEGAL_ENTITY' ? (
                                                        <input
                                                            defaultValue={row.holdingId || ''}
                                                            placeholder='holding-id'
                                                            onBlur={(event) => void onUpdateHolding(row.id, event.target.value)}
                                                            className='h-8 w-40 rounded-md border border-gray-300 px-2 text-xs text-gray-900 outline-none focus:border-gray-400'
                                                        />
                                                    ) : (
                                                        <span className='text-xs text-gray-500'>-</span>
                                                    )}
                                                </td>
                                                <td className='py-2 pr-3'>
                                                    <div className='flex flex-col items-start gap-1'>
                                                        {isHolding ? (
                                                            <button
                                                                onClick={() => prepareLegalEntityForHolding(row.id)}
                                                                className='text-xs font-medium text-gray-700 hover:underline'
                                                            >
                                                                Добавить юрлицо
                                                            </button>
                                                        ) : null}
                                                        <Link href={`/consulting/crm/farms?entity=${encodeURIComponent(row.name || row.id)}`} className='text-xs font-medium text-gray-700 hover:underline'>
                                                            Добавить хозяйство
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className='py-2'>
                                                    <div className='flex items-center gap-3'>
                                                        {row.entity === 'LEGAL_ENTITY' ? (
                                                            <Link href={`/consulting/crm/counterparties/${encodeURIComponent(row.id)}`} className='text-xs font-medium text-gray-700 hover:underline'>
                                                                Карточка
                                                            </Link>
                                                        ) : (
                                                            <button onClick={() => prepareLegalEntityForHolding(row.id)} className='text-xs font-medium text-gray-700 hover:underline'>
                                                                Добавить юрлицо
                                                            </button>
                                                        )}
                                                        <Link href={`/consulting/crm/history?entity=${encodeURIComponent(row.name || row.id)}`} className='text-xs font-medium text-gray-700 hover:underline'>
                                                            История
                                                        </Link>
                                                        {isSavingRow ? <span className='text-xs text-gray-500'>Сохранение...</span> : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Card>
                    <h2 className='text-sm font-semibold text-gray-900 mb-4'>Добавить запись</h2>
                    <form onSubmit={onCreate} className='space-y-3'>
                        <div>
                            <label className='mb-1 block text-xs text-gray-500'>Категория *</label>
                            <select
                                value={createForm.entityKind}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, entityKind: event.target.value as 'HOLDING' | 'LEGAL_ENTITY' }))}
                                className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                            >
                                <option value='HOLDING'>Холдинг</option>
                                <option value='LEGAL_ENTITY'>Юрлицо</option>
                            </select>
                        </div>
                        <div>
                            <label className='mb-1 block text-xs text-gray-500'>Наименование *</label>
                            <input
                                id='counterparty-create-name'
                                value={createForm.name}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder='ООО Агро Партнер'
                                className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                            />
                        </div>

                        {createForm.entityKind === 'HOLDING' ? (
                            <div>
                                <label className='mb-1 block text-xs text-gray-500'>Описание</label>
                                <input
                                    value={createForm.description}
                                    onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder='Описание холдинга'
                                    className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                                />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className='mb-1 block text-xs text-gray-500'>ИНН</label>
                                    <input
                                        value={createForm.inn}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, inn: event.target.value }))}
                                        placeholder='2310031234'
                                        className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                                    />
                                </div>
                                <div>
                                    <label className='mb-1 block text-xs text-gray-500'>Тип контрагента</label>
                                    <select
                                        value={createForm.type}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value }))}
                                        className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                                    >
                                        <option value='NOT_SET'>Не задано</option>
                                        <option value='CLIENT'>Клиент</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='mb-1 block text-xs text-gray-500'>Холдинг (ID)</label>
                                    <input
                                        value={createForm.holdingId}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, holdingId: event.target.value }))}
                                        placeholder='опционально'
                                        className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-400'
                                    />
                                </div>
                            </>
                        )}

                        <p className='text-xs text-gray-500'>
                            Правило: `Холдинг` обязан вести дочерние `Юрлица` и связанные `Хозяйства`; `Юрлицо` обязано иметь привязанные `Хозяйства`, даже при совпадении названий.
                        </p>
                        {createdHoldingHint ? (
                            <div className='rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900'>
                                Холдинг «{createdHoldingHint.name}» создан. Следующий шаг: добавьте юрлицо и сохраните привязку к этому холдингу.
                            </div>
                        ) : null}

                        <button
                            type='submit'
                            disabled={submitting || !createForm.name.trim() || !companyId}
                            className='h-9 w-full rounded-md bg-gray-900 px-3 text-sm font-medium text-white disabled:opacity-60'
                        >
                            {submitting ? 'Создание...' : 'Создать'}
                        </button>
                    </form>
                </Card>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type PlanItem = {
    id: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    activeTechMapId?: string | null;
    account?: { id?: string; name?: string | null } | null;
};

type FieldItem = {
    id: string;
    name?: string;
    area?: number;
    status?: string;
    clientId?: string;
    accountId?: string;
    ownerAccountId?: string;
};

type TechMapItem = {
    id: string;
    status?: string;
    harvestPlanId?: string;
    updatedAt?: string;
};

type AccountItem = {
    id: string;
    name?: string | null;
    inn?: string | null;
    holdingId?: string | null;
};

type ContextCell = {
    id: string;
    key: string;
    value: string;
};

function toUpper(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
}

function contextStorageKey(farmId: string): string {
    return `farm-context:${farmId}`;
}

export default function FarmCardPage() {
    const params = useParams<{ farmId: string }>();
    const farmId = String(params?.farmId || '').trim();
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [techmaps, setTechmaps] = useState<TechMapItem[]>([]);
    const [ownerAccount, setOwnerAccount] = useState<AccountItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [contextNote, setContextNote] = useState('');
    const [cells, setCells] = useState<ContextCell[]>([]);
    const [cellKey, setCellKey] = useState('');
    const [cellValue, setCellValue] = useState('');

    const load = async () => {
        setLoading(true);
        setForbidden(false);
        setErrorMessage(null);
        try {
            const meRes = await api.users.me();
            const companyId = meRes?.data?.companyId;
            if (!companyId) {
                setErrorMessage('Не удалось определить компанию пользователя.');
                return;
            }

            const farmRes = await api.crm.farmMap(farmId, companyId);
            const payload = farmRes?.data || {};
            setPlans(Array.isArray(payload.plans) ? payload.plans : []);
            setFields(Array.isArray(payload.fields) ? payload.fields : []);
            setTechmaps(Array.isArray(payload.techMaps) ? payload.techMaps : []);
            setOwnerAccount(payload.farm || null);
        } catch (error) {
            console.error('Failed to load farm map:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить карту хозяйства. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!farmId) return;
        void load();
    }, [farmId]);

    useEffect(() => {
        if (!farmId) return;
        try {
            const raw = localStorage.getItem(contextStorageKey(farmId));
            if (!raw) return;
            const parsed = JSON.parse(raw) as { tags?: string[]; note?: string; cells?: ContextCell[] };
            setTags(Array.isArray(parsed.tags) ? parsed.tags : []);
            setContextNote(typeof parsed.note === 'string' ? parsed.note : '');
            setCells(Array.isArray(parsed.cells) ? parsed.cells : []);
        } catch (error) {
            console.error('Failed to restore farm context:', error);
        }
    }, [farmId]);

    useEffect(() => {
        if (!farmId) return;
        localStorage.setItem(
            contextStorageKey(farmId),
            JSON.stringify({ tags, note: contextNote, cells }),
        );
    }, [farmId, tags, contextNote, cells]);

    const farmPlanItems = useMemo(() => plans, [plans]);
    const ownerAccountId = ownerAccount?.id || farmId;
    const ownerName = ownerAccount?.name || farmId;
    const farmFields = useMemo(() => fields, [fields]);
    const farmTechmaps = useMemo(() => techmaps, [techmaps]);

    const activePlans = farmPlanItems.filter((plan) => ['REVIEW', 'APPROVED', 'ACTIVE'].includes(String(plan.status))).length;
    const activeTechmaps = farmTechmaps.filter((techmap) => String(techmap.status) === 'ACTIVE').length;
    const totalArea = farmFields.reduce((sum, field) => sum + Number(field.area || 0), 0);
    const farmExists = ownerAccount !== null || farmPlanItems.length > 0;

    const addTag = () => {
        const nextTag = tagInput.trim();
        if (!nextTag) return;
        if (tags.some((tag) => toUpper(tag) === toUpper(nextTag))) {
            setTagInput('');
            return;
        }
        setTags((prev) => [...prev, nextTag]);
        setTagInput('');
    };

    const addCell = () => {
        const key = cellKey.trim();
        const value = cellValue.trim();
        if (!key || !value) return;
        setCells((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, key, value }]);
        setCellKey('');
        setCellValue('');
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h1 className='text-xl font-medium text-gray-900'>Карта хозяйства</h1>
                <Link href='/consulting/crm/farms' className='text-sm font-medium text-gray-700 hover:underline'>
                    Назад в реестр
                </Link>
            </div>

            {forbidden ? (
                <Card className='border-amber-200 bg-amber-50'>
                    <p className='text-sm text-amber-700'>Недостаточно прав для просмотра карты хозяйства.</p>
                </Card>
            ) : errorMessage ? (
                <Card className='border-rose-200 bg-rose-50'>
                    <p className='text-sm text-rose-700 mb-3'>{errorMessage}</p>
                    <button onClick={() => void load()} className='text-sm font-medium text-rose-700 hover:underline'>
                        Повторить запрос
                    </button>
                </Card>
            ) : loading ? (
                <Card><p className='text-sm text-gray-500'>Загрузка...</p></Card>
            ) : !farmExists ? (
                <Card className='border-amber-200 bg-amber-50'>
                    <p className='text-sm text-amber-700'>Хозяйство `{farmId}` не найдено в текущих данных.</p>
                </Card>
            ) : (
                <>
                    <Card>
                        <h2 className='text-lg font-semibold text-gray-900 mb-1'>{ownerName}</h2>
                        <p className='text-sm text-gray-600'>ID хозяйства: {ownerAccountId}</p>
                        <p className='text-sm text-gray-600'>Контрагент (юрлицо): {ownerAccount?.name || 'Не указан'}</p>
                        {ownerAccount?.inn ? <p className='text-sm text-gray-600'>ИНН контрагента: {ownerAccount.inn}</p> : null}
                    </Card>

                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                        <Card><p className='text-xs text-gray-500 mb-1'>Планов</p><p className='text-2xl font-semibold text-gray-900'>{farmPlanItems.length}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Активных планов</p><p className='text-2xl font-semibold text-gray-900'>{activePlans}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Полей</p><p className='text-2xl font-semibold text-gray-900'>{farmFields.length}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Площадь, га</p><p className='text-2xl font-semibold text-gray-900'>{totalArea.toFixed(1)}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Техкарт</p><p className='text-2xl font-semibold text-gray-900'>{farmTechmaps.length} / {activeTechmaps}</p></Card>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        <Card>
                            <h3 className='text-sm font-semibold text-gray-900 mb-3'>Планы хозяйства</h3>
                            {farmPlanItems.length === 0 ? (
                                <p className='text-sm text-gray-500'>Планы не найдены.</p>
                            ) : (
                                <ul className='space-y-2 text-sm'>
                                    {farmPlanItems.slice(0, 10).map((plan) => (
                                        <li key={plan.id} className='border-b last:border-b-0 pb-2'>
                                            <span className='text-gray-900'>{plan.id}</span>
                                            <span className='text-gray-500'> • {plan.status || '-'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <Card>
                            <h3 className='text-sm font-semibold text-gray-900 mb-3'>Поля хозяйства</h3>
                            {farmFields.length === 0 ? (
                                <p className='text-sm text-gray-500'>Поля не найдены.</p>
                            ) : (
                                <ul className='space-y-2 text-sm'>
                                    {farmFields.slice(0, 10).map((field) => (
                                        <li key={field.id} className='border-b last:border-b-0 pb-2'>
                                            <span className='text-gray-900'>{field.name || field.id}</span>
                                            <span className='text-gray-500'> • {field.area ?? '-'} га • {field.status || '-'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    <Card>
                        <h3 className='text-sm font-semibold text-gray-900 mb-3'>Допконтекст для ИИ (индексируемый)</h3>

                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Хэштеги</p>
                                <div className='flex gap-2 mb-2'>
                                    <input
                                        value={tagInput}
                                        onChange={(event) => setTagInput(event.target.value)}
                                        onKeyDown={(event) => event.key === 'Enter' && addTag()}
                                        placeholder='например: #логистика #элеватор'
                                        className='w-full md:w-96 px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    />
                                    <button onClick={addTag} className='px-3 py-2 rounded-xl bg-black text-white text-sm'>Добавить</button>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    {tags.length === 0 ? <span className='text-sm text-gray-500'>Теги не добавлены.</span> : tags.map((tag) => (
                                        <button key={tag} onClick={() => setTags((prev) => prev.filter((value) => value !== tag))} className='px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700'>
                                            {tag} ×
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Кастомные ячейки данных</p>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 mb-2'>
                                    <input value={cellKey} onChange={(event) => setCellKey(event.target.value)} placeholder='Ключ (например: Пункт доставки)' className='px-3 py-2 border border-black/10 rounded-xl text-sm' />
                                    <input value={cellValue} onChange={(event) => setCellValue(event.target.value)} placeholder='Значение' className='px-3 py-2 border border-black/10 rounded-xl text-sm' />
                                    <button onClick={addCell} className='px-3 py-2 rounded-xl bg-black text-white text-sm'>Добавить ячейку</button>
                                </div>
                                {cells.length === 0 ? (
                                    <p className='text-sm text-gray-500'>Кастомные ячейки не добавлены.</p>
                                ) : (
                                    <ul className='space-y-2 text-sm'>
                                        {cells.map((cell) => (
                                            <li key={cell.id} className='flex items-center justify-between border-b last:border-b-0 pb-2'>
                                                <span><strong>{cell.key}:</strong> {cell.value}</span>
                                                <button onClick={() => setCells((prev) => prev.filter((item) => item.id !== cell.id))} className='text-xs text-gray-600 hover:underline'>Удалить</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Свободный контекст</p>
                                <textarea
                                    value={contextNote}
                                    onChange={(event) => setContextNote(event.target.value)}
                                    placeholder='Менеджерский комментарий: особенности логистики, сезонные ограничения, договорные условия...'
                                    className='w-full min-h-28 px-3 py-2 border border-black/10 rounded-xl text-sm'
                                />
                                <p className='text-xs text-gray-500 mt-2'>
                                    Сейчас сохраняется локально в браузере. Следующий шаг: вынести в API для централизованной индексации ИИ.
                                </p>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}

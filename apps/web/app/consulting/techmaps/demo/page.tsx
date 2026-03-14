'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type AccountItem = {
    id: string;
    name?: string | null;
};

type FieldItem = {
    id: string;
    name?: string | null;
    cadastreNumber?: string;
    clientId?: string;
};

type SeasonItem = {
    id: string;
    year?: number;
    fieldId?: string | null;
    startDate?: string;
};

type PlanItem = {
    id: string;
    status?: string;
    accountId?: string;
    seasonId?: string | null;
    targetMetric?: string;
};

type TechMapItem = {
    id: string;
    status: string;
    version?: number;
    harvestPlanId?: string;
    seasonId?: string | null;
    crop?: string;
};

const SOIL_TYPES = ['CHERNOZEM', 'LOAM', 'SANDY', 'CLAY', 'PODZOLIC', 'SODDY', 'GRAY_FOREST', 'CHESTNUT'];

function buildDemoPolygon(seed: number) {
    const offset = seed / 1000;

    return {
        type: 'Polygon',
        coordinates: [[
            [37.6 + offset, 55.7 + offset],
            [37.62 + offset, 55.7 + offset],
            [37.62 + offset, 55.72 + offset],
            [37.6 + offset, 55.72 + offset],
            [37.6 + offset, 55.7 + offset],
        ]],
    };
}

export default function TechMapDemoPage() {
    const [companyId, setCompanyId] = useState('');
    const [accounts, setAccounts] = useState<AccountItem[]>([]);
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [seasons, setSeasons] = useState<SeasonItem[]>([]);
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [techMaps, setTechMaps] = useState<TechMapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    const [accountForm, setAccountForm] = useState({
        name: `TechMap Demo Farm ${new Date().toISOString().slice(0, 10)}`,
        inn: '',
        type: 'CLIENT',
    });
    const [fieldForm, setFieldForm] = useState({
        accountId: '',
        name: 'Демо поле TechMap',
        cadastreNumber: `TM-${Date.now()}`,
        area: '120',
        soilType: 'CHERNOZEM',
    });
    const [seasonForm, setSeasonForm] = useState({
        fieldId: '',
        year: String(new Date().getUTCFullYear()),
        expectedYield: '3.6',
        startDate: `${new Date().getUTCFullYear()}-03-15T08:00:00.000Z`,
    });
    const [planForm, setPlanForm] = useState({
        accountId: '',
        seasonId: '',
        targetMetric: 'YIELD_QPH',
        period: `SEASON_${new Date().getUTCFullYear()}`,
    });
    const [generateForm, setGenerateForm] = useState({
        planId: '',
        seasonId: '',
    });

    const loadWorkspace = async () => {
        setLoading(true);
        try {
            const meResponse = await api.users.me();
            const nextCompanyId = meResponse?.data?.companyId || '';
            setCompanyId(nextCompanyId);

            const [accountsResponse, fieldsResponse, seasonsResponse, plansResponse, techMapsResponse] = await Promise.all([
                nextCompanyId ? api.crm.accounts(nextCompanyId) : Promise.resolve({ data: [] }),
                api.crm.fields(),
                api.seasons.list(),
                api.consulting.plans(),
                api.consulting.techmaps.list(),
            ]);

            const nextAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
            const nextFields = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : [];
            const nextSeasons = Array.isArray(seasonsResponse.data) ? seasonsResponse.data : [];
            const nextPlans = Array.isArray(plansResponse.data) ? plansResponse.data : [];
            const nextTechMaps = Array.isArray(techMapsResponse.data) ? techMapsResponse.data : [];

            setAccounts(nextAccounts);
            setFields(nextFields);
            setSeasons(nextSeasons);
            setPlans(nextPlans);
            setTechMaps(nextTechMaps);

            setFieldForm((prev) => ({
                ...prev,
                accountId: prev.accountId || nextAccounts[0]?.id || '',
            }));
            setSeasonForm((prev) => ({
                ...prev,
                fieldId: prev.fieldId || nextFields[0]?.id || '',
            }));
            setPlanForm((prev) => ({
                ...prev,
                accountId: prev.accountId || nextAccounts[0]?.id || '',
                seasonId: prev.seasonId || nextSeasons[0]?.id || '',
            }));
            setGenerateForm((prev) => ({
                ...prev,
                planId: prev.planId || nextPlans[0]?.id || '',
                seasonId: prev.seasonId || nextSeasons[0]?.id || '',
            }));
        } catch (error) {
            console.error('Failed to load TechMap demo workspace:', error);
            setAccounts([]);
            setFields([]);
            setSeasons([]);
            setPlans([]);
            setTechMaps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspace();
    }, []);

    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.id === generateForm.planId) || null,
        [plans, generateForm.planId],
    );
    const selectedTechMap = useMemo(
        () => techMaps.find((map) => map.harvestPlanId === generateForm.planId) || null,
        [techMaps, generateForm.planId],
    );

    const runAction = async (key: string, action: () => Promise<void>) => {
        setBusyAction(key);
        try {
            await action();
            await loadWorkspace();
        } catch (error: any) {
            console.error(`Action ${key} failed:`, error);
            alert(error?.response?.data?.message || 'Операция завершилась ошибкой');
        } finally {
            setBusyAction(null);
        }
    };

    const handleCreateAccount = async () => {
        if (!companyId) {
            alert('companyId текущего пользователя не определён');
            return;
        }

        await runAction('create-account', async () => {
            const response = await api.crm.createAccount({
                name: accountForm.name.trim(),
                inn: accountForm.inn.trim() || undefined,
                type: accountForm.type.trim() || undefined,
                companyId,
            });

            const accountId = response?.data?.id;
            if (accountId) {
                setFieldForm((prev) => ({ ...prev, accountId }));
                setPlanForm((prev) => ({ ...prev, accountId }));
            }
        });
    };

    const handleCreateField = async () => {
        if (!companyId || !fieldForm.accountId.trim()) {
            alert('Для поля требуется companyId и accountId');
            return;
        }

        await runAction('create-field', async () => {
            const response = await api.crm.createField({
                cadastreNumber: fieldForm.cadastreNumber.trim(),
                name: fieldForm.name.trim() || undefined,
                area: Number(fieldForm.area),
                coordinates: buildDemoPolygon(Date.now() % 100),
                soilType: fieldForm.soilType,
                accountId: fieldForm.accountId,
                companyId,
            });

            const fieldId = response?.data?.id;
            if (fieldId) {
                setSeasonForm((prev) => ({ ...prev, fieldId }));
            }
        });
    };

    const handleCreateSeason = async () => {
        if (!seasonForm.fieldId.trim()) {
            alert('Для сезона требуется поле');
            return;
        }

        await runAction('create-season', async () => {
            const response = await api.seasons.create({
                year: Number(seasonForm.year),
                fieldId: seasonForm.fieldId,
                expectedYield: Number(seasonForm.expectedYield),
                startDate: seasonForm.startDate,
            });

            const seasonId = response?.data?.id;
            if (seasonId) {
                setPlanForm((prev) => ({ ...prev, seasonId }));
                setGenerateForm((prev) => ({ ...prev, seasonId }));
            }
        });
    };

    const handleCreatePlan = async () => {
        if (!planForm.accountId.trim()) {
            alert('Для плана требуется хозяйство');
            return;
        }

        await runAction('create-plan', async () => {
            const response = await api.consulting.createPlan({
                accountId: planForm.accountId,
                seasonId: planForm.seasonId || undefined,
                targetMetric: planForm.targetMetric.trim() || 'YIELD_QPH',
                period: planForm.period.trim() || undefined,
            });

            const planId = response?.data?.id;
            if (planId) {
                setGenerateForm((prev) => ({
                    ...prev,
                    planId,
                    seasonId: planForm.seasonId || prev.seasonId,
                }));
            }
        });
    };

    const handleGenerateTechMap = async () => {
        if (!generateForm.planId.trim() || !generateForm.seasonId.trim()) {
            alert('Для генерации техкарты требуются план и сезон');
            return;
        }

        await runAction('generate-techmap', async () => {
            await api.consulting.techmaps.generate({
                harvestPlanId: generateForm.planId,
                seasonId: generateForm.seasonId,
            });
        });
    };

    const handlePlanTransition = async (status: string) => {
        if (!generateForm.planId.trim()) {
            alert('Выберите план');
            return;
        }

        await runAction(`plan-${status}`, async () => {
            await api.consulting.transitionPlan(generateForm.planId, status);
        });
    };

    const handleTechMapTransition = async (status: string) => {
        if (!selectedTechMap?.id) {
            alert('Сначала создайте техкарту');
            return;
        }

        await runAction(`techmap-${status}`, async () => {
            await api.consulting.techmaps.transition(selectedTechMap.id, status);
        });
    };

    return (
        <div className='space-y-8'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900'>TechMap Demo Flow</h1>
                    <p className='text-sm text-gray-500'>
                        Сквозной стенд: создание контрагента, поля, сезона, плана и генерация техкарты в одном месте.
                    </p>
                </div>
                <div className='flex items-center gap-3'>
                    <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                        Реестр техкарт
                    </Link>
                    <Link href='/consulting/execution' className='text-sm text-blue-600 hover:underline'>
                        Execution
                    </Link>
                </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                <div className='xl:col-span-2 space-y-6'>
                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Шаг 1. Контрагент / хозяйство</p>
                                <p className='text-sm text-gray-600'>Создаёт `Account`, который используется полем и планом.</p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                <input
                                    value={accountForm.name}
                                    onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Название хозяйства'
                                />
                                <input
                                    value={accountForm.inn}
                                    onChange={(event) => setAccountForm((prev) => ({ ...prev, inn: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='ИНН'
                                />
                                <button
                                    onClick={handleCreateAccount}
                                    disabled={busyAction !== null}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-account' ? 'Создание...' : 'Создать контрагента'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Шаг 2. Поле</p>
                                <p className='text-sm text-gray-600'>Создаёт `Field` в tenant-контуре и связывает его с хозяйством.</p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <select
                                    value={fieldForm.accountId}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, accountId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    <option value=''>Выберите хозяйство</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name || account.id}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={fieldForm.name}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Название поля'
                                />
                                <input
                                    value={fieldForm.cadastreNumber}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, cadastreNumber: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Кадастровый номер'
                                />
                                <input
                                    value={fieldForm.area}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, area: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Площадь, га'
                                />
                                <select
                                    value={fieldForm.soilType}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, soilType: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    {SOIL_TYPES.map((soilType) => (
                                        <option key={soilType} value={soilType}>
                                            {soilType}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleCreateField}
                                    disabled={busyAction !== null}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-field' ? 'Создание...' : 'Создать поле'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Шаг 3. Сезон</p>
                                <p className='text-sm text-gray-600'>Создаёт `Season`, который даёт техкарте поле, год и стартовое окно операций.</p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <select
                                    value={seasonForm.fieldId}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, fieldId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    <option value=''>Выберите поле</option>
                                    {fields.map((field) => (
                                        <option key={field.id} value={field.id}>
                                            {field.name || field.cadastreNumber || field.id}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={seasonForm.year}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, year: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Год'
                                />
                                <input
                                    value={seasonForm.expectedYield}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, expectedYield: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Ожидаемая урожайность'
                                />
                                <input
                                    value={seasonForm.startDate}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='2026-03-15T08:00:00.000Z'
                                />
                                <button
                                    onClick={handleCreateSeason}
                                    disabled={busyAction !== null}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-season' ? 'Создание...' : 'Создать сезон'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Шаг 4. Harvest Plan</p>
                                <p className='text-sm text-gray-600'>Создаёт план, который будет владельцем техкарты и execution-контекста.</p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <select
                                    value={planForm.accountId}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, accountId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    <option value=''>Выберите хозяйство</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.name || account.id}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={planForm.seasonId}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, seasonId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    <option value=''>Выберите сезон</option>
                                    {seasons.map((season) => (
                                        <option key={season.id} value={season.id}>
                                            {`Сезон ${season.year ?? '-'} • ${season.fieldId ?? 'без поля'}`}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={planForm.targetMetric}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, targetMetric: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Метрика'
                                />
                                <input
                                    value={planForm.period}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, period: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm'
                                    placeholder='Период'
                                />
                                <button
                                    onClick={handleCreatePlan}
                                    disabled={busyAction !== null}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-plan' ? 'Создание...' : 'Создать план'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Шаг 5. Генерация и активация TechMap</p>
                                <p className='text-sm text-gray-600'>
                                    Генератор соберёт непустую техкарту. После статусных переходов она попадёт в execution-хаб.
                                </p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <select
                                    value={generateForm.planId}
                                    onChange={(event) => setGenerateForm((prev) => ({ ...prev, planId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
                                >
                                    <option value=''>Выберите план</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {`${plan.targetMetric || 'План'} • ${plan.status || 'UNKNOWN'} • ${plan.id.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={generateForm.seasonId}
                                    onChange={(event) => setGenerateForm((prev) => ({ ...prev, seasonId: event.target.value }))}
                                    className='px-3 py-2 border border-black/10 rounded-xl text-sm bg-white'
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
                                    disabled={busyAction !== null}
                                    className='px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'generate-techmap' ? 'Генерация...' : 'Сгенерировать техкарту'}
                                </button>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                <button
                                    onClick={() => handlePlanTransition('REVIEW')}
                                    disabled={busyAction !== null || !selectedPlan}
                                    className='px-4 py-2 border border-black/10 rounded-xl text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    План {'->'} REVIEW
                                </button>
                                <button
                                    onClick={() => handlePlanTransition('APPROVED')}
                                    disabled={busyAction !== null || !selectedPlan}
                                    className='px-4 py-2 border border-black/10 rounded-xl text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    План {'->'} APPROVED
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('REVIEW')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='px-4 py-2 border border-black/10 rounded-xl text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    TechMap {'->'} REVIEW
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('APPROVED')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='px-4 py-2 border border-black/10 rounded-xl text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    TechMap {'->'} APPROVED
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('ACTIVE')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 disabled:opacity-50'
                                >
                                    TechMap {'->'} ACTIVE
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className='space-y-6'>
                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Состояние стенда</p>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='rounded-2xl border border-black/10 p-4'>
                                    <p className='text-xs text-gray-500'>Контрагенты</p>
                                    <p className='text-2xl font-semibold'>{accounts.length}</p>
                                </div>
                                <div className='rounded-2xl border border-black/10 p-4'>
                                    <p className='text-xs text-gray-500'>Поля</p>
                                    <p className='text-2xl font-semibold'>{fields.length}</p>
                                </div>
                                <div className='rounded-2xl border border-black/10 p-4'>
                                    <p className='text-xs text-gray-500'>Сезоны</p>
                                    <p className='text-2xl font-semibold'>{seasons.length}</p>
                                </div>
                                <div className='rounded-2xl border border-black/10 p-4'>
                                    <p className='text-xs text-gray-500'>TechMap</p>
                                    <p className='text-2xl font-semibold'>{techMaps.length}</p>
                                </div>
                            </div>
                            <p className='text-xs text-gray-500'>companyId: {companyId || '-'}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Текущий выбор</p>
                            <div className='text-sm text-gray-700 space-y-2'>
                                <p>План: {selectedPlan ? `${selectedPlan.id} • ${selectedPlan.status}` : 'не выбран'}</p>
                                <p>Техкарта: {selectedTechMap ? `${selectedTechMap.id} • ${selectedTechMap.status}` : 'не создана'}</p>
                            </div>
                            {selectedPlan && (
                                <Link href={`/consulting/plans/${selectedPlan.id}`} className='text-sm text-blue-600 hover:underline'>
                                    Открыть план
                                </Link>
                            )}
                            {selectedTechMap && (
                                <Link href={`/consulting/techmaps/${selectedTechMap.id}`} className='block text-sm text-blue-600 hover:underline'>
                                    Открыть техкарту
                                </Link>
                            )}
                            {selectedTechMap?.status === 'ACTIVE' && (
                                <Link href='/consulting/execution' className='block text-sm text-emerald-700 hover:underline'>
                                    Перейти в execution-хаб
                                </Link>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Что проверять после генерации</p>
                            <div className='text-sm text-gray-700 space-y-2'>
                                <p>1. У техкарты должны появиться стадии, операции и ресурсы, а не пустая запись.</p>
                                <p>2. После `TechMap {'->'} ACTIVE` карта должна открываться в detail-view и вести в execution.</p>
                                <p>3. После `План {'->'} APPROVED` и `TechMap {'->'} ACTIVE` операции должны быть видны на `/consulting/execution`.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {loading && (
                <Card>
                    <p className='text-sm text-gray-500'>Загрузка демо-стенда...</p>
                </Card>
            )}
        </div>
    );
}

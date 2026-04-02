'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { formatStatusLabel } from '@/lib/ui-language';

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

function buildDraftPolygon(seed: number) {
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

export function TechMapPreparationWizard() {
    const searchParams = useSearchParams();
    const preselectedAccountId = searchParams.get('accountId')?.trim() || '';
    const preselectedFieldId = searchParams.get('fieldId')?.trim() || '';
    const preselectedSeasonId = searchParams.get('seasonId')?.trim() || '';
    const preselectedPlanId = searchParams.get('planId')?.trim() || '';

    const [companyId, setCompanyId] = useState('');
    const [accounts, setAccounts] = useState<AccountItem[]>([]);
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [seasons, setSeasons] = useState<SeasonItem[]>([]);
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [techMaps, setTechMaps] = useState<TechMapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    const [accountForm, setAccountForm] = useState({
        name: `Хозяйство техкарты ${new Date().toISOString().slice(0, 10)}`,
        inn: '',
        type: 'CLIENT',
    });
    const [fieldForm, setFieldForm] = useState({
        accountId: preselectedAccountId,
        name: 'Поле для техкарты',
        cadastreNumber: `TM-${Date.now()}`,
        area: '120',
        soilType: 'CHERNOZEM',
    });
    const [seasonForm, setSeasonForm] = useState({
        fieldId: preselectedFieldId,
        year: String(new Date().getUTCFullYear()),
        expectedYield: '3.6',
        startDate: `${new Date().getUTCFullYear()}-03-15T08:00:00.000Z`,
    });
    const [planForm, setPlanForm] = useState({
        accountId: preselectedAccountId,
        seasonId: preselectedSeasonId,
        targetMetric: 'YIELD_QPH',
        period: `SEASON_${new Date().getUTCFullYear()}`,
    });
    const [generateForm, setGenerateForm] = useState({
        planId: preselectedPlanId,
        seasonId: preselectedSeasonId,
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
                accountId: (preselectedAccountId && nextAccounts.some((account) => account.id === preselectedAccountId))
                    ? preselectedAccountId
                    : prev.accountId || nextAccounts[0]?.id || '',
            }));
            setSeasonForm((prev) => ({
                ...prev,
                fieldId: (preselectedFieldId && nextFields.some((field) => field.id === preselectedFieldId))
                    ? preselectedFieldId
                    : prev.fieldId || nextFields[0]?.id || '',
            }));
            setPlanForm((prev) => ({
                ...prev,
                accountId: (preselectedAccountId && nextAccounts.some((account) => account.id === preselectedAccountId))
                    ? preselectedAccountId
                    : prev.accountId || nextAccounts[0]?.id || '',
                seasonId: (preselectedSeasonId && nextSeasons.some((season) => season.id === preselectedSeasonId))
                    ? preselectedSeasonId
                    : prev.seasonId || nextSeasons[0]?.id || '',
            }));
            setGenerateForm((prev) => ({
                ...prev,
                planId: (preselectedPlanId && nextPlans.some((plan) => plan.id === preselectedPlanId))
                    ? preselectedPlanId
                    : prev.planId || nextPlans[0]?.id || '',
                seasonId: (preselectedSeasonId && nextSeasons.some((season) => season.id === preselectedSeasonId))
                    ? preselectedSeasonId
                    : prev.seasonId || nextSeasons[0]?.id || '',
            }));
        } catch (error) {
            console.error('Failed to load TechMap preparation workspace:', error);
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
        void loadWorkspace();
    }, []);

    const filteredFields = useMemo(() => {
        if (!fieldForm.accountId) {
            return fields;
        }

        const linkedFields = fields.filter((field) => field.clientId === fieldForm.accountId);
        return linkedFields.length > 0 ? linkedFields : fields;
    }, [fields, fieldForm.accountId]);

    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.id === generateForm.planId) || null,
        [plans, generateForm.planId],
    );
    const selectedTechMap = useMemo(
        () => techMaps.find((map) => map.harvestPlanId === generateForm.planId) || null,
        [techMaps, generateForm.planId],
    );
    const selectedAccount = useMemo(
        () => accounts.find((account) => account.id === planForm.accountId || account.id === fieldForm.accountId) || null,
        [accounts, fieldForm.accountId, planForm.accountId],
    );
    const selectedField = useMemo(
        () => fields.find((field) => field.id === seasonForm.fieldId) || null,
        [fields, seasonForm.fieldId],
    );
    const selectedSeason = useMemo(
        () => seasons.find((season) => season.id === (generateForm.seasonId || planForm.seasonId)) || null,
        [generateForm.seasonId, planForm.seasonId, seasons],
    );

    const flowSteps = useMemo(() => {
        const steps = [
            {
                key: 'account',
                label: 'Хозяйство',
                done: Boolean(fieldForm.accountId || planForm.accountId),
            },
            {
                key: 'field',
                label: 'Поле',
                done: Boolean(seasonForm.fieldId),
            },
            {
                key: 'season',
                label: 'Сезон',
                done: Boolean(planForm.seasonId || generateForm.seasonId),
            },
            {
                key: 'plan',
                label: 'План',
                done: Boolean(generateForm.planId),
            },
            {
                key: 'techmap',
                label: 'Техкарта',
                done: Boolean(selectedTechMap?.id),
            },
        ];

        const currentIndex = steps.findIndex((step) => !step.done);
        return {
            items: steps,
            currentIndex: currentIndex === -1 ? steps.length - 1 : currentIndex,
        };
    }, [fieldForm.accountId, planForm.accountId, seasonForm.fieldId, planForm.seasonId, generateForm.seasonId, generateForm.planId, selectedTechMap?.id]);

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
                coordinates: buildDraftPolygon(Date.now() % 100),
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

    const nextActionText = flowSteps.items[flowSteps.currentIndex]?.label || 'Техкарта';

    return (
        <div className='space-y-8'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900'>Мастер подготовки техкарты</h1>
                    <p className='text-sm text-gray-500'>
                        Реальный рабочий маршрут: хозяйство / поле / сезон / план / генерация и активация техкарты.
                    </p>
                    <p className='mt-2 text-xs text-amber-700'>
                        Временный backstage-маршрут для проверки UX-сшивки. После переноса входа в агента и штатные экраны этот мастер нужно убрать.
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

            <Card>
                <div className='space-y-4'>
                    <div className='flex flex-wrap items-center gap-2'>
                        {flowSteps.items.map((step, index) => (
                            <div key={step.key} className='flex items-center gap-2'>
                                <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-semibold ${step.done ? 'bg-emerald-100 text-emerald-800' : index === flowSteps.currentIndex ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {index + 1}
                                </span>
                                <span className={`text-sm ${step.done ? 'text-gray-900' : index === flowSteps.currentIndex ? 'text-amber-800' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                                {index < flowSteps.items.length - 1 ? <span className='px-1 text-gray-300'>/</span> : null}
                            </div>
                        ))}
                    </div>
                    <div className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950'>
                        Следующее действие в текущем маршруте: <span className='font-semibold'>{nextActionText}</span>.
                        Эффект: пользователь идёт по реальной цепочке подготовки техкарты и сразу видит, где именно прерывается бизнес-поток.
                    </div>
                    {(preselectedAccountId || preselectedFieldId || preselectedSeasonId || preselectedPlanId) ? (
                        <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900'>
                            Мастер продолжает уже начатый сценарий и подхватывает готовые сущности из предыдущего шага.
                            Эффект: после создания поля или плана пользователь не теряет контекст и сразу переходит к следующему шагу.
                        </div>
                    ) : null}
                    <div className='rounded-2xl border border-black/10 bg-gray-50 px-4 py-4 text-sm text-gray-700'>
                        Важная текущая реальность backend: поле и сезон живут в `Field/Season`-контуре, а хозяйство для плана берётся из `Account`.
                        Эффект: мастер честно показывает архитектурный стык и позволяет проверить сквозной поток без симуляции.
                    </div>
                </div>
            </Card>

            <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
                <div className='space-y-6 xl:col-span-2'>
                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-xs text-gray-500'>Шаг 1. Хозяйство</p>
                                <p className='text-sm text-gray-600'>Создаёт `Account`, который используется полем и планом в текущем backend-контуре.</p>
                            </div>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                                <input
                                    value={accountForm.name}
                                    onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Название хозяйства'
                                />
                                <input
                                    value={accountForm.inn}
                                    onChange={(event) => setAccountForm((prev) => ({ ...prev, inn: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='ИНН'
                                />
                                <button
                                    onClick={handleCreateAccount}
                                    disabled={busyAction !== null}
                                    className='rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-account' ? 'Создание...' : 'Создать хозяйство'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-xs text-gray-500'>Шаг 2. Поле</p>
                                <p className='text-sm text-gray-600'>Создаёт `Field`, который становится опорой для сезона и будущей техкарты.</p>
                            </div>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                <select
                                    value={fieldForm.accountId}
                                    onChange={(event) => {
                                        const nextAccountId = event.target.value;
                                        setFieldForm((prev) => ({ ...prev, accountId: nextAccountId }));
                                        setPlanForm((prev) => ({ ...prev, accountId: nextAccountId }));
                                    }}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
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
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Название поля'
                                />
                                <input
                                    value={fieldForm.cadastreNumber}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, cadastreNumber: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Кадастровый номер'
                                />
                                <input
                                    value={fieldForm.area}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, area: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Площадь, га'
                                />
                                <select
                                    value={fieldForm.soilType}
                                    onChange={(event) => setFieldForm((prev) => ({ ...prev, soilType: event.target.value }))}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
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
                                    className='rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-field' ? 'Создание...' : 'Создать поле'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-xs text-gray-500'>Шаг 3. Сезон</p>
                                <p className='text-sm text-gray-600'>Создаёт `Season`, который даёт техкарте поле, год и окно исполнения.</p>
                            </div>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                <select
                                    value={seasonForm.fieldId}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, fieldId: event.target.value }))}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
                                >
                                    <option value=''>Выберите поле</option>
                                    {filteredFields.map((field) => (
                                        <option key={field.id} value={field.id}>
                                            {field.name || field.cadastreNumber || field.id}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={seasonForm.year}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, year: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Год'
                                />
                                <input
                                    value={seasonForm.expectedYield}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, expectedYield: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Ожидаемая урожайность'
                                />
                                <input
                                    value={seasonForm.startDate}
                                    onChange={(event) => setSeasonForm((prev) => ({ ...prev, startDate: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='2026-03-15T08:00:00.000Z'
                                />
                                <button
                                    onClick={handleCreateSeason}
                                    disabled={busyAction !== null}
                                    className='rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-season' ? 'Создание...' : 'Создать сезон'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-xs text-gray-500'>Шаг 4. План урожая</p>
                                <p className='text-sm text-gray-600'>Создаёт `Harvest Plan`, который становится владельцем техкарты и execution-контекста.</p>
                            </div>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                <select
                                    value={planForm.accountId}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, accountId: event.target.value }))}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
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
                                    onChange={(event) => {
                                        const nextSeasonId = event.target.value;
                                        setPlanForm((prev) => ({ ...prev, seasonId: nextSeasonId }));
                                        setGenerateForm((prev) => ({ ...prev, seasonId: nextSeasonId }));
                                    }}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
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
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Метрика'
                                />
                                <input
                                    value={planForm.period}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, period: event.target.value }))}
                                    className='rounded-xl border border-black/10 px-3 py-2 text-sm'
                                    placeholder='Период'
                                />
                                <button
                                    onClick={handleCreatePlan}
                                    disabled={busyAction !== null}
                                    className='rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'create-plan' ? 'Создание...' : 'Создать план'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-xs text-gray-500'>Шаг 5. Генерация и запуск техкарты</p>
                                <p className='text-sm text-gray-600'>Генератор собирает непустую техкарту, а статусные переходы выводят её в execution.</p>
                            </div>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                <select
                                    value={generateForm.planId}
                                    onChange={(event) => setGenerateForm((prev) => ({ ...prev, planId: event.target.value }))}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
                                >
                                    <option value=''>Выберите план</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {`${plan.targetMetric || 'План'} • ${formatStatusLabel(plan.status)} • ${plan.id.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={generateForm.seasonId}
                                    onChange={(event) => setGenerateForm((prev) => ({ ...prev, seasonId: event.target.value }))}
                                    className='rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'
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
                                    className='rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50'
                                >
                                    {busyAction === 'generate-techmap' ? 'Генерация...' : 'Сгенерировать техкарту'}
                                </button>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                <button
                                    onClick={() => handlePlanTransition('REVIEW')}
                                    disabled={busyAction !== null || !selectedPlan}
                                    className='rounded-xl border border-black/10 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    План {'->'} На проверку
                                </button>
                                <button
                                    onClick={() => handlePlanTransition('APPROVED')}
                                    disabled={busyAction !== null || !selectedPlan}
                                    className='rounded-xl border border-black/10 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    План {'->'} Утверждено
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('REVIEW')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='rounded-xl border border-black/10 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    Техкарта {'->'} На проверку
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('APPROVED')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='rounded-xl border border-black/10 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50'
                                >
                                    Техкарта {'->'} Утверждено
                                </button>
                                <button
                                    onClick={() => handleTechMapTransition('ACTIVE')}
                                    disabled={busyAction !== null || !selectedTechMap}
                                    className='rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
                                >
                                    Техкарта {'->'} Активно
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className='space-y-6'>
                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Состояние контура</p>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='rounded-2xl border border-black/10 p-4'>
                                    <p className='text-xs text-gray-500'>Хозяйства</p>
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
                                    <p className='text-xs text-gray-500'>Техкарты</p>
                                    <p className='text-2xl font-semibold'>{techMaps.length}</p>
                                </div>
                            </div>
                            <p className='text-xs text-gray-500'>companyId: {companyId || '-'}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Текущий рабочий контекст</p>
                            <div className='space-y-2 text-sm text-gray-700'>
                                <p>Хозяйство: {selectedAccount ? `${selectedAccount.name || selectedAccount.id}` : 'не выбрано'}</p>
                                <p>Поле: {selectedField ? `${selectedField.name || selectedField.cadastreNumber || selectedField.id}` : 'не выбрано'}</p>
                                <p>Сезон: {selectedSeason ? `${selectedSeason.id} • ${selectedSeason.year ?? '-'}` : 'не создан'}</p>
                                <p>План: {selectedPlan ? `${selectedPlan.id} • ${formatStatusLabel(selectedPlan.status)}` : 'не создан'}</p>
                                <p>Техкарта: {selectedTechMap ? `${selectedTechMap.id} • ${formatStatusLabel(selectedTechMap.status)}` : 'не создана'}</p>
                            </div>
                            {selectedPlan ? (
                                <Link href={`/consulting/plans/${selectedPlan.id}`} className='text-sm text-blue-600 hover:underline'>
                                    Открыть план
                                </Link>
                            ) : null}
                            {selectedTechMap ? (
                                <Link href={`/consulting/techmaps/${selectedTechMap.id}`} className='block text-sm text-blue-600 hover:underline'>
                                    Открыть техкарту
                                </Link>
                            ) : null}
                            {selectedTechMap?.status === 'ACTIVE' ? (
                                <Link href='/consulting/execution' className='block text-sm text-emerald-700 hover:underline'>
                                    Перейти в контур исполнения
                                </Link>
                            ) : null}
                        </div>
                    </Card>

                    <Card>
                        <div className='space-y-3'>
                            <p className='text-xs text-gray-500'>Что проверять в реальном сценарии</p>
                            <div className='space-y-2 text-sm text-gray-700'>
                                <p>1. После создания сезона у поля появляется реальный сезонный контекст, который затем выбирается в плане.</p>
                                <p>2. После генерации техкарты открывается detail-view с содержимым карты, а не пустая заглушка.</p>
                                <p>3. После переходов «План → Утверждено» и «Техкарта → Активно» операции становятся видны в `/consulting/execution`.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {loading ? (
                <Card>
                    <p className='text-sm text-gray-500'>Загрузка рабочего контура подготовки техкарты...</p>
                </Card>
            ) : null}
        </div>
    );
}

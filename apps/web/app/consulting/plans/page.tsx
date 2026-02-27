'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SystemStatusBar from '@/components/consulting/SystemStatusBar';
import { PlansList } from '@/components/consulting/PlansList';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { api } from '@/lib/api';

export default function PlansPage() {
    const searchParams = useSearchParams();
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [accounts, setAccounts] = useState<Array<{ id: string; name?: string | null }>>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        accountId: '',
        targetMetric: 'YIELD_QPH',
        period: '',
    });
    const authority = useAuthority();

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const response = await api.consulting.plans();
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [searchParams]);

    useEffect(() => {
        const fetchAccounts = async () => {
            setAccountsLoading(true);
            try {
                const meRes = await api.users.me();
                const companyId = meRes?.data?.companyId;
                if (!companyId) {
                    setAccounts([]);
                    return;
                }

                const accountsRes = await api.crm.accounts(companyId);
                const data = Array.isArray(accountsRes.data) ? accountsRes.data : [];
                setAccounts(data);
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
                setAccounts([]);
            } finally {
                setAccountsLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const domainContext = useMemo<DomainUiContext>(() => {
        const hasActiveTechMap = plans.some(p => p.activeTechMapId);
        const hasLockedBudget = plans.some(p => p.status === 'ACTIVE');
        const criticalDeviations = plans.reduce((acc, p) => acc + (p.deviationReviews?.length || 0), 0);

        return {
            plansCount: plans.length,
            activeTechMap: hasActiveTechMap,
            lockedBudget: hasLockedBudget,
            criticalDeviations: criticalDeviations,
            advisoryRiskLevel: criticalDeviations > 0 ? 'medium' : 'low'
        };
    }, [plans]);

    const knownAccountIds = useMemo(
        () =>
            Array.from(
                new Set(
                    plans
                        .map((p) => p.accountId)
                        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
                ),
            ),
        [plans],
    );

    const accountOptions = useMemo(() => {
        const optionsFromApi = accounts
            .filter((a) => typeof a.id === 'string' && a.id.length > 0)
            .map((a) => ({ id: a.id, name: a.name || a.id }));

        const known = knownAccountIds
            .filter((id) => !optionsFromApi.some((a) => a.id === id))
            .map((id) => ({ id, name: id }));

        return [...optionsFromApi, ...known];
    }, [accounts, knownAccountIds]);

    const handleTransition = async (id: string, target: string) => {
        try {
            await api.consulting.transitionPlan(id, target);
            await fetchPlans();
        } catch (error) {
            console.error(`Failed to transition plan ${id}:`, error);
            alert('Ошибка при смене статуса');
        }
    };

    const handleCreatePlan = async () => {
        if (!createForm.accountId.trim()) {
            alert('Укажите accountId хозяйства');
            return;
        }

        setIsCreating(true);
        try {
            await api.consulting.createPlan({
                accountId: createForm.accountId.trim(),
                targetMetric: createForm.targetMetric.trim() || 'YIELD_QPH',
                period: createForm.period.trim() || undefined,
            });
            setCreateForm((prev) => ({ ...prev, period: '' }));
            await fetchPlans();
        } catch (error) {
            console.error('Failed to create plan:', error);
            alert('Ошибка при создании плана');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-xl font-medium text-gray-900 tracking-tight mb-1">
                    Планы Урожая
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Операционная панель управления жизненным циклом сельскохозяйственных планов
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar (Operational Gate visualization) */}
            <SystemStatusBar context={domainContext} />

            {/* MAIN ACTION: Cockpit Control */}
            <div className="bg-white border border-black/5 rounded-[32px] p-10 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-xl font-medium text-gray-900">Реестр планов</h2>
                        <p className="text-xs text-gray-400 mt-1">Визуализация FSM и доступных переходов</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={createForm.accountId}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, accountId: e.target.value }))}
                            className="px-3 py-2 border border-black/10 rounded-xl text-sm w-64 bg-white"
                        >
                            <option value="">
                                {accountsLoading ? 'Загрузка хозяйств...' : 'Выберите хозяйство'}
                            </option>
                            {accountOptions.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        <input
                            value={createForm.targetMetric}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, targetMetric: e.target.value }))}
                            placeholder="Метрика"
                            className="px-3 py-2 border border-black/10 rounded-xl text-sm w-36"
                        />
                        <input
                            value={createForm.period}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, period: e.target.value }))}
                            placeholder="Период (напр. SEASON_2026)"
                            className="px-3 py-2 border border-black/10 rounded-xl text-sm w-52"
                        />
                        <button
                            onClick={handleCreatePlan}
                            disabled={isCreating}
                            className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-medium hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
                        >
                            {isCreating ? 'Создание...' : 'Создать план'}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <PlansList
                        plans={plans}
                        authority={authority}
                        context={domainContext}
                        onTransition={handleTransition}
                    />
                )}
            </div>

            {/* FOOTER INFO (Domain Rules Explanation) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Активные ограничения</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Активация плана (ACTIVE) возможна только при заблокированном бюджете (LOCKED) и утвержденной техкарте.
                    </p>
                </div>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Ролевая модель</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Ваша роль — <strong>authority</strong>. Утверждение планов в фазу Исполнения доступно только CEO/FOUNDER.
                    </p>
                </div>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Связи домена</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Любое активное отклонение должно быть разрешено (Decision) до закрытия сезона.
                    </p>
                </div>
            </div>
        </div>
    );
}


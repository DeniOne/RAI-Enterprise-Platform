import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HarvestPlanStatus, getEntityTransitions } from '@/lib/consulting/ui-policy';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { KpiCard } from './KpiCard';
import { AuthorityContextType } from '@/core/governance/AuthorityContext';

interface Plan {
    id: string;
    targetMetric: string;
    status: HarvestPlanStatus;
    activeTechMap?: any;
}

interface PlansListProps {
    plans: Plan[];
    authority: AuthorityContextType;
    context: DomainUiContext;
    onTransition: (id: string, target: string) => void;
}

type FsmPhase = 'planning' | 'execution' | 'archive';

function PlanItem({ plan, authority, context, onTransition, activePhase }: {
    plan: Plan,
    authority: AuthorityContextType,
    context: DomainUiContext,
    onTransition: (id: string, target: string) => void,
    activePhase: FsmPhase
}) {
    const [kpi, setKpi] = useState<any>(null);
    const [isKpiLoading, setIsKpiLoading] = useState(false);

    useEffect(() => {
        // Ограничение: KPI запрашиваются только для активных или завершенных планов
        const isEligible = ['ACTIVE', 'DONE', 'ARCHIVE'].includes(plan.status);

        if (isEligible) {
            const fetchKpi = async () => {
                setIsKpiLoading(true);
                try {
                    const response = await api.consulting.kpi.plan(plan.id);
                    // Валидация: если данных нет (hasData: false), KpiCard это обработает
                    setKpi(response.data);
                } catch (error) {
                    console.error(`Failed to fetch KPI for plan ${plan.id}:`, error);
                } finally {
                    setIsKpiLoading(false);
                }
            };
            fetchKpi();
        }
    }, [plan.id, plan.status]);

    const perm = getEntityTransitions('harvest-plan', plan.status, authority, context);

    return (
        <div className="bg-white border border-black/5 rounded-[24px] overflow-hidden group hover:border-black/10 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.02]">
            <div className="p-8 flex justify-between items-center ">
                <div>
                    <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg tracking-tight">
                            {plan.targetMetric || 'План без названия'}
                        </h3>
                        <span className={clsx(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            plan.status === 'DRAFT' ? 'bg-gray-100 text-gray-500' :
                                plan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    plan.status === 'REVIEW' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        plan.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-zinc-100 text-zinc-500'
                        )}>
                            {plan.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium tracking-wide">ID: {plan.id}</p>
                </div>

                <div className="flex items-center space-x-3">
                    {perm.allowedTransitions.map(t => (
                        <button
                            key={t.target}
                            onClick={() => onTransition(plan.id, t.target)}
                            className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-all active:scale-95 shadow-md shadow-black/5"
                        >
                            {t.label}
                        </button>
                    ))}

                    {perm.blockedTransitions.map(bt => (
                        <div
                            key={bt.transition}
                            title={bt.reason}
                            className="px-6 py-2.5 bg-gray-50 text-gray-300 rounded-xl text-xs font-semibold border border-black/5 cursor-not-allowed grayscale"
                        >
                            {bt.transition}
                        </div>
                    ))}

                    <Link
                        href={`/consulting/plans/${plan.id}`}
                        className="px-6 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-semibold border border-black/5 hover:bg-stone-50 transition-colors"
                    >
                        Подробнее
                    </Link>
                </div>
            </div>

            {/* TRACK 5: Strategic KPI Section (Visible for Execution & Archive phases) */}
            {(activePhase === 'execution' || activePhase === 'archive') && (
                <div className="px-8 pb-8 pt-2">
                    <div className="h-px bg-black/5 mb-6" />
                    <KpiCard
                        isLoading={isKpiLoading}
                        data={kpi ? {
                            hasData: kpi.hasData,
                            plannedYield: kpi.plannedYield,
                            actualYield: kpi.actualYield,
                            yieldDelta: kpi.yieldDelta,
                            costPerTon: kpi.costPerTon,
                            profitPerHectare: kpi.profitPerHectare,
                            roi: kpi.roi,
                            sri: kpi.sri ?? 0,
                            sriDelta: kpi.sriDelta ?? 0
                        } : undefined}
                    />
                </div>
            )}
        </div>
    );
}

export function PlansList({ plans, authority, context, onTransition }: PlansListProps) {
    const [activePhase, setActivePhase] = useState<FsmPhase>('planning');

    const phaseConfig: Record<FsmPhase, { label: string; statuses: HarvestPlanStatus[] }> = {
        planning: { label: 'Планирование', statuses: ['DRAFT', 'REVIEW', 'APPROVED'] },
        execution: { label: 'Исполнение', statuses: ['ACTIVE'] },
        archive: { label: 'Архив', statuses: ['DONE', 'ARCHIVE'] },
    };

    const filteredPlans = plans.filter(p => phaseConfig[activePhase].statuses.includes(p.status));

    return (
        <div className="space-y-8">
            {/* Phase Tabs - Premium Aesthetics */}
            <div className="flex space-x-2 p-1.5 bg-zinc-50 rounded-[20px] w-fit border border-black/5">
                {(Object.keys(phaseConfig) as FsmPhase[]).map(phase => (
                    <button
                        key={phase}
                        onClick={() => setActivePhase(phase)}
                        className={clsx(
                            "px-8 py-3 rounded-[14px] text-sm font-semibold transition-all duration-300",
                            activePhase === phase
                                ? 'bg-white text-black shadow-lg shadow-black/[0.03] scale-100'
                                : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/40'
                        )}
                    >
                        {phaseConfig[phase].label}
                    </button>
                ))}
            </div>

            {/* Plans List */}
            <div className="space-y-6">
                {filteredPlans.length === 0 ? (
                    <div className="p-20 text-center bg-zinc-50/50 border border-dashed border-black/10 rounded-[32px]">
                        <p className="text-zinc-400 text-sm font-medium">В этой фазе планов не обнаружено</p>
                    </div>
                ) : (
                    filteredPlans.map(plan => (
                        <PlanItem
                            key={plan.id}
                            plan={plan}
                            authority={authority}
                            context={context}
                            onTransition={onTransition}
                            activePhase={activePhase}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

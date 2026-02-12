import React, { useState } from 'react';
import { HarvestPlanStatus, getEntityTransitions } from '@/lib/consulting/ui-policy';
import { UserRole } from '@/lib/config/role-config';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';
import { KpiCard } from './KpiCard';

interface Plan {
    id: string;
    targetMetric: string;
    status: HarvestPlanStatus;
}

interface PlansListProps {
    plans: Plan[];
    userRole: UserRole;
    context: DomainUiContext;
    onTransition: (id: string, target: string) => void;
}

type FsmPhase = 'planning' | 'execution' | 'archive';

export function PlansList({ plans, userRole, context, onTransition }: PlansListProps) {
    const [activePhase, setActivePhase] = useState<FsmPhase>('planning');

    const phaseConfig: Record<FsmPhase, { label: string; statuses: HarvestPlanStatus[] }> = {
        planning: { label: 'Планирование', statuses: ['DRAFT', 'REVIEW', 'APPROVED'] },
        execution: { label: 'Исполнение', statuses: ['ACTIVE'] },
        archive: { label: 'Архив', statuses: ['DONE', 'ARCHIVE'] },
    };

    const filteredPlans = plans.filter(p => phaseConfig[activePhase].statuses.includes(p.status));

    return (
        <div className="space-y-6">
            {/* Phase Tabs - Align with UI Canon */}
            <div className="flex space-x-1 p-1 bg-gray-50/50 rounded-2xl w-fit border border-black/5">
                {(Object.keys(phaseConfig) as FsmPhase[]).map(phase => (
                    <button
                        key={phase}
                        onClick={() => setActivePhase(phase)}
                        className={clsx(
                            "px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                            activePhase === phase
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                        )}
                    >
                        {phaseConfig[phase].label}
                    </button>
                ))}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredPlans.length === 0 ? (
                    <div className="p-16 text-center bg-white border border-dashed border-black/10 rounded-2xl">
                        <p className="text-gray-400 text-sm font-normal">В этой фазе планов нет.</p>
                    </div>
                ) : (
                    filteredPlans.map(plan => {
                        const perm = getEntityTransitions('harvest-plan', plan.status, userRole, context);

                        return (
                            <div key={plan.id} className="bg-white border border-black/5 rounded-2xl overflow-hidden group hover:border-black/10 transition-all duration-300">
                                <div className="p-6 flex justify-between items-center ">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="font-medium text-gray-900 text-base">{plan.targetMetric}</h3>
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-tight",
                                                plan.status === 'DRAFT' ? 'bg-gray-100 text-gray-500' :
                                                    plan.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                                        plan.status === 'REVIEW' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-blue-50 text-blue-700'
                                            )}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-normal">ID: {plan.id}</p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {/* Action Buttons: Allowed */}
                                        {perm.allowedTransitions.map(t => (
                                            <button
                                                key={t.target}
                                                onClick={() => onTransition(plan.id, t.target)}
                                                className="px-5 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-all active:scale-95"
                                            >
                                                {t.label}
                                            </button>
                                        ))}

                                        {/* Action Buttons: Blocked (Visual Explanation) */}
                                        {perm.blockedTransitions.map(bt => (
                                            <div
                                                key={bt.transition}
                                                title={bt.reason}
                                                className="px-5 py-2 bg-gray-50 text-gray-300 rounded-xl text-xs font-medium border border-black/5 cursor-not-allowed grayscale relative group"
                                            >
                                                {bt.transition}
                                                {/* Tooltip implementation could be more complex, using simple title for now */}
                                            </div>
                                        ))}

                                        <button className="px-5 py-2 bg-white text-gray-900 rounded-xl text-xs font-medium border border-black/10 hover:bg-gray-50 transition-colors">
                                            Детали
                                        </button>
                                    </div>
                                </div>

                                {/* TRACK 5: Strategic KPI Section (Visible for Execution & Archive phases) */}
                                {(activePhase === 'execution' || activePhase === 'archive') && (
                                    <div className="px-6 pb-6 -mt-2">
                                        <KpiCard
                                            data={plan.status === 'ACTIVE' ? {
                                                hasData: true,
                                                plannedYield: 45,
                                                actualYield: 48.2,
                                                yieldDelta: 7.1,
                                                costPerTon: 12400,
                                                profitPerHectare: 24500,
                                                roi: 18.5
                                            } : undefined}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            );
}

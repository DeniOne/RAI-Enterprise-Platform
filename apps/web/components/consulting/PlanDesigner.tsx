'use client';

import React from 'react';
import { HarvestPlanStatus, getHarvestPlanPermissions } from '@/lib/consulting/ui-policy';
import { UserRole } from '@/lib/config/role-config';
import { ActionGuard } from './ActionGuard';

interface PlanData {
    id: string;
    targetMetric: string;
    targetValue: number;
    description: string;
    status: HarvestPlanStatus;
}

interface PlanDesignerProps {
    plan: PlanData;
    userRole: UserRole;
    onUpdate: (data: Partial<PlanData>) => void;
    onAction: (targetStatus: string) => void;
}

export function PlanDesigner({ plan, userRole, onUpdate, onAction }: PlanDesignerProps) {
    const perm = getHarvestPlanPermissions(plan.status, userRole);
    const isEditingDisabled = !perm.canEdit;

    return (
        <div className="bg-white border border-black/5 rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="p-8 border-b border-black/5 bg-gray-50 flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-bold text-gray-900">Дизайнер Плана</h2>
                        <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase rounded-full">
                            {plan.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">
                        Consulting Core // {perm.policyVersion}
                    </p>
                </div>
                <div className="flex space-x-3">
                    <ActionGuard permission={perm} action="transition">
                        {perm.allowedTransitions.map(t => (
                            <button
                                key={t.target}
                                onClick={() => onAction(t.target)}
                                className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:scale-105 transition-all"
                            >
                                {t.label}
                            </button>
                        ))}
                    </ActionGuard>
                    {perm.canApprove && (
                        <button
                            onClick={() => onAction('APPROVED')}
                            className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/10 hover:scale-105 transition-all"
                        >
                            Утвердить
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
                {perm.deniedReasons && perm.deniedReasons.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm flex items-start space-x-3">
                        <span className="font-bold text-lg leading-none">!</span>
                        <div>
                            {perm.deniedReasons.map((reason, i) => (
                                <p key={i}>{reason}</p>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">Целевая культура</label>
                        <input
                            type="text"
                            disabled={isEditingDisabled}
                            value={plan.targetMetric}
                            onChange={(e) => onUpdate({ targetMetric: e.target.value })}
                            className="w-full px-5 py-3 bg-white border border-black/5 rounded-2xl text-sm focus:border-black outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">Целевая урожайность (т/га)</label>
                        <input
                            type="number"
                            disabled={isEditingDisabled}
                            value={plan.targetValue}
                            onChange={(e) => onUpdate({ targetValue: Number(e.target.value) })}
                            className="w-full px-5 py-3 bg-white border border-black/5 rounded-2xl text-sm focus:border-black outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">Описание стратегии</label>
                    <textarea
                        rows={4}
                        disabled={isEditingDisabled}
                        value={plan.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        className="w-full px-5 py-4 bg-white border border-black/5 rounded-2xl text-sm focus:border-black outline-none transition-all disabled:opacity-50 disabled:bg-gray-50 resize-none"
                        placeholder="Опишите основные этапы и риски..."
                    />
                </div>
            </div>

            {plan.status === 'ACTIVE' && (
                <div className="p-8 bg-blue-50/50 border-t border-black/5">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4">Журнал обсуждения</h4>
                    <div className="bg-white border border-black/5 rounded-2xl p-4 text-sm text-gray-400 italic">
                        Здесь будут отображаться комментарии и запросы на отклонения...
                    </div>
                </div>
            )}
        </div>
    );
}

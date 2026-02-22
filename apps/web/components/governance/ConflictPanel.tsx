'use client';

import React from 'react';
import { InstitutionalConflict } from '@/core/governance/InstitutionalContracts';
import { AlertTriangle, Hash, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConflictPanelProps {
    conflicts: InstitutionalConflict[];
    onResolve: (id: string) => void;
    isVisible: boolean;
}

/**
 * ConflictPanel
 * @description Панель управления институциональными конфликтами (Phase 4).
 * Канон: Light Theme, Geist, блокирующая логика.
 */
export const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts, onResolve, isVisible }) => {
    if (!isVisible || conflicts.length === 0) return null;

    return (
        <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-600 rounded-lg text-white shadow-lg shadow-rose-600/20">
                    <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-rose-900">Institutional Conflict</h3>
                    <p className="text-[10px] text-rose-600/70 font-normal uppercase tracking-widest">Разрешение противоречий</p>
                </div>
            </div>

            <div className="space-y-4">
                {conflicts.map((conflict) => (
                    <div key={conflict.conflictId} className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200 uppercase">
                                    {conflict.domainA}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-medium border border-rose-100 uppercase">
                                    {conflict.domainB}
                                </span>
                            </div>
                            <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                conflict.severity === 'CRITICAL' ? "bg-rose-100 text-rose-700" : "bg-yellow-100 text-yellow-700"
                            )}>
                                {conflict.severity}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-xs text-slate-700 font-normal leading-relaxed">
                                Зафиксировано противоречие между агрономической стратегией и финансовыми лимитами сезона.
                                Требуется изменение параметров или эскалация.
                            </p>

                            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight mb-1">Escalation Path:</p>
                                {conflict.escalationPath.map((step) => (
                                    <div key={step.nodeId} className="flex items-center gap-2 text-[10px] text-slate-600 font-normal">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <span>Step {step.order}: {step.authorityRequired} ({step.nodeId})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-9 text-[11px] font-medium border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl"
                                onClick={() => onResolve(conflict.conflictId)}
                            >
                                Пересчитать параметры
                            </Button>
                            <Button
                                className="flex-1 h-9 text-[11px] font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-none"
                            >
                                Эскалировать
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center gap-2 py-2 px-3 bg-rose-100/50 rounded-lg border border-rose-200/50">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <p className="text-[9px] text-rose-700 font-medium tracking-tight">
                    Блокирующее состояние: действие приостановлено до разрешения конфликтов
                </p>
            </div>
        </div>
    );
};

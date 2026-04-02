'use client';

import React from 'react';
import { Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OperationActivityTimeline } from './OperationActivityTimeline';
import { EvidenceGuardBanner } from './EvidenceGuardBanner';

interface ExecutionCardProps {
    operation: any;
    onStart: (id: string) => void;
    onComplete: (operation: any) => void;
    onRecordControlPoint?: (operation: any) => void;
}

/**
 * ExecutionCard
 * @description Карточка операции исполнения, переработанная согласно UI Design Canon Phase 4.
 * Канон: Light Theme (#FAFAFA), Geist Medium (500), rounded-2xl.
 */
export const ExecutionCard: React.FC<ExecutionCardProps> = ({ operation, onStart, onComplete, onRecordControlPoint }) => {
    const status = operation.executionRecord?.status || 'PLANNED';
    const riskLevel = operation.riskLevel || 'R1'; // Phase 4 Injection
    const controlPoints = operation.mapStage?.controlPoints || [];
    const governanceSummary = operation.governanceSummary || {};
    const evidenceSummary = operation.evidenceSummary || null;
    const openGates = (governanceSummary.decisionGates || []).filter((gate: any) => gate.status === 'OPEN');
    const pendingChangeOrders = (governanceSummary.changeOrders || []).filter((changeOrder: any) => changeOrder.status === 'PENDING_APPROVAL');
    const latestControlPointOutcome = controlPoints
        .flatMap((point: any) => point.outcomeExplanations || [])
        .sort((left: any, right: any) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())[0];

    const getStatusStyles = () => {
        switch (status) {
            case 'IN_PROGRESS': return 'border-blue-200 bg-blue-50/50 text-blue-600';
            case 'DONE': return 'border-emerald-200 bg-emerald-50/50 text-emerald-600';
            case 'MISSED': return 'border-rose-200 bg-rose-50/50 text-rose-600';
            default: return 'border-black/5 bg-white text-slate-500';
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'R4': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'R3': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'R2': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'IN_PROGRESS': return <Clock className="w-4 h-4 animate-pulse" />;
            case 'DONE': return <CheckCircle className="w-4 h-4" />;
            case 'MISSED': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className={cn(
            "p-6 rounded-2xl border transition-all duration-300 bg-white hover:shadow-sm",
            getStatusStyles()
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-slate-900">{operation.name}</h3>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-tight",
                            getRiskColor(riskLevel)
                        )}>
                            {riskLevel}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                        {operation.mapStage?.name || 'Операция'} • {new Date(operation.plannedStartTime).toLocaleDateString('ru-RU')}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-black/5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                    {getStatusIcon()}
                    {status === 'PLANNED' ? 'План' : status === 'IN_PROGRESS' ? 'В работе' : 'Готово'}
                </div>
            </div>

            <div className="space-y-1.5 mb-6 pt-2">
                {operation.resources?.map((res: any) => (
                    <div key={res.id} className="flex justify-between text-[11px] py-1 border-b border-black/[0.03] last:border-0 text-slate-600">
                        <span className="font-normal">{res.name}</span>
                        <span className="font-medium text-slate-900">{res.amount || res.plannedAmount} {res.unit}</span>
                    </div>
                ))}
            </div>

            {controlPoints.length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
                            Control points: {controlPoints.length}
                        </p>
                        {latestControlPointOutcome && (
                            <span className="text-[10px] text-slate-600">
                                {latestControlPointOutcome.severity}: {latestControlPointOutcome.summary}
                            </span>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {controlPoints.map((point: any) => (
                            <span key={point.id} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-amber-100">
                                {point.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {(openGates.length > 0 || pendingChangeOrders.length > 0) && (
                <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-700">
                        Governance summary
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {openGates.length > 0 && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                                open gates: {openGates.length}
                            </span>
                        )}
                        {pendingChangeOrders.map((changeOrder: any) => (
                            <span key={changeOrder.id} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                                {changeOrder.id}: {changeOrder.approvalSummary?.approved || 0}/{changeOrder.approvalSummary?.total || 0} approved
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {evidenceSummary && (
                <div className="mb-5">
                    <EvidenceGuardBanner
                        title="Evidence summary"
                        isBlocking={!evidenceSummary.isComplete}
                        readyText="Evidence готов для governed closure по операции."
                        blockedText="Есть missing evidence, которые могут заблокировать `DONE` или governed outcome."
                        missingEvidenceTypes={evidenceSummary.missingEvidenceTypes}
                        requiredCount={evidenceSummary.requiredEvidenceTypes?.length}
                        presentCount={evidenceSummary.presentEvidenceTypes?.length}
                        compact
                    />
                </div>
            )}

            <div className="mb-5">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Execution timeline
                </p>
                <OperationActivityTimeline operation={operation} limit={3} />
            </div>

            <div className="flex gap-2">
                {status === 'PLANNED' && (
                    <Button
                        variant="default"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-xs font-medium rounded-xl shadow-none"
                        onClick={() => onStart(operation.id)}
                    >
                        <Play className="w-3.5 h-3.5 fill-current" /> Начать
                    </Button>
                )}

                {status === 'IN_PROGRESS' && (
                    <>
                        {controlPoints.length > 0 && onRecordControlPoint && (
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 h-9 text-xs font-medium rounded-xl shadow-none"
                                onClick={() => onRecordControlPoint(operation)}
                            >
                                <AlertCircle className="w-3.5 h-3.5" /> Control Point
                            </Button>
                        )}
                        <Button
                            variant="default"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-medium rounded-xl shadow-none"
                            onClick={() => onComplete(operation)}
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> Завершить
                        </Button>
                    </>
                )}

                {status === 'DONE' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-medium border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Выполнено {new Date(operation.executionRecord?.actualDate).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>
        </div>
    );
};

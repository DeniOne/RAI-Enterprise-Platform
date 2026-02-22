'use client';

import React from 'react';
import { useGovernanceAction } from '@/shared/hooks/useGovernanceAction';
import {
    ShieldAlert,
    CheckCircle2,
    Play,
    Users,
    HardHat,
    Fingerprint,
    Lock,
    ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @function cn
 * @description Утилита для объединения Tailwind классов.
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * @interface StepItemProps
 */
interface StepItemProps {
    title: string;
    desc: string;
    active: boolean;
    completed: boolean;
    icon: React.ReactNode;
    children?: React.ReactNode;
}

/**
 * @component StepItem
 * @description Институциональный элемент шага процесса.
 */
const StepItem: React.FC<StepItemProps> = ({
    title,
    desc,
    active,
    completed,
    icon,
    children
}) => (
    <div className={cn(
        "relative flex items-center justify-between p-6 rounded-[32px] border transition-all duration-300",
        active ? "border-black/20 bg-white shadow-sm scale-[1.01] z-10" :
            completed ? "border-emerald-100 bg-emerald-50/10" :
                "border-black/5 opacity-40"
    )}>
        <div className="flex items-center space-x-5">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                active ? "bg-black text-white" :
                    completed ? "bg-emerald-500 text-white" :
                        "bg-black/5 text-black/20"
            )}>
                {completed ? <CheckCircle2 size={20} /> : icon}
            </div>
            <div>
                <p className={cn(
                    "text-sm font-medium tracking-tight mb-1",
                    active ? "text-black" : completed ? "text-emerald-700" : "text-black/30"
                )}>
                    {title}
                </p>
                <p className={cn(
                    "text-xs font-normal opacity-60",
                    active ? "text-black" : "text-black/40"
                )}>
                    {desc}
                </p>
            </div>
        </div>
        <div className="flex items-center">
            {children}
        </div>
        {completed && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white">
                <ShieldCheck size={12} />
            </div>
        )}
    </div>
);

/**
 * @component GovernanceTestButton
 * @description Панель управления Deterministic Impact Engine (Phase 4).
 * Соответствует UI Design Canon (Geist, Light Theme, No Bold).
 */
export const GovernanceTestButton: React.FC = () => {
    const {
        state,
        context,
        initiate,
        analyzeEffects,
        detectConflict,
        resolveConflict,
        escalate,
        markQuorumMet,
        approve,
        execute,
        canApprove,
        canExecute,
        canEscalate,
        isPending
    } = useGovernanceAction('STRATEGIC_PLAN_REGENERATION');

    /**
     * @function getBtnStyle
     * @description Генератор стилей кнопок согласно канону.
     */
    const getBtnStyle = (active: boolean, priority: 'primary' | 'secondary' = 'primary') => {
        const base = "px-4 py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all duration-200";

        if (!active) return cn(base, "bg-black/5 text-black/20 cursor-not-allowed");

        if (priority === 'primary') {
            return cn(base, "bg-black text-white hover:opacity-90 shadow-sm active:scale-95");
        }
        return cn(base, "border border-black/10 text-black hover:bg-black/5 active:scale-95");
    };

    return (
        <div className="p-8 bg-white border border-black/10 rounded-[40px] shadow-sm max-w-2xl font-geist">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-sm">
                        <Fingerprint size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-medium tracking-tight text-black">Institutional Kernel</h2>
                        <p className="text-[10px] text-black/40 uppercase tracking-widest">Phase 4 • Deterministic Impact</p>
                    </div>
                </div>
                <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest border transition-all duration-500",
                    state === 'idle' ? "bg-black/5 border-black/10 text-black/30" :
                        state === 'effect_analysis' ? "bg-amber-50 border-amber-200 text-amber-600" :
                            state === 'conflict_detected' ? "bg-rose-50 border-rose-200 text-rose-600" :
                                state === 'executed' ? "bg-emerald-50 border-emerald-500 text-emerald-600" :
                                    "bg-black/5 border-black/10 text-black"
                )}>
                    {state === 'executed' ? 'Session Finalized' : `FSM: ${String(state).toUpperCase()}`}
                </div>
            </div>

            <div className="space-y-4">
                <StepItem
                    title="Шаг 1. Инициация"
                    desc="Фиксация намерения и генерация TraceID"
                    active={state === 'idle' || state === 'initiated'}
                    completed={state !== 'idle' && state !== 'initiated'}
                    icon={<Play size={18} />}
                >
                    <button onClick={() => initiate('R3')} className={getBtnStyle(state === 'idle')}>Start R3</button>
                </StepItem>

                <StepItem
                    title="Шаг 1.5. Анализ эффектов"
                    desc="Детерминированное вычисление последствий"
                    active={state === 'effect_analysis'}
                    completed={state !== 'idle' && state !== 'initiated' && state !== 'effect_analysis'}
                    icon={<Fingerprint size={18} />}
                >
                    <button onClick={() => detectConflict()} className={getBtnStyle(state === 'effect_analysis', 'secondary')}>Симуляция Конфликта</button>
                </StepItem>

                <StepItem
                    title="Шаг 2. Конфликт-контроль"
                    desc="Разрешение институциональных противоречий"
                    active={state === 'conflict_detected' || state === 'escalated'}
                    completed={state !== 'conflict_detected' && state !== 'escalated' && state !== 'idle' && state !== 'pending' && state !== 'initiated' && state !== 'effect_analysis'}
                    icon={<ShieldAlert size={18} />}
                >
                    {state === 'conflict_detected' ? (
                        <button onClick={() => resolveConflict(context.conflicts[0]?.conflictId)} className={getBtnStyle(true)}>Резолвить</button>
                    ) : (
                        <button onClick={escalate} className={getBtnStyle(canEscalate)}>Эскалация</button>
                    )}
                </StepItem>

                <StepItem
                    title="Шаг 3. Подписание"
                    desc="Сбор кворума и криптографических подписей"
                    active={state === 'collecting_signatures'}
                    completed={state === 'quorum_met' || state === 'approved' || state === 'executed'}
                    icon={<Users size={18} />}
                >
                    <button onClick={markQuorumMet} className={getBtnStyle(state === 'collecting_signatures')}>Собрать подписи</button>
                </StepItem>

                <StepItem
                    title="Шаг 4. Валидация"
                    desc="Финальная проверка целостности пакета"
                    active={state === 'quorum_met' || (state === 'pending' && context.riskLevel === 'R1')}
                    completed={state === 'approved' || state === 'executed'}
                    icon={<HardHat size={18} />}
                >
                    <button onClick={approve} className={getBtnStyle(canApprove)}>Утвердить</button>
                </StepItem>

                <StepItem
                    title="Шаг 5. Завершение"
                    desc="Запись в Ledger и закрытие сессии"
                    active={state === 'approved'}
                    completed={state === 'executed'}
                    icon={<CheckCircle2 size={18} />}
                >
                    <button onClick={execute} className={getBtnStyle(canExecute, 'primary')}>Выполнить</button>
                </StepItem>
            </div>

            {isPending && (
                <div className="mt-8 p-6 rounded-[32px] bg-black/[0.02] border border-black/5">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">System Audit Trace</p>
                        <Lock size={12} className="opacity-20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div>
                            <p className="text-black/30 mb-1 uppercase text-[9px]">Trace ID</p>
                            <p className="font-mono text-black/60 truncate">{context.traceId || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-black/30 mb-1 uppercase text-[9px]">Risk Profile</p>
                            <p className="text-black/60">{context.riskLevel}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-black/30 mb-1 uppercase text-[9px]">Institutional Effects (Verified)</p>
                            <div className="space-y-3 mt-1">
                                {context.effects.map(e => (
                                    <div key={e.effectId} className="group">
                                        <div className="flex justify-between items-center">
                                            <p className="text-emerald-600 font-medium">
                                                [{e.domain}] {e.action}
                                            </p>
                                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                                                {e.impactLevel}
                                            </span>
                                        </div>
                                        <div className="mt-1 p-2 bg-black/[0.03] rounded-lg border border-black/5">
                                            <p className="text-[8px] font-mono text-black/40 break-all leading-tight">
                                                <span className="text-amber-600/50 mr-1">RFC8785:</span>
                                                {e.immutableHash || 'PENDING_HASHING'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

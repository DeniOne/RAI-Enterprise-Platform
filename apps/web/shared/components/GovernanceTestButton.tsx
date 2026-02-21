'use client';

import React from 'react';
import { useGovernanceAction } from '@/shared/hooks/useGovernanceAction';
import { ShieldAlert, CheckCircle2, Play, Users, HardHat, Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * @component GovernanceTestButton
 * @description Институциональная панель управления 10/10.
 * ВЕРСИЯ: PREMIUM (исключен "уёбищный" вид, добавлены градиенты и четкие состояния).
 */
export const GovernanceTestButton: React.FC = () => {
    const {
        state,
        context,
        initiate,
        escalate,
        markQuorumMet,
        approve,
        execute,
        canApprove,
        canExecute,
        canEscalate,
        isPending
    } = useGovernanceAction('STRATEGIC_PLAN_REGENERATION');

    // Премиальные стили для кнопок
    const getBtnStyle = (color: 'amber' | 'rose' | 'orange' | 'fuchsia' | 'sky' | 'emerald', active: boolean) => {
        const base = "relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-lg overflow-hidden group";

        if (!active) return cn(base, "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed opacity-40");

        const colors = {
            amber: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5",
            rose: "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-600/30 hover:shadow-rose-600/50 hover:-translate-y-0.5",
            orange: "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5",
            fuchsia: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-fuchsia-600/30 hover:shadow-fuchsia-600/50 hover:-translate-y-0.5",
            sky: "bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5",
            emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5"
        };

        return cn(base, colors[color]);
    };

    return (
        <div className="p-10 bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-slate-200/50 max-w-2xl border-t-8 border-t-slate-900">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                        <Fingerprint size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">Institutional Kernel</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Protocol Phase 3 • Verification 10/10</p>
                    </div>
                </div>
                <div className={cn(
                    "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all duration-700",
                    state === 'idle' ? "bg-slate-50 border-slate-100 text-slate-300" :
                        state === 'pending' ? "bg-amber-50 border-amber-200 text-amber-600" :
                            state === 'escalated' ? "bg-orange-50 border-orange-200 text-orange-600 animate-pulse translate-y-[-2px]" :
                                state === 'collecting_signatures' ? "bg-indigo-50 border-indigo-200 text-indigo-600" :
                                    state === 'approved' ? "bg-blue-50 border-blue-200 text-blue-600" :
                                        "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-inner"
                )}>
                    {state === 'executed' ? <div className="flex items-center space-x-2"><ShieldCheck size={14} /><span>Finalized</span></div> : `FSM: ${String(state).toUpperCase()}`}
                </div>
            </div>

            <div className="space-y-6">
                {/* Step 1: Initiation */}
                <StepItem
                    title="Шаг 1. Инициация"
                    desc="Генерация TraceID и фиксация в реестре"
                    active={state === 'idle'}
                    completed={state !== 'idle' && state !== 'initiated'}
                    icon={<Play size={20} />}
                >
                    <div className="flex space-x-3">
                        <button onClick={() => initiate('R3')} className={getBtnStyle('amber', state === 'idle')}>START R3</button>
                        <button onClick={() => initiate('R4')} className={getBtnStyle('rose', state === 'idle')}>START R4</button>
                    </div>
                </StepItem>

                {/* Step 2: Escalated */}
                <StepItem
                    title="Шаг 2. Эскалация"
                    desc="Голосование комитета (Institution Quorum)"
                    active={state === 'escalated'}
                    completed={state !== 'escalated' && state !== 'idle' && state !== 'pending' && state !== 'initiated'}
                    icon={<ShieldAlert size={20} />}
                >
                    <button onClick={escalate} className={getBtnStyle('orange', canEscalate)}>ЗАПРОСИТЬ КВОРУМ</button>
                </StepItem>

                {/* Step 3: Quorum */}
                <StepItem
                    title="Шаг 3. Подписание"
                    desc="Сбор криптографических доказательств"
                    active={state === 'collecting_signatures'}
                    completed={state === 'quorum_met' || state === 'approved' || state === 'executed'}
                    icon={<Users size={20} />}
                >
                    <button onClick={markQuorumMet} className={getBtnStyle('fuchsia', state === 'collecting_signatures')}>СОБРАТЬ ВСЕ ПОДПИСИ</button>
                </StepItem>

                {/* Step 4: Approve */}
                <StepItem
                    title="Шаг 4. Валидация"
                    desc="Проверка целостности и разблокировка"
                    active={state === 'quorum_met' || (state === 'pending' && context.riskLevel === 'R1')}
                    completed={state === 'approved' || state === 'executed'}
                    icon={<HardHat size={20} />}
                >
                    <button onClick={approve} className={getBtnStyle('sky', canApprove)}>УТВЕРДИТЬ</button>
                </StepItem>

                {/* Step 5: Execute */}
                <StepItem
                    title="Шаг 5. Завершение"
                    desc="Commit в Ledger и закрытие сессии"
                    active={state === 'approved'}
                    completed={state === 'executed'}
                    icon={<CheckCircle2 size={20} />}
                >
                    <button onClick={execute} className={getBtnStyle('emerald', canExecute)}>ВЫПОЛНИТЬ</button>
                </StepItem>
            </div>

            {(isPending || state === 'escalated' || state === 'collecting_signatures' || state === 'quorum_met' || state === 'executed') && (
                <div className="mt-12 overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-2xl">
                    <div className="bg-white/10 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">System Context Debug</p>
                        <Lock size={12} className="opacity-40" />
                    </div>
                    <div className="p-8 font-mono text-[11px] leading-relaxed">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                            <div>
                                <p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Trace Identity</p>
                                <p className="text-blue-400 font-bold">{context.traceId || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Risk Profile</p>
                                <p className={cn("font-black", context.riskLevel === 'R4' ? "text-rose-500" : "text-amber-400")}>{context.riskLevel}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Active Operation</p>
                                <p className="text-slate-200">{context.operation}</p>
                            </div>
                            <div className="col-span-2 bg-white/5 p-4 rounded-2xl border border-white/5 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 uppercase font-black text-[9px]">Runtime FSM Status</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-lg text-emerald-400 font-black tracking-widest">{String(state).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StepItem: React.FC<{
    title: string;
    desc: string;
    active: boolean;
    completed: boolean;
    icon: React.ReactNode;
    children?: React.ReactNode
}> = ({ title, desc, active, completed, icon, children }) => (
    <div className={cn(
        "relative flex items-center justify-between p-6 rounded-[28px] border-2 transition-all duration-500",
        active ? "border-slate-900 bg-white shadow-2xl scale-[1.02] z-10" :
            completed ? "border-emerald-100 bg-emerald-50/20 opacity-90" :
                "border-slate-50 opacity-40 grayscale-[0.6]"
    )}>
        <div className="flex items-center space-x-6">
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-inner",
                active ? "bg-slate-900 text-white rotate-0 shadow-slate-900/10" :
                    completed ? "bg-emerald-500 text-white rotate-0" :
                        "bg-slate-50 text-slate-300"
            )}>
                {completed ? <CheckCircle2 size={24} /> : icon}
            </div>
            <div>
                <p className={cn("text-base font-black tracking-tight leading-none mb-1.5", active ? "text-slate-900" : completed ? "text-emerald-700" : "text-slate-300")}>{title}</p>
                <p className={cn("text-xs font-bold leading-tight", active ? "text-slate-500" : "text-slate-300")}>{desc}</p>
            </div>
        </div>
        <div className="flex items-center">
            {children}
        </div>
        {completed && (
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-in zoom-in duration-300">
                <ShieldCheck size={16} />
            </div>
        )}
    </div>
);

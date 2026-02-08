'use client';

import React, { useState } from 'react';
import { StateBadge } from '@/components/strategic/StateBadge';
import { ExplanationLayer } from '@/components/strategic/ExplanationLayer';
import { DetailOverlay } from '@/components/strategic/DetailOverlay';
import { ArrowLeft, Beaker, ChevronRight, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';

interface Experiment {
    id: string;
    name: string;
    state: any;
    protocolStatus: any;
    legalStatus: string;
    protocols: any[];
}

export default function RdContextPage({ experiments }: { experiments: Experiment[] }) {
    const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div className="space-y-4">
                    <Link href="/strategic" className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2 hover:opacity-100 transition-opacity">
                        <ArrowLeft size={10} /> Назад к обзору
                    </Link>
                    <div className="flex items-center gap-4">
                        <Beaker size={40} className="text-[#00F0FF]" />
                        <h1 className="text-5xl font-light tracking-tight">R&D Контур</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-light">{experiments.length}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-40">Активных экспериментов</div>
                </div>
            </section>

            {/* Experiments List */}
            <section className="space-y-4">
                <div className="grid grid-cols-12 px-6 py-2 text-[10px] uppercase tracking-widest opacity-40 font-medium">
                    <div className="col-span-4">Эксперимент</div>
                    <div className="col-span-2 text-center">FSM State</div>
                    <div className="col-span-2 text-center">Протокол</div>
                    <div className="col-span-2 text-center">Юр. Флаг</div>
                    <div className="col-span-2 text-right">Инфо</div>
                </div>

                <div className="space-y-1">
                    {experiments.map((exp) => (
                        <div
                            key={exp.id}
                            onClick={() => setSelectedExp(exp)}
                            className="grid grid-cols-12 items-center px-6 py-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
                        >
                            <div className="col-span-4">
                                <div className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                                    {exp.name}
                                </div>
                                <div className="text-[9px] opacity-30 mt-0.5 font-mono">ID: {exp.id}</div>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={exp.state as any} className="text-[9px] min-w-[80px] justify-center" />
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={exp.protocolStatus === 'APPROVED' ? 'APPROVED' : 'DRAFT'} label={exp.protocolStatus} className="text-[9px]" />
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={exp.legalStatus as any} className="text-[9px]" />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Detail Overlay */}
            <DetailOverlay
                isOpen={!!selectedExp}
                onClose={() => setSelectedExp(null)}
                title={selectedExp?.name || ''}
                subtitle="Аналитическая карта эксперимента"
            >
                {selectedExp && (
                    <div className="space-y-10">
                        {/* Context Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                <div className="text-[9px] uppercase tracking-widest opacity-40">Текущий стейт</div>
                                <div className="flex items-center gap-2">
                                    <StateBadge state={selectedExp.state as any} />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                <div className="text-[9px] uppercase tracking-widest opacity-40">Юридический риск</div>
                                <div className="flex items-center gap-2">
                                    <StateBadge state={selectedExp.legalStatus as any} />
                                </div>
                            </div>
                        </div>

                        {/* Explanation Layer */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest opacity-40 font-medium">Почему этот статус?</h3>
                            <ExplanationLayer
                                reasons={[
                                    {
                                        type: selectedExp.protocolStatus === 'APPROVED' ? 'INFO' : 'FSM',
                                        title: `Статус протокола: ${selectedExp.protocolStatus}`,
                                        description: selectedExp.protocolStatus === 'APPROVED'
                                            ? 'Протокол прошел научную верификацию и утвержден главным архитектором.'
                                            : 'Протокол находится на стадии редактирования или ожидает аппрува.',
                                        ref: 'B5-PROT-VAL'
                                    },
                                    {
                                        type: selectedExp.legalStatus === 'OK' ? 'INFO' : 'LEGAL',
                                        title: 'Комплаенс-проверка',
                                        description: selectedExp.legalStatus === 'OK'
                                            ? 'Эксперимент полностью соответствует текущим регуляторным нормам.'
                                            : 'Зафиксировано потенциальное нарушение нормы EU 2024/RND в части использования пестицидов.',
                                        ref: 'LR-124',
                                        version: '2.4.1'
                                    }
                                ]}
                            />
                        </div>

                        {/* Scientific Data Integrity */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest opacity-40 font-medium">Целостность данных</h3>
                            <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {selectedExp.state === 'ANALYSIS' || selectedExp.state === 'CLOSED' ? (
                                        <Lock size={24} className="text-[#00F0FF]" />
                                    ) : (
                                        <Unlock size={24} className="opacity-20" />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium">Measurement Lock</div>
                                        <div className="text-xs opacity-40">Автоматическая блокировка изменений</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono opacity-60">
                                    {selectedExp.state === 'ANALYSIS' || selectedExp.state === 'CLOSED' ? 'LOCKED' : 'OPEN'}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </DetailOverlay>
        </div>
    );
}

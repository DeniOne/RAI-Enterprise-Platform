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
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div className="space-y-4">
                    <Link href="/strategic" className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2 hover:text-black transition-colors font-medium">
                        <ArrowLeft size={10} /> Назад к обзору
                    </Link>
                    <div className="flex items-center gap-4">
                        <Beaker size={40} className="text-[#00A3A3]" />
                        <h1 className="text-5xl font-light tracking-tight text-gray-900">R&D Контур</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-light text-gray-900">{experiments.length}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Активных экспериментов</div>
                </div>
            </section>

            {/* Experiments List */}
            <section className="space-y-2">
                <div className="grid grid-cols-12 px-8 py-3 text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-black/5">
                    <div className="col-span-4">Эксперимент</div>
                    <div className="col-span-2 text-center">Статус FSM</div>
                    <div className="col-span-2 text-center">Протокол</div>
                    <div className="col-span-2 text-center">Юр. Контур</div>
                    <div className="col-span-2 text-right">Инфо</div>
                </div>

                <div className="space-y-2 pt-2">
                    {experiments.map((exp) => (
                        <div
                            key={exp.id}
                            onClick={() => setSelectedExp(exp)}
                            className="grid grid-cols-12 items-center px-8 py-5 bg-white border border-black/5 rounded-2xl hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group"
                        >
                            <div className="col-span-4">
                                <div className="text-[15px] font-medium tracking-tight text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                                    {exp.name}
                                </div>
                                <div className="text-[10px] text-gray-300 mt-1 font-mono font-medium">ИДЕНТИФИКАТОР: {exp.id}</div>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={exp.state as any} className="text-[9px] min-w-[90px] justify-center py-1.5" />
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge
                                    state={exp.protocolStatus === 'APPROVED' ? 'APPROVED' : 'DRAFT'}
                                    label={exp.protocolStatus === 'APPROVED' ? 'УТВЕРЖДЕН' : 'ЧЕРНОВИК'}
                                    className="text-[9px] min-w-[90px] justify-center py-1.5"
                                />
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={exp.legalStatus as any} className="text-[9px] min-w-[90px] justify-center py-1.5" />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <ChevronRight size={16} className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
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
                            <div className="p-6 rounded-3xl bg-gray-50 border border-black/5 space-y-2">
                                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Текущее состояние</div>
                                <div className="flex items-center gap-2 pt-1">
                                    <StateBadge state={selectedExp.state as any} className="py-1.5" />
                                </div>
                            </div>
                            <div className="p-6 rounded-3xl bg-gray-50 border border-black/5 space-y-2">
                                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Юридический риск</div>
                                <div className="flex items-center gap-2 pt-1">
                                    <StateBadge state={selectedExp.legalStatus as any} className="py-1.5" />
                                </div>
                            </div>
                        </div>

                        {/* Explanation Layer */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold ml-2">Почему этот статус?</h3>
                            <ExplanationLayer
                                reasons={[
                                    {
                                        type: selectedExp.protocolStatus === 'APPROVED' ? 'INFO' : 'FSM',
                                        title: `Статус протокола: ${selectedExp.protocolStatus === 'APPROVED' ? 'ВЕРИФИЦИРОВАН' : 'В ОБРАБОТКЕ'}`,
                                        description: selectedExp.protocolStatus === 'APPROVED'
                                            ? 'Протокол прошел научную верификацию и утвержден главным архитектором.'
                                            : 'Протокол находится на стадии редактирования или ожидает утверждения.',
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
                            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold ml-2">Целостность данных</h3>
                            <div className="p-6 rounded-3xl border border-black/5 bg-white flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    {selectedExp.state === 'ANALYSIS' || selectedExp.state === 'CLOSED' ? (
                                        <Lock size={24} className="text-[#00A3A3]" />
                                    ) : (
                                        <Unlock size={24} className="text-gray-200" />
                                    )}
                                    <div>
                                        <div className="text-[15px] font-medium text-gray-900">Блокировка измерений (Lock)</div>
                                        <div className="text-xs text-gray-500">Автоматическая защита от несанкционированных правок</div>
                                    </div>
                                </div>
                                <div className="text-[11px] font-mono font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
                                    {selectedExp.state === 'ANALYSIS' || selectedExp.state === 'CLOSED' ? 'ЗАБЛОКИРОВАНО' : 'ОТКРЫТО'}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </DetailOverlay>
        </div>
    );
}

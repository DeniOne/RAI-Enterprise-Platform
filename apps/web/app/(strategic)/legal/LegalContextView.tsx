'use client';

import React, { useState } from 'react';
import { StateBadge, StateType } from '@/components/strategic/StateBadge';
import { ExplanationLayer } from '@/components/strategic/ExplanationLayer';
import { DetailOverlay } from '@/components/strategic/DetailOverlay';
import { ArrowLeft, ShieldCheck, ChevronRight, Scale, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface LegalRequirement {
    id: string;
    summary: string;
    target: string;
    status: StateType;
    version: string;
    obligations: any[];
}

export default function LegalContextView({ requirements }: { requirements: LegalRequirement[] }) {
    const [selectedReq, setSelectedReq] = useState<LegalRequirement | null>(null);

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div className="space-y-4">
                    <Link href="/strategic" className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2 hover:opacity-100 transition-opacity">
                        <ArrowLeft size={10} /> Назад к обзору
                    </Link>
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={40} className="text-[#FF005C]" />
                        <h1 className="text-5xl font-light tracking-tight">Юридический Контур</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-light">{requirements.length}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-40">Требований контроля</div>
                </div>
            </section>

            {/* Requirements List */}
            <section className="space-y-4">
                <div className="grid grid-cols-12 px-6 py-2 text-[10px] uppercase tracking-widest opacity-40 font-medium">
                    <div className="col-span-5">Нормативное требование</div>
                    <div className="col-span-3 text-center">Объект контроля</div>
                    <div className="col-span-2 text-center">Статус комплаенса</div>
                    <div className="col-span-2 text-right">Версия</div>
                </div>

                <div className="space-y-1">
                    {requirements.map((req) => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedReq(req)}
                            className="grid grid-cols-12 items-center px-6 py-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
                        >
                            <div className="col-span-5">
                                <div className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                                    {req.summary}
                                </div>
                                <div className="text-[9px] opacity-30 mt-0.5 font-mono">ID: {req.id}</div>
                            </div>
                            <div className="col-span-3 flex justify-center">
                                <span className="text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded bg-white/5 opacity-60">
                                    {req.target}
                                </span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={req.status} className="text-[9px] min-w-[80px] justify-center" />
                            </div>
                            <div className="col-span-2 flex justify-end items-center gap-3">
                                <span className="text-[10px] opacity-40 font-mono">{req.version}</span>
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Detail Overlay */}
            <DetailOverlay
                isOpen={!!selectedReq}
                onClose={() => setSelectedReq(null)}
                title={selectedReq?.summary || ''}
                subtitle="Интерпретация и комплаенс-карта нормы"
            >
                {selectedReq && (
                    <div className="space-y-10">
                        {/* Norm Metadata */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex items-start gap-4">
                                <Scale size={20} className="text-white/40 mt-1" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest opacity-40">Юридическая норма</div>
                                    <div className="text-sm font-medium mt-1">EU Regulation 2024/RND-Security</div>
                                    <p className="text-xs opacity-60 leading-relaxed mt-2">
                                        Статья 14, Параграф 3: Обязательная верификация протоколов экспериментов с активным воздействием на почву.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Explanation Layer */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest opacity-40 font-medium">Текущее обоснование</h3>
                            <ExplanationLayer
                                reasons={[
                                    {
                                        type: selectedReq.status === 'OK' ? 'INFO' : 'LEGAL',
                                        title: `Результат проверки: ${selectedReq.status}`,
                                        description: selectedReq.status === 'OK'
                                            ? 'Все связанные объекты прошли автоматический и ручной аудит соответствия.'
                                            : 'Зафиксировано отсутствие утвержденного протокола в 2 связанных экспериментах.',
                                        ref: selectedReq.id,
                                        version: selectedReq.version
                                    },
                                    {
                                        type: 'RISK',
                                        title: 'Потенциальные санкции',
                                        description: 'При сохранении текущего статуса возможен штраф до 2% от годового оборота подразделения согласно параграфу 18.2.',
                                        ref: 'SANCTION-MOD-1'
                                    }
                                ]}
                            />
                        </div>

                        {/* Obligations */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest opacity-40 font-medium">Активные обязательства</h3>
                            <div className="space-y-2">
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="opacity-40" />
                                        <div className="text-xs">Ежеквартальный отчет об экологическом воздействии</div>
                                    </div>
                                    <StateBadge state="OK" className="text-[8px]" />
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={16} className="text-[#FFD600]" />
                                        <div className="text-xs">Обновление сертификата на семена</div>
                                    </div>
                                    <StateBadge state="ATTENTION" label="Overdue" className="text-[8px]" />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </DetailOverlay>
        </div>
    );
}

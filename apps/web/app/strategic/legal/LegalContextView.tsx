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
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div className="space-y-4">
                    <Link href="/strategic" className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2 hover:text-black transition-colors font-medium">
                        <ArrowLeft size={10} /> Назад к обзору
                    </Link>
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={40} className="text-[#D4004F]" />
                        <h1 className="text-5xl font-light tracking-tight text-gray-900">Юридический Контур</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-light text-gray-900">{requirements.length}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Требований контроля</div>
                </div>
            </section>

            {/* Requirements List */}
            <section className="space-y-2">
                <div className="grid grid-cols-12 px-8 py-3 text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-black/5">
                    <div className="col-span-5">Нормативное требование</div>
                    <div className="col-span-3 text-center">Объект контроля</div>
                    <div className="col-span-2 text-center">Статус комплаенса</div>
                    <div className="col-span-2 text-right">Версия</div>
                </div>

                <div className="space-y-2 pt-2">
                    {requirements.map((req) => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedReq(req)}
                            className="grid grid-cols-12 items-center px-8 py-5 bg-white border border-black/5 rounded-2xl hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group"
                        >
                            <div className="col-span-5">
                                <div className="text-[15px] font-medium tracking-tight text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                                    {req.summary}
                                </div>
                                <div className="text-[10px] text-gray-300 mt-1 font-mono font-medium">ИДЕНТИФИКАТОР: {req.id}</div>
                            </div>
                            <div className="col-span-3 flex justify-center">
                                <span className="text-[10px] uppercase tracking-tight px-3 py-1 rounded-full bg-gray-50 text-gray-500 font-medium">
                                    {req.target}
                                </span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <StateBadge state={req.status} className="text-[9px] min-w-[90px] justify-center py-1.5" />
                            </div>
                            <div className="col-span-2 flex justify-end items-center gap-3">
                                <span className="text-[10px] text-gray-300 font-mono font-medium">{req.version}</span>
                                <ChevronRight size={16} className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
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
                        <div className="p-8 rounded-3xl bg-gray-50 border border-black/5 space-y-4">
                            <div className="flex items-start gap-4">
                                <Scale size={20} className="text-gray-300 mt-1" />
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Юридическая норма</div>
                                    <div className="text-[15px] font-medium mt-1 text-gray-900">EU Regulation 2024/RND-Security</div>
                                    <p className="text-sm text-gray-500 leading-relaxed mt-2">
                                        Статья 14, Параграф 3: Обязательная верификация протоколов экспериментов с активным воздействием на почву.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Explanation Layer */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold ml-2">Текущее обоснование</h3>
                            <ExplanationLayer
                                reasons={[
                                    {
                                        type: selectedReq.status === 'OK' ? 'INFO' : 'LEGAL',
                                        title: `Результат проверки: ${selectedReq.status === 'OK' ? 'СООТВЕТСТВУЕТ' : 'ВНИМАНИЕ'}`,
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
                            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold ml-2">Активные обязательства</h3>
                            <div className="space-y-2">
                                <div className="p-5 rounded-2xl border border-black/5 bg-white flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-gray-300" />
                                        <div className="text-[13px] text-gray-900 font-medium">Ежеквартальный отчет об экологическом воздействии</div>
                                    </div>
                                    <StateBadge state="OK" className="text-[8px] py-1" />
                                </div>
                                <div className="p-5 rounded-2xl border border-black/5 bg-white flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={16} className="text-[#B29700]" />
                                        <div className="text-[13px] text-gray-900 font-medium">Обновление сертификата на семена</div>
                                    </div>
                                    <StateBadge state="ATTENTION" label="Просрочено" className="text-[8px] py-1" />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </DetailOverlay>
        </div>
    );
}

import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { strategicApi } from '@/lib/api/strategic';
import { StateBadge } from '@/components/strategic/StateBadge';
import { ExplanationLayer } from '@/components/strategic/ExplanationLayer';
import { Scale, Beaker, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

async function getStrategicData() {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    return await strategicApi.getGlobalState(token);
}


const RISK_LABELS: Record<string, string> = {
    'BLOCKED': 'БЛОКИРОВАН',
    'CRITICAL': 'КРИТИЧЕСКИЙ',
    'ELEVATED': 'ПОВЫШЕННЫЙ',
    'OBSERVED': 'НАБЛЮДАЕМЫЙ',
    'CLEAR': 'В НОРМЕ',
    'RESOLVED': 'РАЗРЕШЕН'
};

export default async function GlobalStatePage() {
    const data = await getStrategicData();

    if (!data) {
        redirect('/login');
    }

    return (
        <div className="space-y-20">
            {/* 1. System Health (Hero Section) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-black" />
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">
                        Общее состояние системы
                    </h2>
                </div>

                <div className="flex items-center gap-8">
                    <h1 className="text-7xl font-light tracking-tight text-gray-900 border-none p-0 bg-transparent">
                        {data.overall === 'OK' ? 'Система стабильна' : 'Требуется внимание'}
                    </h1>
                    <StateBadge
                        state={data.overall}
                        label={data.overall === 'OK' ? 'АКТИВНА' : 'ВНИМАНИЕ'}
                        className="px-6 py-2.5 text-xs shadow-none border-gray-100"
                    />
                </div>
            </section>

            {/* 2. Active Constraints (Grid) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Legal Block */}
                <div className="bg-white p-10 space-y-8 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5 rounded-[2.5rem] border border-black/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10">
                        <div className="text-right">
                            <div className="text-3xl font-light text-gray-900">{data.constraints.legal}</div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-300 font-medium">Активных норм</div>
                        </div>
                    </div>
                    <div className="space-y-6 pt-12">
                        <Scale size={32} className="text-gray-300 group-hover:text-[#D4004F] transition-all duration-300" />
                        <div>
                            <h3 className="text-xl font-medium text-gray-900">Юридический контур</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mt-3">
                                Непрерывный анализ правовых актов, санкционного давления и регуляторных требований.
                            </p>
                        </div>
                    </div>
                    <Link href="/strategic/legal" className="text-[10px] uppercase tracking-widest text-gray-400 font-medium flex items-center gap-2 group-hover:text-black transition-colors">
                        Детальный анализ <ArrowRight size={12} />
                    </Link>
                </div>

                {/* R&D Block */}
                <div className="bg-white p-10 space-y-8 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5 rounded-[2.5rem] border border-black/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10">
                        <div className="text-right">
                            <div className="text-3xl font-light text-gray-900">{data.constraints.rnd}</div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-300 font-medium">Блокировок</div>
                        </div>
                    </div>
                    <div className="space-y-6 pt-12">
                        <Beaker size={32} className="text-gray-300 group-hover:text-[#00A3A3] transition-all duration-300" />
                        <div>
                            <h3 className="text-xl font-medium text-gray-900">Научный контур</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mt-3">
                                Валидность протоколов, мониторинг экспериментов и защита научной целостности данных.
                            </p>
                        </div>
                    </div>
                    <Link href="/strategic/rd" className="text-[10px] uppercase tracking-widest text-gray-400 font-medium flex items-center gap-2 group-hover:text-black transition-colors">
                        Результаты триалов <ArrowRight size={12} />
                    </Link>
                </div>

                {/* Operations Block */}
                <div className="bg-white p-10 space-y-8 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5 rounded-[2.5rem] border border-black/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10">
                        <div className="text-right text-[#00854A]">
                            <div className="text-3xl font-light">БЕЗОПАСЕН</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-40 font-medium">Режим Ops</div>
                        </div>
                    </div>
                    <div className="space-y-6 pt-12">
                        <Zap size={32} className="text-gray-300 group-hover:text-[#B29700] transition-all duration-300" />
                        <div>
                            <h3 className="text-xl font-medium text-gray-900">Операционный контур</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mt-3">
                                Мониторинг исполнения полевых работ, готовности техники и расхода ресурсов.
                            </p>
                        </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-300 font-medium flex items-center gap-2 cursor-default">
                        Контроль активен
                    </div>
                </div>

            </section>

            {/* 3. Global Escalations / Why Section */}
            <section className="space-y-10">
                <div className="flex items-center gap-3 text-gray-400">
                    <ShieldAlert size={16} />
                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-medium">
                        Активные эскалации и обоснования
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3">
                        <ExplanationLayer
                            reasons={data.risk?.explanation?.signals?.map((s: any) => ({
                                type: s.source,
                                title: s.reasonCode,
                                description: s.description,
                                ref: s.refId,
                                version: '1.0'
                            })) || []}
                            className="bg-gray-50/50"
                        />
                    </div>

                    <div className="lg:col-span-2 p-10 rounded-[2.5rem] bg-white border border-black/5 flex flex-col justify-center items-center text-center space-y-6 shadow-sm">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Статус Риска</div>
                        <div className={clsx(
                            "text-5xl font-light tracking-tighter",
                            data.risk?.verdict === 'BLOCKED' ? 'text-[#D4004F]' : 'text-gray-900'
                        )}>
                            {RISK_LABELS[data.risk?.explanation?.fsmState] || 'НЕИЗВЕСТНО'}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-300 font-medium max-w-[200px] leading-relaxed">
                            Сводная оценка осознанности по всем контурам системы
                        </div>
                        {data.risk?.explanation?.previous && (
                            <div className="text-[9px] uppercase tracking-widest text-gray-400 font-medium px-3 py-1 bg-gray-50 rounded-full">
                                Предыдущее состояние: {RISK_LABELS[data.risk.explanation.previous] || data.risk.explanation.previous}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

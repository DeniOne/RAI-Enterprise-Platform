import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { strategicApi } from '@/lib/api/strategic';
import { StateBadge } from '@/components/strategic/StateBadge';
import { ExplanationLayer } from '@/components/strategic/ExplanationLayer';
import { AdvisoryRadar } from '@/components/strategic/AdvisoryRadar';
import { Scale, Beaker, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

async function getStrategicData(token: string) {
    return await strategicApi.getGlobalState(token);
}

async function getAdvisoryData(token: string) {
    // For MVP we use 'current' or get first company ID if multi-tenant
    // Assuming hardcoded '1' for now per backend pattern or just use a generic ID
    return await strategicApi.getCompanyHealth('1', token);
}

export default async function GlobalStatePage() {
    const token = cookies().get('auth_token')?.value;
    if (!token) redirect('/login');

    const [data, advisory] = await Promise.all([
        getStrategicData(token),
        getAdvisoryData(token)
    ]);

    return (
        <div className="space-y-16">
            {/* 1. System Health (Hero Section) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-1 h-6 bg-white/20" />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-medium">
                        Общее состояние системы
                    </h2>
                </div>

                <div className="flex items-baseline gap-6">
                    <h1 className="text-7xl font-light tracking-tighter">
                        {data.overall === 'OK' ? 'Система стабильна' : 'Требуется внимание'}
                    </h1>
                    <StateBadge state={data.overall} label={data.overall === 'OK' ? 'Active' : 'Warning'} className="px-6 py-2 text-xs" />
                </div>
            </section>

            {/* 2. Active Constraints (Grid) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1 bg-white/5 rounded-2xl overflow-hidden border border-white/5">

                {/* Legal Block */}
                <div className="bg-[#050505] p-8 space-y-6 flex flex-col justify-between group transition-colors hover:bg-white/[0.01]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Scale size={32} className="opacity-20 group-hover:opacity-100 group-hover:text-[#FF005C] transition-all" />
                            <div className="text-right">
                                <div className="text-2xl font-light">{data.constraints.legal}</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-40">Ограничений</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">Юридический контур</h3>
                            <p className="text-sm opacity-60 leading-relaxed mt-2">
                                Анализ применимых норм, санкций и регуляторных требований в реальном времени.
                            </p>
                        </div>
                    </div>
                    <Link href="/strategic/legal" className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2 group-hover:opacity-100 transition-opacity">
                        Подробнее <ArrowRight size={10} />
                    </Link>
                </div>

                {/* R&D Block */}
                <div className="bg-[#050505] p-8 space-y-6 flex flex-col justify-between group transition-colors hover:bg-white/[0.01]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Beaker size={32} className="opacity-20 group-hover:opacity-100 group-hover:text-[#00F0FF] transition-all" />
                            <div className="text-right">
                                <div className="text-2xl font-light">{data.constraints.rnd}</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-40">Блокировок</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">Научный (R&D) контур</h3>
                            <p className="text-sm opacity-60 leading-relaxed mt-2">
                                Мониторинг экспериментов, валидность протоколов и целостность научных данных.
                            </p>
                        </div>
                    </div>
                    <Link href="/strategic/rd" className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2 group-hover:opacity-100 transition-opacity">
                        Подробнее <ArrowRight size={10} />
                    </Link>
                </div>

                {/* Operations Block */}
                <div className="bg-[#050505] p-8 space-y-6 flex flex-col justify-between group transition-colors hover:bg-white/[0.01]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Zap size={32} className="opacity-20 group-hover:opacity-100 group-hover:text-[#FFD600] transition-all" />
                            <div className="text-right">
                                <div className="text-2xl font-light">SAFE</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-40">Режим</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">Операционный (Ops) контур</h3>
                            <p className="text-sm opacity-60 leading-relaxed mt-2">
                                Агрегированное состояние полевых работ, техкарт и ресурсов предприятия.
                            </p>
                        </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest opacity-20 flex items-center gap-2 cursor-not-allowed">
                        Мониторинг активен
                    </div>
                </div>

            </section>

            {/* Advisory Engine (Strategic Insights) */}
            <section className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-1 h-6 bg-white/20" />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-medium">
                        Advisory Engine (Read-Model)
                    </h2>
                </div>
                <AdvisoryRadar
                    score={advisory.score}
                    level={advisory.level}
                    trend={advisory.trend}
                    sources={advisory.sources}
                    message={advisory.message}
                    confidence={advisory.confidence}
                />
            </section>

            {/* 3. Global Escalations / Why Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 opacity-40">
                    <ShieldAlert size={16} />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] font-medium">
                        Активные эскалации и объяснения
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ExplanationLayer
                        reasons={[
                            {
                                type: 'LEGAL',
                                title: 'Задержка валидации протоколов',
                                description: '3 эксперимента ожидают подтверждения от юридического отдела в связи с обновлением EU 2024/RND.',
                                ref: 'B5-LGL-01',
                                version: '2.4.0'
                            },
                            {
                                type: 'RISK',
                                title: 'Повышенная бюджетная нагрузка',
                                description: 'Burn Rate превысил нормативный порог в контуре B3 на 12%.',
                                ref: 'B3-FIN-01'
                            }
                        ]}
                    />

                    <div className="p-8 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
                        <div className="text-[10px] uppercase tracking-[0.2em] opacity-40">Risk Awareness</div>
                        <div className="text-4xl font-light">НИЗКИЙ</div>
                        <div className="text-[9px] uppercase tracking-widest opacity-20">Сводный риск по всем контурам</div>
                    </div>
                </div>
            </section>
        </div>
    );
}

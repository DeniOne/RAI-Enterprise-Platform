'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';

export default function ConsultingDashboard() {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((prev) => prev + 1), 5000);
        return () => clearInterval(timer);
    }, []);

    const metrics = useMemo(() => {
        const a = Math.sin(tick / 2);
        const b = Math.cos(tick / 3);
        return {
            plans: 36 + Math.round(a),
            techmaps: 110 + Math.round(b * 2),
            deviations: 7 + (tick % 2),
            execution: 81 + Math.round(a * 2),
            margin: 23 + Math.round(b),
        };
    }, [tick]);

    const trend = useMemo(
        () =>
            new Array(20).fill(0).map((_, i) => {
                const base = 54 + i * 1.4;
                const noise = Math.sin((tick + i) / 2) * 3 + Math.cos((tick + i) / 4) * 2;
                return Math.max(28, Math.min(90, Math.round(base + noise)));
            }),
        [tick],
    );

    const trendPoints = trend.map((v, i) => `${(i / (trend.length - 1)) * 100},${100 - v}`).join(' ');
    const tickerItems = [
        { label: 'LIVE', href: '/consulting/dashboard' },
        { label: 'test-company-1', href: '/consulting/crm/farms' },
        { label: `Планы: ${metrics.plans}`, href: '/consulting/plans/active' },
        { label: `Техкарты: ${metrics.techmaps}`, href: '/consulting/techmaps/active' },
        { label: `Отклонения: ${metrics.deviations}`, href: '/consulting/deviations/detected', critical: true },
        { label: `Исполнение: ${metrics.execution}%`, href: '/consulting/execution' },
        { label: `Маржа: ${metrics.margin}%`, href: '/consulting/results/performance' },
        { label: `Влажность почвы: ${41 + (tick % 3)}%` },
        { label: `Ветер: ${7 + (tick % 4)} м/с` },
    ];

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-medium text-gray-900">Обзор — Управление Урожаем</h1>
                <p className="text-sm text-gray-500 mt-1">Оперативная сводка по компании test-company-1 в реальном времени.</p>
            </div>

            <Card className="py-3">
                <div className="overflow-hidden whitespace-nowrap">
                    <div className="inline-block min-w-full animate-[ticker_26s_linear_infinite] text-sm text-gray-600">
                        {tickerItems.map((item, idx) =>
                            item.href ? (
                                <Link
                                    key={`${item.label}-${idx}`}
                                    href={item.href}
                                    className={`mr-8 underline-offset-2 hover:underline ${
                                        item.critical ? 'text-red-600 font-medium' : ''
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span key={`${item.label}-${idx}`} className="mr-8">
                                    {item.label}
                                </span>
                            ),
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <Card className="xl:col-span-9">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <MetricCard title="Активные планы" value={metrics.plans} delta="+2.4%" up href="/consulting/plans/active" />
                        <MetricCard title="Техкарты в работе" value={metrics.techmaps} delta="+1.1%" up href="/consulting/techmaps/active" />
                        <MetricCard title="Отклонения" value={metrics.deviations} delta="-0.7%" up={false} href="/consulting/deviations/detected" />
                        <MetricCard title="Исполнение" value={`${metrics.execution}%`} delta="+3.3%" up href="/consulting/execution" />
                        <MetricCard title="Маржа" value={`${metrics.margin}%`} delta="+0.8%" up href="/consulting/results/performance" />
                    </div>

                    <div className="rounded-2xl border border-black/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">План vs факт (24 часа)</p>
                            <p className="text-xs text-emerald-600">Trend: stable growth</p>
                        </div>
                        <svg viewBox="0 0 100 100" className="w-full h-52">
                            <polyline fill="none" stroke="rgb(14 165 233)" strokeWidth="1.8" points={trendPoints} />
                            <polyline
                                fill="none"
                                stroke="rgb(16 185 129)"
                                strokeWidth="1.2"
                                points={trend
                                    .map((v, i) => `${(i / (trend.length - 1)) * 100},${100 - Math.max(20, v - 7)}`)
                                    .join(' ')}
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="xl:col-span-3">
                    <h2 className="text-base font-medium text-gray-900 mb-3">Алерты и события</h2>
                    <div className="space-y-2">
                        <AlertRow tone="critical" text="Поле #A-17: риск потери урожайности > 12%" href="/consulting/deviations/detected?entity=DEV-001" />
                        <AlertRow tone="warning" text="Техкарта #TM-044: сдвиг сроков внесения" href="/consulting/techmaps/active?entity=TM-001" />
                        <AlertRow tone="warning" text="Склад СЗР: остаток ниже порога по 2 позициям" href="/consulting/crm/history?entity=ACTIVE" />
                        <AlertRow tone="info" text="Решение #D-118 применено, статус: в мониторинге" href="/consulting/deviations/decisions?entity=DEC-101" />
                    </div>
                </Card>

                <Card className="xl:col-span-12 py-3">
                    <div className="overflow-hidden whitespace-nowrap rounded-xl bg-gray-50 border border-black/5 px-3 py-2">
                        <div className="inline-block min-w-full animate-[ticker_30s_linear_infinite_reverse] text-xs text-gray-500">
                            <span className="px-3">SOIL {39 + (tick % 5)}%</span>
                            <span className="px-3">NDVI {0.58 + (tick % 4) * 0.01}</span>
                            <span className="px-3">TASKS DONE {75 + (tick % 7)}%</span>
                            <span className="px-3">AVG COST {14200 + tick * 8} RUB/ha</span>
                            <span className="px-3">YIELD FCST {42 + (tick % 3)} c/ha</span>
                            <span className="px-3">SOIL {39 + (tick % 5)}%</span>
                            <span className="px-3">NDVI {0.58 + (tick % 4) * 0.01}</span>
                        </div>
                    </div>
                </Card>

                <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard title="Поля в норме" value="74%" tone="ok" href="/consulting/crm/fields?filter=ok" />
                    <StatusCard title="Поля с риском" value="18%" tone="warn" href="/consulting/deviations/analysis?filter=risk" />
                    <StatusCard title="Критические зоны" value="8%" tone="critical" href="/consulting/deviations/detected?severity=critical" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes ticker {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div>
    );
}

function MetricCard({ title, value, delta, up, href }: { title: string; value: string | number; delta: string; up: boolean; href: string }) {
    return (
        <Link href={href} className="rounded-xl border border-black/10 p-3 bg-white hover:border-black/25 transition-colors block">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">{title}</p>
            <p className="text-3xl text-gray-900 mt-1">{value}</p>
            <p className={`text-xs mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>{delta}</p>
        </Link>
    );
}

function AlertRow({ tone, text, href }: { tone: 'critical' | 'warning' | 'info'; text: string; href: string }) {
    const classes =
        tone === 'critical'
            ? 'border-red-200 bg-red-50 text-red-700'
            : tone === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-sky-200 bg-sky-50 text-sky-700';

    return (
        <Link href={href} className={`rounded-xl border px-3 py-2 text-xs ${classes} block hover:brightness-95 transition`}>
            {text}
        </Link>
    );
}

function StatusCard({ title, value, tone, href }: { title: string; value: string; tone: 'ok' | 'warn' | 'critical'; href: string }) {
    const classes =
        tone === 'ok'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : tone === 'warn'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-red-800';

    return (
        <Link href={href}>
            <Card className={`${classes} hover:brightness-95 transition`}>
            <p className="text-xs uppercase tracking-[0.12em]">{title}</p>
            <p className="text-4xl mt-1">{value}</p>
            </Card>
        </Link>
    );
}

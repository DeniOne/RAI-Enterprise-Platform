'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { formatRolloutModeLabel, formatRunbookActionLabel, formatSeverityLabel, formatStatusLabel } from '@/lib/ui-language';

type GenerationRolloutSummary = {
    totalRapeseedMaps: number;
    strategies: {
        legacyBlueprint: number;
        blueprintFallback: number;
        canonicalSchema: number;
        unknown: number;
    };
    rolloutModes: {
        legacy: number;
        shadow: number;
        canonical: number;
        unknown: number;
    };
    fallback: {
        usedCount: number;
        reasons: Record<string, number>;
    };
    metadataCoverage: {
        versionPinnedCount: number;
        generationTraceCount: number;
        explainabilityTraceCount: number;
        fieldAdmissionCount: number;
        featureFlagSnapshotCount: number;
    };
    parity: {
        mapsWithReport: number;
        mapsWithBlockingDiffs: number;
        mapsWithoutDiffs: number;
        diffCounts: {
            P0: number;
            P1: number;
            P2: number;
        };
    };
    rolloutIncidents?: Array<{
        id: string;
        subtype?: string | null;
        severity: string;
        status: string;
        traceId?: string | null;
        techMapId?: string | null;
        runbookSuggestedAction?: string | null;
        createdAt?: string;
    }>;
};

type GenerationRolloutReadiness = {
    verdict: 'BLOCKED' | 'WARN' | 'PASS';
    canEnableCanonicalDefault: boolean;
    suggestedMode: 'shadow' | 'canonical';
    blockers: string[];
    warnings: string[];
    releaseGates: {
        parityBlockingClear: boolean;
        fallbackContained: boolean;
        versionPinningComplete: boolean;
        explainabilityCoverageComplete: boolean;
        admissionCoverageComplete: boolean;
        canonicalMapsPresent: boolean;
        noOpenParityIncidents: boolean;
    };
};

type GenerationRolloutCutoverPacket = {
    companyId: string;
    verdict: 'BLOCKED' | 'WARN' | 'PASS';
    canExecuteCutover: boolean;
    currentFeatureFlags: {
        mode: string;
        companyFilter: string;
    };
    recommendedFeatureFlags: {
        mode: string;
        companyFilter: string;
    };
    releaseCommand: string;
    rollbackCommand: string;
    checklist: string[];
    rollbackChecklist: string[];
};

export default function ConsultingDashboard() {
    const [tick, setTick] = useState(0);
    const [rolloutSummary, setRolloutSummary] = useState<GenerationRolloutSummary | null>(null);
    const [rolloutReadiness, setRolloutReadiness] = useState<GenerationRolloutReadiness | null>(null);
    const [cutoverPacket, setCutoverPacket] = useState<GenerationRolloutCutoverPacket | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setTick((prev) => prev + 1), 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [summaryResponse, readinessResponse, cutoverPacketResponse] = await Promise.all([
                    api.consulting.techmaps.generationRolloutSummary(),
                    api.consulting.techmaps.generationRolloutReadiness(),
                    api.consulting.techmaps.generationRolloutCutoverPacket(),
                ]);
                setRolloutSummary(summaryResponse.data ?? null);
                setRolloutReadiness(readinessResponse.data ?? null);
                setCutoverPacket(cutoverPacketResponse.data ?? null);
            } catch (error) {
                console.error('Не удалось загрузить сводку по развёртыванию:', error);
            }
        };

        load();
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
        { label: 'В эфире', href: '/consulting/dashboard' },
        { label: 'Тестовая компания 1', href: '/consulting/crm/farms' },
        { label: `Планы: ${metrics.plans}`, href: '/consulting/plans/active' },
        { label: `Техкарты: ${metrics.techmaps}`, href: '/consulting/techmaps/active' },
        { label: `Отклонения: ${metrics.deviations}`, href: '/consulting/deviations/detected', critical: true },
        { label: `Исполнение: ${metrics.execution}%`, href: '/consulting/execution' },
        { label: `Маржа: ${metrics.margin}%`, href: '/consulting/results/performance' },
        { label: `Влажность почвы: ${41 + (tick % 3)}%` },
        { label: `Ветер: ${7 + (tick % 4)} м/с` },
    ];
    const rolloutAlerts = buildRolloutAlerts(rolloutSummary);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-medium text-gray-900">Обзор — Управление Урожаем</h1>
                <p className="mt-1 text-sm font-normal text-gray-500">Оперативная сводка по компании «Тестовая компания 1» в реальном времени.</p>
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
                            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">План и факт за 24 часа</p>
                            <p className="text-xs text-emerald-600">Тренд: стабильный рост</p>
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
                        {rolloutAlerts.map((item) => (
                            <AlertRow key={`${item.tone}-${item.text}`} tone={item.tone} text={item.text} href={item.href} />
                        ))}
                        <AlertRow tone="critical" text="Поле #A-17: риск потери урожайности > 12%" href="/consulting/deviations/detected?entity=DEV-001" />
                        <AlertRow tone="warning" text="Техкарта #TM-044: сдвиг сроков внесения" href="/consulting/techmaps/active?entity=TM-001" />
                        <AlertRow tone="warning" text="Склад СЗР: остаток ниже порога по 2 позициям" href="/consulting/crm/history?entity=ACTIVE" />
                        <AlertRow tone="info" text="Решение #D-118 применено, статус: в мониторинге" href="/consulting/deviations/decisions?entity=DEC-101" />
                    </div>
                </Card>

                {rolloutSummary && (
                    <Card className="xl:col-span-12">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Состояние перевода на новый режим</p>
                                <p className="text-base font-medium text-gray-900 mt-1">
                                    канонический режим {rolloutSummary.strategies.canonicalSchema} • резервный сценарий {rolloutSummary.fallback.usedCount} • блокирующие расхождения {rolloutSummary.parity.mapsWithBlockingDiffs}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    зафиксированные версии {rolloutSummary.metadataCoverage.versionPinnedCount}/{rolloutSummary.totalRapeseedMaps} • трассировка обоснования {rolloutSummary.metadataCoverage.explainabilityTraceCount}/{rolloutSummary.totalRapeseedMaps}
                                </p>
                                {rolloutReadiness && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                            rolloutReadiness.verdict === 'PASS'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : rolloutReadiness.verdict === 'WARN'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                            готовность {translateReadinessVerdict(rolloutReadiness.verdict)}
                                        </span>
                                        <span className='px-2.5 py-1 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                                            рекомендуемый режим {formatRolloutModeLabel(rolloutReadiness.suggestedMode)}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                            rolloutReadiness.canEnableCanonicalDefault
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {rolloutReadiness.canEnableCanonicalDefault ? 'канонический режим по умолчанию можно включать' : 'канонический режим по умолчанию пока нельзя включать'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/consulting/techmaps" className="px-3 py-2 rounded-xl border border-black/10 text-xs font-medium hover:bg-gray-50">
                                    Открыть реестр развёртывания
                                </Link>
                                <Link href="/consulting/techmaps/active" className="px-3 py-2 rounded-xl border border-black/10 text-xs font-medium hover:bg-gray-50">
                                    Активные техкарты
                                </Link>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <CutoverMetric
                                title="Режим развёртывания"
                                value={`теневой ${rolloutSummary.rolloutModes.shadow} • канонический ${rolloutSummary.rolloutModes.canonical}`}
                                tone={rolloutSummary.rolloutModes.shadow > 0 ? 'warn' : 'ok'}
                            />
                            <CutoverMetric
                                title="Серьёзность расхождений"
                                value={`P0 ${rolloutSummary.parity.diffCounts.P0} • P1 ${rolloutSummary.parity.diffCounts.P1} • P2 ${rolloutSummary.parity.diffCounts.P2}`}
                                tone={rolloutSummary.parity.diffCounts.P0 > 0 ? 'critical' : rolloutSummary.parity.diffCounts.P1 > 0 ? 'warn' : 'ok'}
                            />
                            <CutoverMetric
                                title="Причины резервного сценария"
                                value={Object.entries(rolloutSummary.fallback.reasons).length === 0
                                    ? 'не использовались'
                                    : Object.entries(rolloutSummary.fallback.reasons).map(([reason, count]) => `${reason}: ${count}`).join(' • ')}
                                tone={rolloutSummary.fallback.usedCount > 0 ? 'warn' : 'ok'}
                            />
                            <CutoverMetric
                                title="Покрытие"
                                value={`допуск ${rolloutSummary.metadataCoverage.fieldAdmissionCount} • трассировка ${rolloutSummary.metadataCoverage.generationTraceCount}`}
                                tone={rolloutSummary.metadataCoverage.versionPinnedCount < rolloutSummary.totalRapeseedMaps ? 'warn' : 'ok'}
                            />
                        </div>
                        {rolloutReadiness && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-black/5 bg-gray-50 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Блокеры</p>
                                    <div className="mt-2 space-y-1">
                                        {rolloutReadiness.blockers.length === 0 ? (
                                            <p className="text-sm text-emerald-700">Блокеров нет.</p>
                                        ) : (
                                            rolloutReadiness.blockers.map((item) => (
                                                <p key={item} className="text-sm text-rose-700">{item}</p>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-black/5 bg-gray-50 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Предупреждения</p>
                                    <div className="mt-2 space-y-1">
                                        {rolloutReadiness.warnings.length === 0 ? (
                                            <p className="text-sm text-emerald-700">Предупреждений нет.</p>
                                        ) : (
                                            rolloutReadiness.warnings.map((item) => (
                                                <p key={item} className="text-sm text-amber-700">{item}</p>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {(rolloutSummary.rolloutIncidents || []).length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-gray-500">Сохранённые инциденты развёртывания</p>
                                {(rolloutSummary.rolloutIncidents || []).slice(0, 3).map((incident) => (
                                    <div key={incident.id} className="rounded-xl border border-black/5 bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            {incident.subtype || '-'} • {formatSeverityLabel(incident.severity)} • {formatStatusLabel(incident.status)}
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {incident.techMapId ? `Техкарта ${incident.techMapId}` : 'Инцидент развёртывания по компании'}
                                            {incident.runbookSuggestedAction ? ` • действие ${formatRunbookActionLabel(incident.runbookSuggestedAction)}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {cutoverPacket && (
                            <div className="mt-4 rounded-xl border border-black/5 bg-gray-50 p-3">
                                <p className="text-[11px] uppercase tracking-wider text-gray-500">Пакет перевода</p>
                                <p className="text-sm text-gray-700 mt-2">
                                    Компания {cutoverPacket.companyId} • вердикт {translateReadinessVerdict(cutoverPacket.verdict)}
                                </p>
                                <code className="block mt-2 text-xs text-gray-800 break-all">{cutoverPacket.releaseCommand}</code>
                                <code className="block mt-2 text-xs text-gray-500 break-all">{cutoverPacket.rollbackCommand}</code>
                            </div>
                        )}
                    </Card>
                )}

                <Card className="xl:col-span-12 py-3">
                    <div className="overflow-hidden whitespace-nowrap rounded-xl bg-gray-50 border border-black/5 px-3 py-2">
                        <div className="inline-block min-w-full animate-[ticker_30s_linear_infinite_reverse] text-xs text-gray-500">
                            <span className="px-3">ПОЧВА {39 + (tick % 5)}%</span>
                            <span className="px-3">NDVI {0.58 + (tick % 4) * 0.01}</span>
                            <span className="px-3">ЗАДАЧ ВЫПОЛНЕНО {75 + (tick % 7)}%</span>
                            <span className="px-3">СРЕДНЯЯ СТОИМОСТЬ {14200 + tick * 8} RUB/га</span>
                            <span className="px-3">ПРОГНОЗ УРОЖАЙНОСТИ {42 + (tick % 3)} ц/га</span>
                            <span className="px-3">ПОЧВА {39 + (tick % 5)}%</span>
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

function CutoverMetric({
    title,
    value,
    tone,
}: {
    title: string;
    value: string;
    tone: 'ok' | 'warn' | 'critical';
}) {
    const classes =
        tone === 'ok'
            ? 'border-emerald-200 bg-emerald-50'
            : tone === 'warn'
              ? 'border-amber-200 bg-amber-50'
              : 'border-rose-200 bg-rose-50';

    return (
        <div className={`rounded-xl border p-3 ${classes}`}>
            <p className="text-[11px] uppercase tracking-wider text-gray-500">{title}</p>
            <p className="text-sm text-gray-800 mt-1">{value}</p>
        </div>
    );
}

function buildRolloutAlerts(summary: GenerationRolloutSummary | null) {
    if (!summary) {
        return [];
    }

    const alerts: Array<{
        tone: 'critical' | 'warning' | 'info';
        text: string;
        href: string;
    }> = [];

    if (summary.parity.mapsWithBlockingDiffs > 0) {
        alerts.push({
            tone: 'critical',
            text: `Перевод: ${summary.parity.mapsWithBlockingDiffs} карт с блокирующими расхождениями`,
            href: '/consulting/techmaps',
        });
    }

    if (summary.fallback.usedCount > 0) {
        alerts.push({
            tone: 'warning',
            text: `Перевод: резервный сценарий использован ${summary.fallback.usedCount} раз`,
            href: '/consulting/techmaps',
        });
    }

    if (summary.metadataCoverage.versionPinnedCount < summary.totalRapeseedMaps) {
        alerts.push({
            tone: 'warning',
            text: `Перевод: неполная фиксация версий ${summary.metadataCoverage.versionPinnedCount}/${summary.totalRapeseedMaps}`,
            href: '/consulting/techmaps',
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            tone: 'info',
            text: 'Перевод: канонический режим без критичных сигналов',
            href: '/consulting/techmaps',
        });
    }

    return alerts;
}

function translateReadinessVerdict(verdict: 'BLOCKED' | 'WARN' | 'PASS') {
    if (verdict === 'PASS') return 'пройдено';
    if (verdict === 'WARN') return 'внимание';
    return 'блокировано';
}

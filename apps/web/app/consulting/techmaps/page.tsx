'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { formatRolloutModeLabel, formatRunbookActionLabel, formatSeverityLabel, formatStatusLabel } from '@/lib/ui-language';

type TechMap = {
    id: string;
    status: string;
    version?: number;
    crop?: string;
    cropForm?: string | null;
    canonicalBranch?: string | null;
    harvestPlanId?: string;
    seasonId?: string;
    updatedAt?: string;
    generationMetadata?: {
        generationStrategy?: string;
        rolloutMode?: string;
        fallbackUsed?: boolean;
        shadowParitySummary?: {
            hasBlockingDiffs?: boolean;
            diffCount?: number;
            severityCounts?: {
                P0?: number;
                P1?: number;
                P2?: number;
            };
        } | null;
    } | null;
};

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

function nextStatuses(current: string): string[] {
    if (current === 'DRAFT' || current === 'GENERATED_DRAFT') return ['REVIEW'];
    if (current === 'REVIEW') return ['APPROVED'];
    if (current === 'APPROVED') return ['ACTIVE'];
    if (current === 'ACTIVE') return ['ARCHIVED'];
    return [];
}

export default function TechMapsPage() {
    const [maps, setMaps] = useState<TechMap[]>([]);
    const [rolloutSummary, setRolloutSummary] = useState<GenerationRolloutSummary | null>(null);
    const [rolloutReadiness, setRolloutReadiness] = useState<GenerationRolloutReadiness | null>(null);
    const [cutoverPacket, setCutoverPacket] = useState<GenerationRolloutCutoverPacket | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchMaps = async () => {
        setLoading(true);
        try {
            const [response, rolloutResponse, readinessResponse, cutoverPacketResponse] = await Promise.all([
                api.consulting.techmaps.list(),
                api.consulting.techmaps.generationRolloutSummary(),
                api.consulting.techmaps.generationRolloutReadiness(),
                api.consulting.techmaps.generationRolloutCutoverPacket(),
            ]);
            setMaps(Array.isArray(response.data) ? response.data : []);
            setRolloutSummary(rolloutResponse.data ?? null);
            setRolloutReadiness(readinessResponse.data ?? null);
            setCutoverPacket(cutoverPacketResponse.data ?? null);
        } catch (error) {
            console.error('Не удалось загрузить техкарты:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const counters = useMemo(() => {
        const byStatus: Record<string, number> = {};
        maps.forEach((m) => {
            byStatus[m.status] = (byStatus[m.status] || 0) + 1;
        });
        return byStatus;
    }, [maps]);

    const handleTransition = async (id: string, status: string) => {
        setBusyId(id);
        try {
            await api.consulting.techmaps.transition(id, status);
            await fetchMaps();
        } catch (error: any) {
            console.error('Failed to transition techmap:', error);
            alert(error?.response?.data?.message || 'Ошибка перехода техкарты');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900 tracking-tight mb-1'>Технологические карты</h1>
                    <p className='text-sm font-normal text-gray-500'>Рабочий реестр техкарт с реальными статусными переходами.</p>
                </div>
                <Link href='/consulting/techmaps/new' className='text-sm text-blue-600 hover:underline'>
                    Подготовить техкарту
                </Link>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
                {['GENERATED_DRAFT', 'DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE'].map((status) => (
                    <Card key={status}>
                        <p className='text-xs text-gray-500 mb-1'>{formatStatusLabel(status)}</p>
                        <p className='text-2xl font-semibold'>{counters[status] || 0}</p>
                    </Card>
                ))}
            </div>

            {rolloutSummary && (
                <Card>
                    <div className='flex items-start justify-between gap-4 flex-wrap'>
                        <div>
                            <p className='text-xs text-gray-500 mb-1'>Наблюдаемость развёртывания</p>
                            <p className='text-sm text-gray-700'>
                                карт рапса: {rolloutSummary.totalRapeseedMaps} • канонических {rolloutSummary.strategies.canonicalSchema} • наследованных {rolloutSummary.strategies.legacyBlueprint}
                            </p>
                            {rolloutReadiness && (
                                <div className='mt-2 flex flex-wrap gap-2'>
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
                                        {rolloutReadiness.canEnableCanonicalDefault ? 'готово к каноническому режиму по умолчанию' : 'не готово к каноническому режиму по умолчанию'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            <span className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                                версий зафиксировано {rolloutSummary.metadataCoverage.versionPinnedCount}
                            </span>
                            <span className='px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium border border-sky-100'>
                                теневой режим {rolloutSummary.rolloutModes.shadow}
                            </span>
                            <span className='px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100'>
                                резервный сценарий {rolloutSummary.fallback.usedCount}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                rolloutSummary.parity.mapsWithBlockingDiffs > 0
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                                блокирующие расхождения {rolloutSummary.parity.mapsWithBlockingDiffs}
                            </span>
                        </div>
                    </div>
                    <div className='mt-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Распределение стратегий</p>
                                <p className='text-sm text-gray-700 mt-1'>
                                    каноническая {rolloutSummary.strategies.canonicalSchema} • наследованная {rolloutSummary.strategies.legacyBlueprint} • резервная {rolloutSummary.strategies.blueprintFallback}
                                </p>
                            </div>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Расхождения</p>
                            <p className='text-sm text-gray-700 mt-1'>
                                P0 {rolloutSummary.parity.diffCounts.P0} • P1 {rolloutSummary.parity.diffCounts.P1} • P2 {rolloutSummary.parity.diffCounts.P2}
                            </p>
                            </div>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Покрытие трассировкой</p>
                                <p className='text-sm text-gray-700 mt-1'>
                                    генерация {rolloutSummary.metadataCoverage.generationTraceCount} • обоснование {rolloutSummary.metadataCoverage.explainabilityTraceCount}
                                </p>
                            </div>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Причины резервного сценария</p>
                            <p className='text-sm text-gray-700 mt-1'>
                                {Object.entries(rolloutSummary.fallback.reasons).length === 0
                                    ? 'не использовались'
                                    : Object.entries(rolloutSummary.fallback.reasons)
                                        .map(([reason, count]) => `${reason}: ${count}`)
                                        .join(' • ')}
                            </p>
                        </div>
                    </div>
                    {(rolloutSummary.rolloutIncidents || []).length > 0 && (
                        <div className='mt-4 space-y-2'>
                            <p className='text-xs text-gray-500'>Сохранённые инциденты развёртывания</p>
                            {(rolloutSummary.rolloutIncidents || []).slice(0, 4).map((incident) => (
                                <div key={incident.id} className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                    <p className='text-xs text-gray-500'>
                                        {incident.subtype || '-'} • {formatSeverityLabel(incident.severity)} • {formatStatusLabel(incident.status)}
                                    </p>
                                    <p className='text-sm text-gray-700 mt-1'>
                                        {incident.techMapId ? `Техкарта ${incident.techMapId}` : 'Инцидент развёртывания по компании'}
                                        {incident.runbookSuggestedAction ? ` • действие ${formatRunbookActionLabel(incident.runbookSuggestedAction)}` : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    {rolloutReadiness && (
                        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Блокеры</p>
                                <div className='mt-2 space-y-1'>
                                    {rolloutReadiness.blockers.length === 0 ? (
                                        <p className='text-sm text-emerald-700'>Блокеров нет.</p>
                                    ) : (
                                        rolloutReadiness.blockers.map((item) => (
                                            <p key={item} className='text-sm text-rose-700'>{item}</p>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                <p className='text-[11px] uppercase tracking-wider text-gray-500'>Предупреждения</p>
                                <div className='mt-2 space-y-1'>
                                    {rolloutReadiness.warnings.length === 0 ? (
                                        <p className='text-sm text-emerald-700'>Предупреждений нет.</p>
                                    ) : (
                                        rolloutReadiness.warnings.map((item) => (
                                            <p key={item} className='text-sm text-amber-700'>{item}</p>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {cutoverPacket && (
                        <div className='mt-4 rounded-2xl border border-black/10 p-4'>
                            <div className='flex items-start justify-between gap-4 flex-wrap'>
                                <div>
                                    <p className='text-xs text-gray-500 mb-1'>Пакет перевода</p>
                                    <p className='text-sm text-gray-700'>
                                        Компания {cutoverPacket.companyId} • вердикт {translateReadinessVerdict(cutoverPacket.verdict)} • {cutoverPacket.canExecuteCutover ? 'готово к выполнению' : 'пока только подготовка'}
                                    </p>
                                </div>
                            </div>
                            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                    <p className='text-[11px] uppercase tracking-wider text-gray-500'>Текущие флаги</p>
                                    <p className='text-sm text-gray-700 mt-1'>режим {formatRolloutModeLabel(cutoverPacket.currentFeatureFlags.mode)}</p>
                                    <p className='text-sm text-gray-700 mt-1'>фильтр компании {cutoverPacket.currentFeatureFlags.companyFilter || '-'}</p>
                                </div>
                                <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                    <p className='text-[11px] uppercase tracking-wider text-gray-500'>Рекомендуемые флаги</p>
                                    <p className='text-sm text-gray-700 mt-1'>режим {formatRolloutModeLabel(cutoverPacket.recommendedFeatureFlags.mode)}</p>
                                    <p className='text-sm text-gray-700 mt-1'>фильтр компании {cutoverPacket.recommendedFeatureFlags.companyFilter || '-'}</p>
                                </div>
                            </div>
                            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                    <p className='text-[11px] uppercase tracking-wider text-gray-500'>Команда выпуска</p>
                                    <code className='block mt-2 text-xs text-gray-800 break-all'>{cutoverPacket.releaseCommand}</code>
                                    <div className='mt-3 space-y-1'>
                                        {cutoverPacket.checklist.map((item) => (
                                            <p key={item} className='text-sm text-gray-700'>{item}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className='rounded-xl border border-black/5 bg-gray-50 p-3'>
                                    <p className='text-[11px] uppercase tracking-wider text-gray-500'>Команда отката</p>
                                    <code className='block mt-2 text-xs text-gray-800 break-all'>{cutoverPacket.rollbackCommand}</code>
                                    <div className='mt-3 space-y-1'>
                                        {cutoverPacket.rollbackChecklist.map((item) => (
                                            <p key={item} className='text-sm text-gray-700'>{item}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : maps.length === 0 ? (
                    <p className='text-sm text-gray-500'>Техкарты отсутствуют.</p>
                ) : (
                    <div className='space-y-4'>
                        {maps.map((map) => (
                            <div key={map.id} className='border border-black/10 rounded-2xl p-4'>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                                    <div>
                                        <p className='font-semibold text-gray-900'>
                                            {map.crop || 'Культура не указана'} • v{map.version ?? '-'}
                                        </p>
                                        <p className='text-xs text-gray-500'>
                                            {map.id} • {formatStatusLabel(map.status)} • {map.updatedAt ? new Date(map.updatedAt).toLocaleDateString('ru-RU') : '-'}
                                        </p>
                                        <div className='mt-2 flex flex-wrap gap-2'>
                                            {renderGenerationBadges(map)}
                                        </div>
                                    </div>
                                    <div className='flex gap-2 flex-wrap'>
                                        <Link
                                            href={`/consulting/techmaps/${map.id}`}
                                            className='px-4 py-2 border border-black/10 rounded-xl text-xs font-medium hover:bg-gray-50'
                                        >
                                            Открыть
                                        </Link>
                                        {nextStatuses(map.status).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleTransition(map.id, status)}
                                                disabled={busyId === map.id}
                                                className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                            >
                                                {busyId === map.id ? '...' : `→ ${formatStatusLabel(status)}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

function renderGenerationBadges(map: TechMap) {
    const badges: ReactNode[] = [];
    const strategy = map.generationMetadata?.generationStrategy;
    const rolloutMode = map.generationMetadata?.rolloutMode;
    const fallbackUsed = map.generationMetadata?.fallbackUsed === true;
    const parity = map.generationMetadata?.shadowParitySummary;

    if (strategy) {
        badges.push(
            <span key="strategy" className='px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-medium border border-sky-100'>
                {strategy}
            </span>,
        );
    }

    if (rolloutMode) {
        badges.push(
            <span key="rollout" className='px-2.5 py-1 rounded-full bg-white text-gray-700 text-[10px] font-medium border border-black/10'>
                режим {formatRolloutModeLabel(rolloutMode)}
            </span>,
        );
    }

    if (map.cropForm || map.canonicalBranch) {
        badges.push(
            <span key="branch" className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                {map.cropForm || '-'} / {map.canonicalBranch || '-'}
            </span>,
        );
    }

    if (fallbackUsed) {
        badges.push(
            <span key="fallback" className='px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100'>
                резервный сценарий
            </span>,
        );
    }

    if (parity?.hasBlockingDiffs) {
        badges.push(
            <span key="parity-blocking" className='px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-100'>
                P0 {parity.severityCounts?.P0 || 0}
            </span>,
        );
    } else if (parity && typeof parity.diffCount === 'number') {
        badges.push(
            <span key="parity-ok" className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100'>
                расхождений {parity.diffCount}
            </span>,
        );
    }

    return badges;
}

function translateReadinessVerdict(verdict: 'BLOCKED' | 'WARN' | 'PASS') {
    if (verdict === 'PASS') return 'пройдено';
    if (verdict === 'WARN') return 'внимание';
    return 'блокировано';
}

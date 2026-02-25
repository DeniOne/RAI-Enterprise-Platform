'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { TriageInputForm } from './TriageInputForm';

type ExplorationItem = {
    id: string;
    explorationMode: 'SEU' | 'CDU';
    status: string;
    type: string;
    riskScore?: number | null;
    updatedAt: string;
    signal?: {
        id: string;
        source: string;
        confidenceScore: number;
        status: string;
    } | null;
    warRoomSessions?: Array<{ id: string; deadline: string }>;
};

type ShowcaseResponse = {
    items: ExplorationItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export function ExplorationShowcase({
    mode,
    title,
}: {
    mode?: 'SEU' | 'CDU';
    title: string;
}) {
    const searchParams = useSearchParams();
    const focusedEntity = searchParams.get('entity')?.toLowerCase() ?? null;
    const severity = searchParams.get('severity');

    const [data, setData] = useState<ShowcaseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        setPermissionError(false);
        try {
            const response = await api.exploration.showcase({
                mode,
                page: 1,
                pageSize: 50,
            });
            setData(response.data as ShowcaseResponse);
            } catch (requestError: any) {
            const status = Number(requestError?.response?.status || 0);
            if (status === 401 || status === 403) {
                setPermissionError(true);
            } else {
                setError('Не удалось загрузить витрину исследований');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const filteredItems = useMemo(() => {
        const items = data?.items ?? [];
        if (!severity) return items;
        if (severity === 'critical') return items.filter((item) => item.status === 'WAR_ROOM' || (item.riskScore ?? 0) >= 8);
        if (severity === 'warning') return items.filter((item) => (item.riskScore ?? 0) >= 5 && (item.riskScore ?? 0) < 8);
        if (severity === 'info') return items.filter((item) => (item.riskScore ?? 0) < 5);
        return items;
    }, [data?.items, severity]);

    const focusedId = useMemo(() => {
        if (!focusedEntity) return null;
        return filteredItems.find((item) => item.id.toLowerCase() === focusedEntity || item.signal?.id.toLowerCase() === focusedEntity)?.id ?? null;
    }, [filteredItems, focusedEntity]);

    useEffect(() => {
        if (!focusedId) return;
        const element = document.querySelector(`[data-case-id="${focusedId}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusedId]);

    return (
        <div className="space-y-6" data-testid="exploration-showcase-page">
            <div className="space-y-2">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">
                    Витрина кейсов исследований. Поддерживается умная фокусировка через `?entity=...` и `?severity=...`.
                </p>
            </div>

            <TriageInputForm onCreated={load} />

            <Card className="rounded-3xl border-black/10">
                {loading ? <p className="text-sm text-gray-500">Загрузка кейсов исследований...</p> : null}

                {!loading && permissionError ? (
                    <p className="text-sm text-amber-700">
                        У вас нет прав на просмотр этой панели.
                    </p>
                ) : null}

                {!loading && !permissionError && error ? (
                    <div className="space-y-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            type="button"
                            className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-gray-800"
                            onClick={load}
                        >
                            Повторить
                        </button>
                    </div>
                ) : null}

                {!loading && !permissionError && !error && filteredItems.length === 0 ? (
                    <p className="text-sm text-gray-500">Кейсы исследований пока отсутствуют.</p>
                ) : null}

                {!loading && !permissionError && !error && filteredItems.length > 0 ? (
                    <div className="grid gap-3">
                        {filteredItems.map((item) => {
                            const isFocused = item.id === focusedId;
                            return (
                                <div
                                    key={item.id}
                                    data-case-id={item.id}
                                    data-focus={isFocused ? 'true' : 'false'}
                                    className={isFocused ? 'rounded-2xl border border-amber-300 bg-amber-50 p-4' : 'rounded-2xl border border-black/10 bg-white p-4'}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{item.id}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.explorationMode} / {item.type} / {item.status}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Обновлено: {new Date(item.updatedAt).toLocaleString('ru-RU')}
                                        </p>
                                    </div>
                                    <div className="mt-3 grid gap-2 text-xs text-gray-700 md:grid-cols-3">
                                        <p>Сигнал: {item.signal?.id ?? 'нет'}</p>
                                        <p>Источник: {item.signal?.source ?? 'н/д'}</p>
                                        <p>Риск: {item.riskScore ?? 'н/д'}</p>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                        <Link href={`/exploration/cases/${encodeURIComponent(item.id)}`} className="text-blue-700 hover:underline">
                                            Открыть кейс
                                        </Link>
                                        {item.warRoomSessions?.[0]?.id ? (
                                            <Link
                                                href={`/exploration/war-room/${encodeURIComponent(item.warRoomSessions[0].id)}`}
                                                className="text-blue-700 hover:underline"
                                            >
                                                Открыть комнату решений
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </Card>
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type FulfillmentEvent = {
    id: string;
    eventDomain: string;
    eventType: string;
    eventDate: string;
    obligationId: string;
    contract: { id: string; number: string } | null;
};

export default function CommerceFulfillmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const focusedEntity = searchParams.get('entity');
    const severity = searchParams.get('severity');

    const [events, setEvents] = useState<FulfillmentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api.commerce.fulfillment()
            .then((response) => {
                if (!active) return;
                setEvents(response.data ?? []);
            })
            .catch(() => {
                if (!active) return;
                setError('Не удалось загрузить события исполнения. Повтори запрос.');
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const normalizedFocus = focusedEntity?.trim().toLowerCase() ?? null;
    const focusedEventId = useMemo(() => {
        if (!normalizedFocus) return null;
        const match = events.find((item) => {
            return (
                item.id.toLowerCase() === normalizedFocus ||
                item.obligationId.toLowerCase() === normalizedFocus ||
                (item.contract?.number?.toLowerCase() ?? '') === normalizedFocus
            );
        });
        return match?.id ?? null;
    }, [events, normalizedFocus]);

    const resolveSeverity = (eventType: string): 'ok' | 'warning' | 'critical' => {
        if (eventType === 'WRITE_OFF') return 'critical';
        if (eventType === 'LEASE_USAGE' || eventType === 'MATERIAL_CONSUMPTION') return 'warning';
        return 'ok';
    };

    const filteredEvents = useMemo(() => {
        if (!severity || !['ok', 'warning', 'critical'].includes(severity)) {
            return events;
        }
        return events.filter((item) => resolveSeverity(item.eventType) === severity);
    }, [events, severity]);

    useEffect(() => {
        if (!focusedEventId) return;
        const element = document.querySelector(`[data-fulfillment-id="${focusedEventId}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusedEventId]);

    return (
        <div className="space-y-6" data-testid="commerce-fulfillment-page">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Коммерция: Исполнение договоров</h1>
                <button type="button" onClick={() => router.push('/commerce/fulfillment/create')}
                    className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">
                    + Зафиксировать исполнение
                </button>
            </div>
            <Card className="rounded-3xl border-black/10">
                {loading ? <p className="text-sm font-normal text-gray-500">Загрузка событий исполнения...</p> : null}

                {!loading && error ? (
                    <div className="space-y-3">
                        <p className="text-sm font-normal text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-gray-800"
                        >
                            Повторить
                        </button>
                    </div>
                ) : null}

                {!loading && !error && filteredEvents.length === 0 ? (
                    <p className="text-sm font-normal text-gray-500">События исполнения пока не зафиксированы.</p>
                ) : null}

                {!loading && !error && filteredEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="border-b border-black/10 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-900">Дата</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Домен</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Тип события</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Договор</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Obligation ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map((event) => {
                                    const isFocused = focusedEventId === event.id;
                                    return (
                                        <tr
                                            key={event.id}
                                            data-testid={`fulfillment-row-${event.id}`}
                                            data-fulfillment-id={event.id}
                                            data-focus={isFocused ? 'true' : 'false'}
                                            className={isFocused ? 'border-b border-black/5 bg-amber-50' : 'border-b border-black/5'}
                                        >
                                            <td className="px-3 py-2 font-normal">{new Date(event.eventDate).toLocaleDateString('ru-RU')}</td>
                                            <td className="px-3 py-2 font-normal">{event.eventDomain}</td>
                                            <td className="px-3 py-2 font-normal">{event.eventType}</td>
                                            <td className="px-3 py-2 font-normal">{event.contract?.number ?? '—'}</td>
                                            <td className="px-3 py-2 font-normal">{event.obligationId}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </Card>
        </div>
    );
}

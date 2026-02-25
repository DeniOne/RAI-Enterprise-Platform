'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

const EVENT_DOMAINS = [
    { value: 'COMMERCIAL', label: 'Коммерческий' },
    { value: 'PRODUCTION', label: 'Производство' },
    { value: 'LOGISTICS', label: 'Логистика' },
    { value: 'FINANCE_ADJ', label: 'Фин. корректировка' },
] as const;

const EVENT_TYPES_MAP: Record<string, string[]> = {
    COMMERCIAL: ['GOODS_SHIPMENT', 'SERVICE_ACT', 'LEASE_USAGE'],
    PRODUCTION: ['MATERIAL_CONSUMPTION', 'HARVEST'],
    LOGISTICS: ['INTERNAL_TRANSFER'],
    FINANCE_ADJ: ['WRITE_OFF'],
};

export default function CreateFulfillmentPage() {
    const router = useRouter();

    const [obligationId, setObligationId] = useState('');
    const [eventDomain, setEventDomain] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [batchId, setBatchId] = useState('');
    const [itemId, setItemId] = useState('');
    const [uom, setUom] = useState('');
    const [qty, setQty] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const availableTypes = eventDomain ? (EVENT_TYPES_MAP[eventDomain] ?? []) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await api.commerce.createFulfillment({
                obligationId: obligationId.trim(),
                eventDomain,
                eventType,
                eventDate,
                batchId: batchId || undefined,
                itemId: itemId || undefined,
                uom: uom || undefined,
                qty: qty ? Number(qty) : undefined,
            });
            setSuccess(true);
            setTimeout(() => router.push('/commerce/fulfillment'), 1500);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Ошибка создания события');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Зафиксировать исполнение</h1>
                <button
                    type="button"
                    onClick={() => router.push('/commerce/fulfillment')}
                    className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← Назад
                </button>
            </div>

            {success ? (
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-emerald-700">✓ Событие исполнения создано!</p>
                </Card>
            ) : (
                <Card className="rounded-2xl border-black/10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Obligation ID */}
                        <div>
                            <label className="mb-1 block text-xs font-normal text-gray-500">ID обязательства *</label>
                            <input
                                type="text"
                                value={obligationId}
                                onChange={(e) => setObligationId(e.target.value)}
                                placeholder="ID обязательства из карточки договора"
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                required
                            />
                        </div>

                        {/* Domain + Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Домен *</label>
                                <select
                                    value={eventDomain}
                                    onChange={(e) => { setEventDomain(e.target.value); setEventType(''); }}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                >
                                    <option value="">Выберите домен</option>
                                    {EVENT_DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Тип события *</label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                    disabled={!eventDomain}
                                >
                                    <option value="">Выберите тип</option>
                                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="mb-1 block text-xs font-normal text-gray-500">Дата события *</label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                required
                            />
                        </div>

                        {/* Optional: batch, item, uom, qty */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Партия</label>
                                <input type="text" value={batchId} onChange={(e) => setBatchId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Номенклатура</label>
                                <input type="text" value={itemId} onChange={(e) => setItemId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Ед. изм.</label>
                                <input type="text" value={uom} onChange={(e) => setUom(e.target.value)} placeholder="т, кг, л"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Количество</label>
                                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} step="0.01"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                            </div>
                        </div>

                        {error ? <p className="text-sm font-normal text-red-700">{error}</p> : null}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {submitting ? 'Создание...' : 'Зафиксировать'}
                        </button>
                    </form>
                </Card>
            )}
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type Invoice = {
    id: string;
    contract: { id: string; number: string } | null;
    direction: string;
    status: string;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    createdAt: string;
};

export default function CommerceInvoicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const focusedEntity = searchParams.get('entity');
    const severity = searchParams.get('severity');

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api.commerce.invoices()
            .then((response) => {
                if (!active) return;
                setInvoices(response.data ?? []);
            })
            .catch(() => {
                if (!active) return;
                setError('Не удалось загрузить документы. Повтори запрос.');
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
    const focusedInvoiceId = useMemo(() => {
        if (!normalizedFocus) return null;
        const match = invoices.find((item) => {
            return item.id.toLowerCase() === normalizedFocus || (item.contract?.number?.toLowerCase() ?? '') === normalizedFocus;
        });
        return match?.id ?? null;
    }, [invoices, normalizedFocus]);

    const resolveSeverity = (status: string): 'ok' | 'warning' | 'critical' => {
        if (status === 'VOID') return 'critical';
        if (status === 'DRAFT' || status === 'PARTIALLY_PAID') return 'warning';
        return 'ok';
    };

    const filteredInvoices = useMemo(() => {
        if (!severity || !['ok', 'warning', 'critical'].includes(severity)) {
            return invoices;
        }
        return invoices.filter((item) => resolveSeverity(item.status) === severity);
    }, [invoices, severity]);

    useEffect(() => {
        if (!focusedInvoiceId) return;
        const element = document.querySelector(`[data-invoice-id="${focusedInvoiceId}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusedInvoiceId]);

    return (
        <div className="space-y-6" data-testid="commerce-invoices-page">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Коммерция: Документы</h1>
                <button type="button" onClick={() => router.push('/commerce/invoices/create')}
                    className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">
                    + Сформировать
                </button>
            </div>
            <Card className="rounded-3xl border-black/10">
                {loading ? <p className="text-sm font-normal text-gray-500">Загрузка документов...</p> : null}

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

                {!loading && !error && filteredInvoices.length === 0 ? (
                    <p className="text-sm font-normal text-gray-500">Документы пока не сформированы.</p>
                ) : null}

                {!loading && !error && filteredInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="border-b border-black/10 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-900">Договор</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Направление</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Статус</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Сумма</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Дата</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => {
                                    const isFocused = focusedInvoiceId === invoice.id;
                                    return (
                                        <tr
                                            key={invoice.id}
                                            data-testid={`invoice-row-${invoice.id}`}
                                            data-invoice-id={invoice.id}
                                            data-focus={isFocused ? 'true' : 'false'}
                                            className={isFocused ? 'border-b border-black/5 bg-amber-50' : 'border-b border-black/5'}
                                        >
                                            <td className="px-3 py-2 font-normal">{invoice.contract?.number ?? '—'}</td>
                                            <td className="px-3 py-2 font-normal">{invoice.direction}</td>
                                            <td className="px-3 py-2 font-normal">{invoice.status}</td>
                                            <td className="px-3 py-2 font-normal">
                                                {invoice.grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 font-normal">{new Date(invoice.createdAt).toLocaleDateString('ru-RU')}</td>
                                            <td className="px-3 py-2">
                                                {invoice.status === 'DRAFT' ? (
                                                    <button type="button"
                                                        onClick={() => { api.commerce.postInvoice(invoice.id).then(() => window.location.reload()); }}
                                                        className="rounded-lg border border-black/10 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                                                        Провести
                                                    </button>
                                                ) : null}
                                            </td>
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type Payment = {
    id: string;
    amount: number;
    currency: string;
    paidAt: string;
    paymentMethod: string;
    status: string;
    payerParty: { id: string; legalName: string };
    payeeParty: { id: string; legalName: string };
};

export default function CommercePaymentsPage() {
    const searchParams = useSearchParams();
    const focusedEntity = searchParams.get('entity');
    const severity = searchParams.get('severity');

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api.commerce.payments()
            .then((response) => {
                if (!active) return;
                setPayments(response.data ?? []);
            })
            .catch(() => {
                if (!active) return;
                setError('Не удалось загрузить оплаты. Повтори запрос.');
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
    const focusedPaymentId = useMemo(() => {
        if (!normalizedFocus) return null;
        const match = payments.find((item) => {
            return (
                item.id.toLowerCase() === normalizedFocus ||
                item.payerParty?.legalName?.toLowerCase() === normalizedFocus ||
                item.payeeParty?.legalName?.toLowerCase() === normalizedFocus
            );
        });
        return match?.id ?? null;
    }, [payments, normalizedFocus]);

    const resolveSeverity = (status: string): 'ok' | 'warning' | 'critical' => {
        if (status === 'REVERSED') return 'critical';
        if (status === 'DRAFT') return 'warning';
        return 'ok';
    };

    const filteredPayments = useMemo(() => {
        if (!severity || !['ok', 'warning', 'critical'].includes(severity)) {
            return payments;
        }
        return payments.filter((item) => resolveSeverity(item.status) === severity);
    }, [payments, severity]);

    useEffect(() => {
        if (!focusedPaymentId) return;
        const element = document.querySelector(`[data-payment-id="${focusedPaymentId}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusedPaymentId]);

    return (
        <div className="space-y-6" data-testid="commerce-payments-page">
            <h1 className="text-xl font-medium text-gray-900">Коммерция: Оплаты</h1>
            <Card className="rounded-3xl border-black/10">
                {loading ? <p className="text-sm font-normal text-gray-500">Загрузка оплат...</p> : null}

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

                {!loading && !error && filteredPayments.length === 0 ? (
                    <p className="text-sm font-normal text-gray-500">Оплаты пока не зафиксированы.</p>
                ) : null}

                {!loading && !error && filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="border-b border-black/10 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-900">Плательщик</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Получатель</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Сумма</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Метод</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Статус</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => {
                                    const isFocused = focusedPaymentId === payment.id;
                                    return (
                                    <tr
                                        key={payment.id}
                                        data-testid={`payment-row-${payment.id}`}
                                        data-payment-id={payment.id}
                                        data-focus={isFocused ? 'true' : 'false'}
                                        className={isFocused ? 'border-b border-black/5 bg-amber-50' : 'border-b border-black/5'}
                                    >
                                        <td className="px-3 py-2 font-normal">{payment.payerParty?.legalName ?? '—'}</td>
                                        <td className="px-3 py-2 font-normal">{payment.payeeParty?.legalName ?? '—'}</td>
                                        <td className="px-3 py-2 font-normal">
                                            {payment.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {payment.currency}
                                        </td>
                                        <td className="px-3 py-2 font-normal">{payment.paymentMethod}</td>
                                        <td className="px-3 py-2 font-normal">{payment.status}</td>
                                        <td className="px-3 py-2 font-normal">{new Date(payment.paidAt).toLocaleDateString('ru-RU')}</td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </Card>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type Party = { id: string; legalName: string };

const CURRENCIES = ['RUB', 'USD', 'EUR'] as const;
const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'CARD'] as const;

export default function CreatePaymentPage() {
    const router = useRouter();
    const companyId = 'default-company';

    const [parties, setParties] = useState<Party[]>([]);
    const [loadingRef, setLoadingRef] = useState(true);

    const [payerPartyId, setPayerPartyId] = useState('');
    const [payeePartyId, setPayeePartyId] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('RUB');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paidAt, setPaidAt] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        api.partyManagement.parties(companyId)
            .then((res) => setParties(res.data ?? []))
            .finally(() => setLoadingRef(false));
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await api.commerce.createPayment({
                payerPartyId,
                payeePartyId,
                amount: Number(amount),
                currency,
                paymentMethod,
                paidAt: paidAt || undefined,
            });
            setSuccess(true);
            setTimeout(() => router.push('/commerce/payments'), 1500);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Ошибка регистрации оплаты');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingRef) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-medium text-gray-900">Регистрация оплаты</h1>
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-gray-500">Загрузка контрагентов...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Регистрация оплаты</h1>
                <button type="button" onClick={() => router.push('/commerce/payments')}
                    className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                    ← Назад
                </button>
            </div>

            {success ? (
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-emerald-700">✓ Оплата зарегистрирована!</p>
                </Card>
            ) : (
                <Card className="rounded-2xl border-black/10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Плательщик *</label>
                                <select value={payerPartyId} onChange={(e) => setPayerPartyId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    <option value="">Выберите контрагента</option>
                                    {parties.map(p => <option key={p.id} value={p.id}>{p.legalName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Получатель *</label>
                                <select value={payeePartyId} onChange={(e) => setPayeePartyId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    <option value="">Выберите контрагента</option>
                                    {parties.map(p => <option key={p.id} value={p.id}>{p.legalName}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Сумма *</label>
                                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Валюта *</label>
                                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Способ *</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    <option value="">Выберите</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-normal text-gray-500">Дата оплаты</label>
                            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                        </div>

                        {error ? <p className="text-sm font-normal text-red-700">{error}</p> : null}

                        <button type="submit" disabled={submitting}
                            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                            {submitting ? 'Регистрация...' : 'Зарегистрировать оплату'}
                        </button>
                    </form>
                </Card>
            )}
        </div>
    );
}

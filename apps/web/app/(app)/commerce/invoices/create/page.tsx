'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

const SUPPLY_TYPES = ['GOODS', 'SERVICE', 'LEASE'] as const;
const VAT_STATUSES = ['PAYER', 'NON_PAYER'] as const;

export default function CreateInvoicePage() {
    const router = useRouter();

    const [fulfillmentEventId, setFulfillmentEventId] = useState('');
    const [sellerJurisdiction, setSellerJurisdiction] = useState('');
    const [buyerJurisdiction, setBuyerJurisdiction] = useState('');
    const [supplyType, setSupplyType] = useState('');
    const [vatPayerStatus, setVatPayerStatus] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [productTaxCode, setProductTaxCode] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await api.commerce.createInvoice({
                fulfillmentEventId: fulfillmentEventId.trim(),
                sellerJurisdiction: sellerJurisdiction.trim(),
                buyerJurisdiction: buyerJurisdiction.trim(),
                supplyType,
                vatPayerStatus,
                subtotal: Number(subtotal),
                productTaxCode: productTaxCode || undefined,
            });
            setSuccess(true);
            setTimeout(() => router.push('/commerce/invoices'), 1500);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Ошибка формирования документа');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Сформировать документ</h1>
                <button
                    type="button"
                    onClick={() => router.push('/commerce/invoices')}
                    className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← Назад
                </button>
            </div>

            {success ? (
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-emerald-700">✓ Документ сформирован!</p>
                </Card>
            ) : (
                <Card className="rounded-2xl border-black/10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-normal text-gray-500">ID события исполнения *</label>
                            <input
                                type="text" value={fulfillmentEventId} onChange={(e) => setFulfillmentEventId(e.target.value)}
                                placeholder="ID из реестра исполнения"
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Юрисдикция продавца *</label>
                                <input type="text" value={sellerJurisdiction} onChange={(e) => setSellerJurisdiction(e.target.value)}
                                    placeholder="RU"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Юрисдикция покупателя *</label>
                                <input type="text" value={buyerJurisdiction} onChange={(e) => setBuyerJurisdiction(e.target.value)}
                                    placeholder="RU"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Тип поставки *</label>
                                <select value={supplyType} onChange={(e) => setSupplyType(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    <option value="">Выберите</option>
                                    {SUPPLY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Статус НДС *</label>
                                <select value={vatPayerStatus} onChange={(e) => setVatPayerStatus(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required>
                                    <option value="">Выберите</option>
                                    {VAT_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Сумма (без НДС) *</label>
                                <input type="number" step="0.01" value={subtotal} onChange={(e) => setSubtotal(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Код налога</label>
                                <input type="text" value={productTaxCode} onChange={(e) => setProductTaxCode(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800" />
                            </div>
                        </div>

                        {error ? <p className="text-sm font-normal text-red-700">{error}</p> : null}

                        <button type="submit" disabled={submitting}
                            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                            {submitting ? 'Формирование...' : 'Сформировать документ'}
                        </button>
                    </form>
                </Card>
            )}
        </div>
    );
}

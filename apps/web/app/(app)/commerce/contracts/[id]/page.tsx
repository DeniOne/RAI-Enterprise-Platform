'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type ContractRole = {
    id: string;
    role: string;
    isPrimary: boolean;
    party: { id: string; legalName: string };
};

type Obligation = {
    id: string;
    type: string;
    status: string;
    dueDate: string | null;
    createdAt: string;
};

type ContractDetail = {
    id: string;
    number: string;
    type: string;
    status: string;
    validFrom: string;
    validTo: string | null;
    createdAt: string;
    roles: ContractRole[];
};

const OBLIGATION_TYPES = ['DELIVER', 'PAY', 'PERFORM'] as const;

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contractId = params.id as string;

    const [contract, setContract] = useState<ContractDetail | null>(null);
    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Obligation form
    const [showObForm, setShowObForm] = useState(false);
    const [obType, setObType] = useState('');
    const [obDueDate, setObDueDate] = useState('');
    const [obSubmitting, setObSubmitting] = useState(false);
    const [obError, setObError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);

        api.commerce.contracts()
            .then((res) => {
                if (!active) return;
                const all = res.data ?? [];
                const found = all.find((c: ContractDetail) => c.id === contractId);
                if (found) {
                    setContract(found);
                } else {
                    setError('Договор не найден');
                }
            })
            .catch(() => {
                if (!active) return;
                setError('Не удалось загрузить договор');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [contractId]);

    const handleCreateObligation = async (e: React.FormEvent) => {
        e.preventDefault();
        setObSubmitting(true);
        setObError(null);

        try {
            const res = await api.commerce.createObligation({
                contractId,
                type: obType as 'DELIVER' | 'PAY' | 'PERFORM',
                dueDate: obDueDate || undefined,
            });
            setObligations([...obligations, res.data]);
            setObType('');
            setObDueDate('');
            setShowObForm(false);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setObError(msg ?? 'Ошибка создания обязательства');
        } finally {
            setObSubmitting(false);
        }
    };

    const statusColor = (status: string) => {
        if (status === 'ACTIVE' || status === 'PAID') return 'bg-emerald-100 text-emerald-800';
        if (status === 'DRAFT') return 'bg-gray-100 text-gray-700';
        if (status === 'VOID') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-medium text-gray-900">Карточка договора</h1>
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-gray-500">Загрузка...</p>
                </Card>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-medium text-gray-900">Карточка договора</h1>
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-red-700">{error ?? 'Договор не найден'}</p>
                    <button
                        type="button"
                        onClick={() => router.push('/commerce/contracts')}
                        className="mt-3 rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800"
                    >
                        ← К реестру
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">
                    Договор {contract.number}
                </h1>
                <button
                    type="button"
                    onClick={() => router.push('/commerce/contracts')}
                    className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← К реестру
                </button>
            </div>

            {/* Main Info */}
            <Card className="rounded-2xl border-black/10">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                        <p className="text-xs font-normal text-gray-500">Номер</p>
                        <p className="text-sm font-medium text-gray-900">{contract.number}</p>
                    </div>
                    <div>
                        <p className="text-xs font-normal text-gray-500">Тип</p>
                        <p className="text-sm font-medium text-gray-900">{contract.type}</p>
                    </div>
                    <div>
                        <p className="text-xs font-normal text-gray-500">Статус</p>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-normal ${statusColor(contract.status)}`}>
                            {contract.status}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-normal text-gray-500">Период</p>
                        <p className="text-sm font-normal text-gray-800">
                            {new Date(contract.validFrom).toLocaleDateString('ru-RU')}
                            {' — '}
                            {contract.validTo ? new Date(contract.validTo).toLocaleDateString('ru-RU') : '∞'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Roles */}
            <Card className="rounded-2xl border-black/10">
                <h2 className="mb-3 text-base font-medium text-gray-900">Стороны договора</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead>
                            <tr className="border-b border-black/10 text-left">
                                <th className="px-3 py-2 font-medium text-gray-900">Контрагент</th>
                                <th className="px-3 py-2 font-medium text-gray-900">Роль</th>
                                <th className="px-3 py-2 font-medium text-gray-900">Primary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contract.roles.map((role) => (
                                <tr key={role.id} className="border-b border-black/5">
                                    <td className="px-3 py-2 font-normal text-gray-800">{role.party.legalName}</td>
                                    <td className="px-3 py-2 font-normal">{role.role}</td>
                                    <td className="px-3 py-2 font-normal">{role.isPrimary ? '✓' : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Obligations */}
            <Card className="rounded-2xl border-black/10">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-medium text-gray-900">Обязательства</h2>
                    <button
                        type="button"
                        onClick={() => setShowObForm(!showObForm)}
                        className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        {showObForm ? 'Отмена' : '+ Обязательство'}
                    </button>
                </div>

                {/* Obligation Form */}
                {showObForm ? (
                    <form onSubmit={handleCreateObligation} className="mb-4 rounded-lg border border-black/5 bg-gray-50/50 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Тип *</label>
                                <select
                                    value={obType}
                                    onChange={(e) => setObType(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                >
                                    <option value="">Выберите тип</option>
                                    {OBLIGATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Срок исполнения</label>
                                <input
                                    type="date"
                                    value={obDueDate}
                                    onChange={(e) => setObDueDate(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                />
                            </div>
                        </div>
                        {obError ? <p className="text-sm font-normal text-red-700">{obError}</p> : null}
                        <button
                            type="submit"
                            disabled={obSubmitting}
                            className="rounded-2xl bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {obSubmitting ? '...' : 'Создать'}
                        </button>
                    </form>
                ) : null}

                {/* Obligations List */}
                {obligations.length > 0 ? (
                    <table className="min-w-full text-sm text-gray-700">
                        <thead>
                            <tr className="border-b border-black/10 text-left">
                                <th className="px-3 py-2 font-medium text-gray-900">Тип</th>
                                <th className="px-3 py-2 font-medium text-gray-900">Статус</th>
                                <th className="px-3 py-2 font-medium text-gray-900">Срок</th>
                            </tr>
                        </thead>
                        <tbody>
                            {obligations.map((ob) => (
                                <tr key={ob.id} className="border-b border-black/5">
                                    <td className="px-3 py-2 font-normal text-gray-800">{ob.type}</td>
                                    <td className="px-3 py-2 font-normal">
                                        <span className={`rounded-md px-2 py-0.5 text-xs ${statusColor(ob.status)}`}>
                                            {ob.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 font-normal text-gray-600">
                                        {ob.dueDate ? new Date(ob.dueDate).toLocaleDateString('ru-RU') : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm font-normal text-gray-500">Обязательства пока не добавлены.</p>
                )}
            </Card>
        </div>
    );
}

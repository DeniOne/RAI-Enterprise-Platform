'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type Jurisdiction = { id: string; code: string; name: string };
type Party = { id: string; legalName: string; jurisdiction: Jurisdiction };
type ContractRole = { partyId: string; role: string; isPrimary: boolean };

const CONTRACT_TYPES = ['SUPPLY', 'SERVICE', 'LEASE', 'AGENCY'] as const;
const ROLE_TYPES = ['SELLER', 'BUYER', 'LESSOR', 'LESSEE', 'AGENT', 'PRINCIPAL', 'PAYER', 'BENEFICIARY'] as const;

export default function CreateContractPage() {
    const router = useRouter();
    const companyId = 'default-company';

    // Reference data
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [loadingRef, setLoadingRef] = useState(true);

    // Form fields
    const [number, setNumber] = useState('');
    const [type, setType] = useState<string>('');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    const [jurisdictionId, setJurisdictionId] = useState('');
    const [roles, setRoles] = useState<ContractRole[]>([{ partyId: '', role: '', isPrimary: true }]);

    // State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        Promise.all([
            api.partyManagement.jurisdictions(companyId),
            api.partyManagement.parties(companyId),
        ]).then(([jurRes, partiesRes]) => {
            setJurisdictions(jurRes.data ?? []);
            setParties(partiesRes.data ?? []);
        }).finally(() => setLoadingRef(false));
    }, [companyId]);

    const addRole = () => {
        setRoles([...roles, { partyId: '', role: '', isPrimary: false }]);
    };

    const removeRole = (index: number) => {
        if (roles.length <= 1) return;
        setRoles(roles.filter((_, i) => i !== index));
    };

    const updateRole = (index: number, field: keyof ContractRole, value: string | boolean) => {
        const updated = [...roles];
        updated[index] = { ...updated[index], [field]: value };
        setRoles(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const validRoles = roles.filter(r => r.partyId && r.role);
        if (validRoles.length === 0) {
            setError('Необходимо добавить хотя бы одну роль');
            setSubmitting(false);
            return;
        }

        try {
            await api.commerce.createContract({
                number: number.trim(),
                type,
                validFrom,
                validTo: validTo || undefined,
                jurisdictionId,
                roles: validRoles,
            });
            setSuccess(true);
            setTimeout(() => router.push('/commerce/contracts'), 1500);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Ошибка создания договора');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingRef) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-medium text-gray-900">Новый договор</h1>
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-gray-500">Загрузка справочников...</p>
                </Card>
            </div>
        );
    }

    if (parties.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-medium text-gray-900">Новый договор</h1>
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-amber-700">
                        ⚠ Для создания договора необходимо добавить хотя бы одного контрагента.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push('/commerce/parties')}
                        className="mt-3 rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white"
                    >
                        Перейти к контрагентам
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Новый договор</h1>
                <button
                    type="button"
                    onClick={() => router.push('/commerce/contracts')}
                    className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← Назад к реестру
                </button>
            </div>

            {success ? (
                <Card className="rounded-2xl border-black/10">
                    <p className="text-sm font-normal text-emerald-700">✓ Договор создан! Переход к реестру...</p>
                </Card>
            ) : (
                <Card className="rounded-2xl border-black/10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Row 1: Номер + Тип */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Номер договора *</label>
                                <input
                                    type="text"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    placeholder="ДГ-2026-001"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Тип *</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                >
                                    <option value="">Выберите тип</option>
                                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Даты */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Действует с *</label>
                                <input
                                    type="date"
                                    value={validFrom}
                                    onChange={(e) => setValidFrom(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">Действует по</label>
                                <input
                                    type="date"
                                    value={validTo}
                                    onChange={(e) => setValidTo(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Jurisdiction */}
                        <div>
                            <label className="mb-1 block text-xs font-normal text-gray-500">Юрисдикция *</label>
                            <select
                                value={jurisdictionId}
                                onChange={(e) => setJurisdictionId(e.target.value)}
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                required
                            >
                                <option value="">Выберите юрисдикцию</option>
                                {jurisdictions.map(j => <option key={j.id} value={j.id}>{j.code} — {j.name}</option>)}
                            </select>
                        </div>

                        {/* Roles - Dynamic */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-normal text-gray-500">Роли сторон *</label>
                                <button
                                    type="button"
                                    onClick={addRole}
                                    className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    + Добавить роль
                                </button>
                            </div>
                            <div className="space-y-2">
                                {roles.map((role, idx) => (
                                    <div key={idx} className="flex items-center gap-2 rounded-lg border border-black/5 bg-gray-50/50 p-2">
                                        <select
                                            value={role.partyId}
                                            onChange={(e) => updateRole(idx, 'partyId', e.target.value)}
                                            className="flex-[2] rounded-lg border border-black/10 px-3 py-2 text-sm font-normal text-gray-800"
                                            required
                                        >
                                            <option value="">Контрагент...</option>
                                            {parties.map(p => <option key={p.id} value={p.id}>{p.legalName}</option>)}
                                        </select>
                                        <select
                                            value={role.role}
                                            onChange={(e) => updateRole(idx, 'role', e.target.value)}
                                            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm font-normal text-gray-800"
                                            required
                                        >
                                            <option value="">Роль...</option>
                                            {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <label className="flex items-center gap-1 text-xs font-normal text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={role.isPrimary}
                                                onChange={(e) => updateRole(idx, 'isPrimary', e.target.checked)}
                                                className="rounded"
                                            />
                                            Primary
                                        </label>
                                        {roles.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => removeRole(idx)}
                                                className="text-sm text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error ? <p className="text-sm font-normal text-red-700">{error}</p> : null}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {submitting ? 'Создание...' : 'Создать договор'}
                        </button>
                    </form>
                </Card>
            )}
        </div>
    );
}

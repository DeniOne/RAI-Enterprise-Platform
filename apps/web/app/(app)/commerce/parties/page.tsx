'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type Jurisdiction = {
    id: string;
    code: string;
    name: string;
};

type RegulatoryProfile = {
    id: string;
    code: string;
    name: string;
    jurisdiction: Jurisdiction;
};

type Party = {
    id: string;
    legalName: string;
    jurisdiction: Jurisdiction;
    regulatoryProfile: RegulatoryProfile | null;
    createdAt: string;
};

export default function PartiesPage() {
    // ─── State ────────────────────────────────────────────────
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [parties, setParties] = useState<Party[]>([]);
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [regulatoryProfiles, setRegulatoryProfiles] = useState<RegulatoryProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Форма Party
    const [showForm, setShowForm] = useState(false);
    const [formLegalName, setFormLegalName] = useState('');
    const [formJurisdictionId, setFormJurisdictionId] = useState('');
    const [formRegulatoryProfileId, setFormRegulatoryProfileId] = useState('');
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Форма Jurisdiction
    const [showJurForm, setShowJurForm] = useState(false);
    const [jurCode, setJurCode] = useState('');
    const [jurName, setJurName] = useState('');
    const [jurSubmitting, setJurSubmitting] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────
    const fetchParties = useCallback(async (cid: string) => {
        try {
            const [partiesRes, jurRes, profilesRes] = await Promise.all([
                api.partyManagement.parties(cid),
                api.partyManagement.jurisdictions(cid),
                api.partyManagement.regulatoryProfiles(cid),
            ]);
            setParties(partiesRes.data ?? []);
            setJurisdictions(jurRes.data ?? []);
            setRegulatoryProfiles(profilesRes.data ?? []);
        } catch {
            setError('Не удалось загрузить контрагентов.');
        }
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api.partyManagement.tenant()
            .then(res => {
                const cid = res?.data?.id;
                if (!cid) throw new Error('Company not found');
                if (active) setCompanyId(cid);
                return fetchParties(cid);
            })
            .catch(() => {
                if (active) setError('Не удалось определить компанию пользователя.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [fetchParties]);

    // ─── Handlers ─────────────────────────────────────────────
    const handleCreateParty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;
        setFormSubmitting(true);
        setFormError(null);
        setFormSuccess(null);

        try {
            await api.partyManagement.createParty({
                legalName: formLegalName.trim(),
                jurisdictionId: formJurisdictionId,
                regulatoryProfileId: formRegulatoryProfileId || undefined,
                companyId,
            });
            setFormSuccess('Контрагент создан');
            setFormLegalName('');
            setFormJurisdictionId('');
            setFormRegulatoryProfileId('');
            setTimeout(() => {
                setShowForm(false);
                setFormSuccess(null);
            }, 1200);
            await fetchParties(companyId);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setFormError(msg ?? 'Ошибка создания контрагента');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleCreateJurisdiction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;
        setJurSubmitting(true);
        try {
            await api.partyManagement.createJurisdiction({
                code: jurCode.trim().toUpperCase(),
                name: jurName.trim(),
                companyId,
            });
            setJurCode('');
            setJurName('');
            setShowJurForm(false);
            await fetchParties(companyId);
        } catch (error) {
            console.error('Failed to create jurisdiction:', error);
            // Игнорируем в UI, но пишем в лог
        } finally {
            setJurSubmitting(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────
    return (
        <div className="space-y-6" data-testid="parties-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Контрагенты (Party)</h1>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowJurForm(!showJurForm)}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
                    >
                        {showJurForm ? 'Скрыть' : '⚙ Юрисдикции'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        {showForm ? 'Отмена' : '+ Добавить контрагента'}
                    </button>
                </div>
            </div>

            {/* Jurisdiction Form */}
            {showJurForm ? (
                <Card className="rounded-2xl border-black/10">
                    <h2 className="mb-4 text-base font-medium text-gray-900">Управление юрисдикциями</h2>

                    {/* Список текущих */}
                    {jurisdictions.length > 0 ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {jurisdictions.map((j) => (
                                <span
                                    key={j.id}
                                    className="rounded-lg border border-black/10 bg-gray-50 px-3 py-1 text-sm font-normal text-gray-700"
                                >
                                    {j.code} — {j.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mb-4 text-sm font-normal text-gray-500">Юрисдикции пока не созданы.</p>
                    )}

                    {/* Форма добавления */}
                    <form onSubmit={handleCreateJurisdiction} className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-normal text-gray-500">Код</label>
                            <input
                                type="text"
                                value={jurCode}
                                onChange={(e) => setJurCode(e.target.value)}
                                placeholder="RU"
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                required
                            />
                        </div>
                        <div className="flex-[2]">
                            <label className="mb-1 block text-xs font-normal text-gray-500">Наименование</label>
                            <input
                                type="text"
                                value={jurName}
                                onChange={(e) => setJurName(e.target.value)}
                                placeholder="Российская Федерация"
                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={jurSubmitting}
                            className="rounded-2xl bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {jurSubmitting ? '...' : 'Добавить'}
                        </button>
                    </form>
                </Card>
            ) : null}

            {/* Party Create Form */}
            {showForm ? (
                <Card className="rounded-2xl border-black/10">
                    <h2 className="mb-4 text-base font-medium text-gray-900">Новый контрагент</h2>

                    {jurisdictions.length === 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm font-normal text-amber-700">
                                ⚠ Перед созданием контрагента необходимо добавить хотя бы одну юрисдикцию.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setShowJurForm(true); }}
                                className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-800"
                            >
                                Открыть управление юрисдикциями
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateParty} className="space-y-4">
                            {/* Legal Name */}
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">
                                    Юридическое наименование *
                                </label>
                                <input
                                    type="text"
                                    value={formLegalName}
                                    onChange={(e) => setFormLegalName(e.target.value)}
                                    placeholder="ООО «Агрохолдинг Рассвет»"
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                />
                            </div>

                            {/* Jurisdiction */}
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">
                                    Юрисдикция *
                                </label>
                                <select
                                    value={formJurisdictionId}
                                    onChange={(e) => setFormJurisdictionId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                    required
                                >
                                    <option value="">Выберите юрисдикцию</option>
                                    {jurisdictions.map((j) => (
                                        <option key={j.id} value={j.id}>{j.code} — {j.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Regulatory Profile (optional) */}
                            <div>
                                <label className="mb-1 block text-xs font-normal text-gray-500">
                                    Регуляторный профиль
                                </label>
                                <select
                                    value={formRegulatoryProfileId}
                                    onChange={(e) => setFormRegulatoryProfileId(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal text-gray-800"
                                >
                                    <option value="">Не задан</option>
                                    {regulatoryProfiles.map((rp) => (
                                        <option key={rp.id} value={rp.id}>{rp.code} — {rp.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Errors / Success */}
                            {formError ? (
                                <p className="text-sm font-normal text-red-700">{formError}</p>
                            ) : null}
                            {formSuccess ? (
                                <p className="text-sm font-normal text-emerald-700">{formSuccess}</p>
                            ) : null}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={formSubmitting}
                                className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                            >
                                {formSubmitting ? 'Создание...' : 'Создать контрагента'}
                            </button>
                        </form>
                    )}
                </Card>
            ) : null}

            {/* Party Table */}
            <Card className="rounded-2xl border-black/10">
                {loading ? (
                    <p className="text-sm font-normal text-gray-500">Загрузка контрагентов...</p>
                ) : null}

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

                {!loading && !error && parties.length === 0 ? (
                    <div className="space-y-3 text-center py-8">
                        <p className="text-sm font-normal text-gray-500">
                            Контрагенты ещё не созданы.
                        </p>
                        <p className="text-xs font-normal text-gray-400">
                            Нажмите «+ Добавить контрагента» чтобы начать.
                        </p>
                    </div>
                ) : null}

                {!loading && !error && parties.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="border-b border-black/10 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-900">Наименование</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Юрисдикция</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Регуляторный профиль</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Создан</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parties.map((party) => (
                                    <tr
                                        key={party.id}
                                        data-testid={`party-row-${party.id}`}
                                        className="border-b border-black/5 transition-colors hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-3 py-2 font-normal text-gray-800">
                                            {party.legalName}
                                        </td>
                                        <td className="px-3 py-2 font-normal">
                                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                                                {party.jurisdiction.code}
                                            </span>
                                            {' '}
                                            {party.jurisdiction.name}
                                        </td>
                                        <td className="px-3 py-2 font-normal text-gray-600">
                                            {party.regulatoryProfile
                                                ? `${party.regulatoryProfile.code} — ${party.regulatoryProfile.name}`
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2 font-normal text-gray-500">
                                            {new Date(party.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </Card>

            {/* Stats */}
            {!loading && !error ? (
                <div className="flex gap-4">
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                        <p className="text-xs font-normal text-gray-500">Контрагентов</p>
                        <p className="text-lg font-medium text-gray-900">{parties.length}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                        <p className="text-xs font-normal text-gray-500">Юрисдикций</p>
                        <p className="text-lg font-medium text-gray-900">{jurisdictions.length}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                        <p className="text-xs font-normal text-gray-500">Рег. профилей</p>
                        <p className="text-lg font-medium text-gray-900">{regulatoryProfiles.length}</p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

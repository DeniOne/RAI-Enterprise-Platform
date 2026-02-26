'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

// ─── Типы ─────────────────────────────────────────────────────────────────────

type Jurisdiction = { id: string; code: string; name: string };

type RulesJson = {
    vatRate?: number;
    vatRateReduced?: number;
    vatRateZero?: number;
    crossBorderVatRate?: number;
    vatPayerStatus?: string;
    supplyType?: string;
    currencyCode?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    notes?: string;
};

type RegulatoryProfile = {
    id: string;
    code: string;
    name: string;
    jurisdiction: Jurisdiction;
    rulesJson: RulesJson | null;
    isSystemPreset?: boolean;
};

type Party = {
    id: string;
    legalName: string;
    jurisdiction: Jurisdiction;
    regulatoryProfile: RegulatoryProfile | null;
    createdAt: string;
};

type Tab = 'parties' | 'reg-profiles' | 'jurisdictions';

const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Произошла ошибка';

const pct = (v?: number) => v !== undefined ? `${(v * 100).toFixed(0)}%` : '—';

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function PartiesPage() {
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('parties');

    const [parties, setParties] = useState<Party[]>([]);
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [regulatoryProfiles, setRegulatoryProfiles] = useState<RegulatoryProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ─── Party form ───────────────────────────────────────────────
    const [showPartyForm, setShowPartyForm] = useState(false);
    const [partyLegalName, setPartyLegalName] = useState('');
    const [partyJurisdictionId, setPartyJurisdictionId] = useState('');
    const [partyProfileId, setPartyProfileId] = useState('');
    const [partySubmitting, setPartySubmitting] = useState(false);
    const [partyError, setPartyError] = useState<string | null>(null);
    const [partySuccess, setPartySuccess] = useState<string | null>(null);

    // ─── Jurisdiction form ────────────────────────────────────────
    const [showJurForm, setShowJurForm] = useState(false);
    const [jurCode, setJurCode] = useState('');
    const [jurName, setJurName] = useState('');
    const [jurSubmitting, setJurSubmitting] = useState(false);
    const [jurError, setJurError] = useState<string | null>(null);
    const [editingJurId, setEditingJurId] = useState<string | null>(null);
    const [editJurCode, setEditJurCode] = useState('');
    const [editJurName, setEditJurName] = useState('');
    const [jurUpdating, setJurUpdating] = useState(false);
    const [jurDeletingId, setJurDeletingId] = useState<string | null>(null);

    // ─── RegProfile form ──────────────────────────────────────────
    const [showProfForm, setShowProfForm] = useState(false);
    const [editingProfId, setEditingProfId] = useState<string | null>(null);
    const [profCode, setProfCode] = useState('');
    const [profName, setProfName] = useState('');
    const [profJurId, setProfJurId] = useState('');
    const [profVatRate, setProfVatRate] = useState('');
    const [profVatReduced, setProfVatReduced] = useState('');
    const [profCrossVat, setProfCrossVat] = useState('0');
    const [profPayerStatus, setProfPayerStatus] = useState('PAYER');
    const [profSupplyType, setProfSupplyType] = useState('GOODS');
    const [profCurrency, setProfCurrency] = useState('RUB');
    const [profEffectiveFrom, setProfEffectiveFrom] = useState('2026-01-01');
    const [profEffectiveTo, setProfEffectiveTo] = useState('');
    const [profNotes, setProfNotes] = useState('');
    const [profSubmitting, setProfSubmitting] = useState(false);
    const [profDeleting, setProfDeleting] = useState<string | null>(null);
    const [profError, setProfError] = useState<string | null>(null);
    const [profSuccess, setProfSuccess] = useState<string | null>(null);
    const [profJurWarning, setProfJurWarning] = useState(false);

    // ─── Загрузка данных ──────────────────────────────────────────

    const fetchAll = useCallback(async () => {
        try {
            const [partiesRes, jurRes, profilesRes] = await Promise.all([
                api.partyManagement.parties(),
                api.partyManagement.jurisdictions(),
                api.partyManagement.regulatoryProfiles(),
            ]);
            setParties(partiesRes.data ?? []);
            setJurisdictions(jurRes.data ?? []);
            setRegulatoryProfiles(profilesRes.data ?? []);
        } catch {
            setError('Не удалось загрузить данные.');
        }
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        api.users.me()
            .then(res => {
                if (active) setCompanyId(res?.data?.companyId ?? null);
                return fetchAll();
            })
            .catch(() => { if (active) setError('Не удалось определить компанию.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [fetchAll]);

    // ─── Party CRUD ───────────────────────────────────────────────

    const handleCreateParty = async (e: React.FormEvent) => {
        e.preventDefault();
        setPartySubmitting(true); setPartyError(null); setPartySuccess(null);
        try {
            await api.partyManagement.createParty({
                legalName: partyLegalName.trim(),
                jurisdictionId: partyJurisdictionId,
                regulatoryProfileId: partyProfileId || undefined,
            });
            setPartySuccess('Контрагент создан');
            setPartyLegalName(''); setPartyJurisdictionId(''); setPartyProfileId('');
            setTimeout(() => { setShowPartyForm(false); setPartySuccess(null); }, 1200);
            await fetchAll();
        } catch (err) { setPartyError(errMsg(err)); }
        finally { setPartySubmitting(false); }
    };

    // ─── Jurisdiction CRUD ────────────────────────────────────────

    const handleCreateJur = async (e: React.FormEvent) => {
        e.preventDefault();
        setJurSubmitting(true); setJurError(null);
        try {
            await api.partyManagement.createJurisdiction({ code: jurCode.trim().toUpperCase(), name: jurName.trim() });
            setJurCode(''); setJurName(''); setShowJurForm(false); await fetchAll();
        } catch (err) { setJurError(errMsg(err)); }
        finally { setJurSubmitting(false); }
    };

    const handleUpdateJur = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingJurId) return;
        setJurUpdating(true); setJurError(null);
        try {
            await api.partyManagement.updateJurisdiction(editingJurId, {
                code: editJurCode.trim().toUpperCase(), name: editJurName.trim(),
            });
            setEditingJurId(null); await fetchAll();
        } catch (err) { setJurError(errMsg(err)); }
        finally { setJurUpdating(false); }
    };

    const handleDeleteJur = async (j: Jurisdiction) => {
        if (!window.confirm(`Удалить юрисдикцию "${j.code}"?`)) return;
        setJurDeletingId(j.id); setJurError(null);
        try { await api.partyManagement.deleteJurisdiction(j.id); await fetchAll(); }
        catch (err) { setJurError(errMsg(err)); }
        finally { setJurDeletingId(null); }
    };

    // ─── RegulatoryProfile CRUD ───────────────────────────────────

    const resetProfForm = () => {
        setEditingProfId(null); setProfCode(''); setProfName(''); setProfJurId('');
        setProfVatRate(''); setProfVatReduced(''); setProfCrossVat('0');
        setProfPayerStatus('PAYER'); setProfSupplyType('GOODS'); setProfCurrency('RUB');
        setProfEffectiveFrom('2026-01-01'); setProfEffectiveTo(''); setProfNotes('');
        setProfError(null); setProfSuccess(null); setProfJurWarning(false);
    };

    const openCreateProfForm = () => { resetProfForm(); setShowProfForm(true); };

    const openEditProfForm = (rp: RegulatoryProfile) => {
        resetProfForm();
        setEditingProfId(rp.id);
        setProfCode(rp.code);
        setProfName(rp.name);
        setProfJurId(rp.jurisdiction.id);
        const r = rp.rulesJson ?? {};
        setProfVatRate(r.vatRate !== undefined ? String(Math.round(r.vatRate * 100)) : '');
        setProfVatReduced(r.vatRateReduced !== undefined ? String(Math.round(r.vatRateReduced * 100)) : '');
        setProfCrossVat(r.crossBorderVatRate !== undefined ? String(Math.round(r.crossBorderVatRate * 100)) : '0');
        setProfPayerStatus(r.vatPayerStatus ?? 'PAYER');
        setProfSupplyType(r.supplyType ?? 'GOODS');
        setProfCurrency(r.currencyCode ?? 'RUB');
        setProfEffectiveFrom(r.effectiveFrom ?? '2026-01-01');
        setProfEffectiveTo(r.effectiveTo ?? '');
        setProfNotes(r.notes ?? '');
        setShowProfForm(true);
    };

    const buildRulesJson = () => ({
        vatRate: parseFloat(profVatRate) || 0,
        vatRateReduced: profVatReduced ? parseFloat(profVatReduced) : undefined,
        crossBorderVatRate: parseFloat(profCrossVat) || 0,
        vatPayerStatus: profPayerStatus,
        supplyType: profSupplyType,
        currencyCode: profCurrency,
        effectiveFrom: profEffectiveFrom,
        effectiveTo: profEffectiveTo || undefined,
        notes: profNotes || undefined,
    });

    const validateRules = () => {
        const v = parseFloat(profVatRate);
        if (isNaN(v) || v < 0 || v > 100) return 'Ставка НДС должна быть от 0 до 100';
        const r = parseFloat(profVatReduced);
        if (profVatReduced && (isNaN(r) || r < 0 || r > 100)) return 'Льготная ставка должна быть от 0 до 100';
        if (!profJurId) return 'Выберите юрисдикцию';
        if (!profCode.trim()) return 'Введите код профиля';
        if (!profName.trim()) return 'Введите наименование';
        return null;
    };

    const handleSaveProf = async (e: React.FormEvent) => {
        e.preventDefault();
        const validErr = validateRules();
        if (validErr) { setProfError(validErr); return; }
        setProfSubmitting(true); setProfError(null); setProfSuccess(null);
        try {
            if (editingProfId) {
                await api.partyManagement.updateRegulatoryProfile(editingProfId, {
                    name: profName.trim(),
                    jurisdictionId: profJurId,
                    rulesJson: buildRulesJson(),
                });
                setProfSuccess('Профиль обновлён');
            } else {
                await api.partyManagement.createRegulatoryProfile({
                    code: profCode.trim().toUpperCase(),
                    name: profName.trim(),
                    jurisdictionId: profJurId,
                    rulesJson: buildRulesJson(),
                });
                setProfSuccess('Профиль создан');
            }
            await fetchAll();
            setTimeout(() => { setShowProfForm(false); resetProfForm(); }, 1200);
        } catch (err) { setProfError(errMsg(err)); }
        finally { setProfSubmitting(false); }
    };

    const handleDeleteProf = async (rp: RegulatoryProfile) => {
        if (rp.isSystemPreset) { alert('Системный пресет нельзя удалить.'); return; }
        if (!window.confirm(`Удалить профиль "${rp.code}"?`)) return;
        setProfDeleting(rp.id); setProfError(null);
        try { await api.partyManagement.deleteRegulatoryProfile(rp.id); await fetchAll(); }
        catch (err) { setProfError(errMsg(err)); }
        finally { setProfDeleting(null); }
    };

    // ─── UI ───────────────────────────────────────────────────────

    const TABS: { key: Tab; label: string }[] = [
        { key: 'parties', label: 'Контрагенты' },
        { key: 'reg-profiles', label: 'Рег. профили' },
        { key: 'jurisdictions', label: 'Юрисдикции' },
    ];

    return (
        <div className="space-y-6" data-testid="parties-page">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-gray-900">Контрагенты (Party)</h1>
                <div className="flex gap-2">
                    {tab === 'parties' && (
                        <button
                            type="button"
                            onClick={() => setShowPartyForm(!showPartyForm)}
                            className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            {showPartyForm ? 'Отмена' : '+ Добавить контрагента'}
                        </button>
                    )}
                    {tab === 'reg-profiles' && (
                        <button
                            type="button"
                            onClick={openCreateProfForm}
                            className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            + Добавить профиль
                        </button>
                    )}
                    {tab === 'jurisdictions' && (
                        <button
                            type="button"
                            onClick={() => setShowJurForm(!showJurForm)}
                            className="rounded-2xl bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            {showJurForm ? 'Отмена' : '+ Юрисдикция'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-black/10">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === t.key
                                ? 'border-b-2 border-black text-gray-900'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: Контрагенты ─────────────────────────────────────── */}
            {tab === 'parties' && (
                <>
                    {showPartyForm && (
                        <Card className="rounded-2xl border-black/10">
                            <h2 className="mb-4 text-base font-medium text-gray-900">Новый контрагент</h2>
                            {jurisdictions.length === 0 ? (
                                <p className="text-sm text-amber-700">⚠ Сначала создайте юрисдикцию на вкладке «Юрисдикции».</p>
                            ) : (
                                <form onSubmit={handleCreateParty} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Юридическое наименование *</label>
                                        <input
                                            type="text" value={partyLegalName}
                                            onChange={e => setPartyLegalName(e.target.value)}
                                            placeholder="ООО «Агрохолдинг Рассвет»"
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs text-gray-500">Юрисдикция *</label>
                                            <select value={partyJurisdictionId} onChange={e => setPartyJurisdictionId(e.target.value)}
                                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required>
                                                <option value="">Выберите</option>
                                                {jurisdictions.map(j => <option key={j.id} value={j.id}>{j.code} — {j.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-gray-500">Регуляторный профиль</label>
                                            <select value={partyProfileId} onChange={e => setPartyProfileId(e.target.value)}
                                                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm">
                                                <option value="">Не задан</option>
                                                {regulatoryProfiles.map(rp => <option key={rp.id} value={rp.id}>{rp.code} — {rp.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {partyError && <p className="text-sm text-red-700">{partyError}</p>}
                                    {partySuccess && <p className="text-sm text-emerald-700">{partySuccess}</p>}
                                    <button type="submit" disabled={partySubmitting}
                                        className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                                        {partySubmitting ? 'Создание...' : 'Создать контрагента'}
                                    </button>
                                </form>
                            )}
                        </Card>
                    )}

                    <Card className="rounded-2xl border-black/10">
                        {loading && <p className="text-sm text-gray-500">Загрузка...</p>}
                        {!loading && error && <p className="text-sm text-red-700">{error}</p>}
                        {!loading && !error && parties.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-sm text-gray-500">Контрагенты не созданы.</p>
                            </div>
                        )}
                        {!loading && !error && parties.length > 0 && (
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
                                        {parties.map(party => (
                                            <tr key={party.id} data-testid={`party-row-${party.id}`}
                                                className="border-b border-black/5 hover:bg-gray-50">
                                                <td className="px-3 py-2 font-normal">{party.legalName}</td>
                                                <td className="px-3 py-2">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                        {party.jurisdiction.code}
                                                    </span>{' '}{party.jurisdiction.name}
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">
                                                    {party.regulatoryProfile
                                                        ? `${party.regulatoryProfile.code} — ${party.regulatoryProfile.name}`
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-400">
                                                    {new Date(party.createdAt).toLocaleDateString('ru-RU')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* ─── TAB: Рег. профили ────────────────────────────────────── */}
            {tab === 'reg-profiles' && (
                <>
                    {showProfForm && (
                        <Card className="rounded-2xl border-black/10">
                            <h2 className="mb-4 text-base font-medium text-gray-900">
                                {editingProfId ? 'Редактировать профиль' : 'Новый регуляторный профиль'}
                            </h2>
                            <form onSubmit={handleSaveProf} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Код *</label>
                                        <input type="text" value={profCode} onChange={e => setProfCode(e.target.value)}
                                            placeholder="RU_OSN_2026" disabled={!!editingProfId}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                            required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Наименование *</label>
                                        <input type="text" value={profName} onChange={e => setProfName(e.target.value)}
                                            placeholder="РФ — Стандарт ОСН"
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-gray-500">Юрисдикция *</label>
                                    <select value={profJurId}
                                        onChange={e => {
                                            if (editingProfId && profJurId && e.target.value !== profJurId) {
                                                setProfJurWarning(true);
                                            } else {
                                                setProfJurWarning(false);
                                            }
                                            setProfJurId(e.target.value);
                                        }}
                                        className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required>
                                        <option value="">Выберите юрисдикцию</option>
                                        {jurisdictions.map(j => <option key={j.id} value={j.id}>{j.code} — {j.name}</option>)}
                                    </select>
                                    {profJurWarning && (
                                        <p className="mt-1 text-xs text-amber-600">
                                            ⚠ Смена юрисдикции — проверьте валюту и ставки НДС.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">НДС основной % (0–100) *</label>
                                        <input type="number" value={profVatRate}
                                            onChange={e => setProfVatRate(e.target.value)}
                                            min={0} max={100} step={0.1} placeholder="22"
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">НДС льготный % (опц.)</label>
                                        <input type="number" value={profVatReduced}
                                            onChange={e => setProfVatReduced(e.target.value)}
                                            min={0} max={100} step={0.1} placeholder="10"
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">НДС кросс-грн. %</label>
                                        <input type="number" value={profCrossVat}
                                            onChange={e => setProfCrossVat(e.target.value)}
                                            min={0} max={100} step={0.1} placeholder="0"
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Статус плательщика</label>
                                        <select value={profPayerStatus} onChange={e => setProfPayerStatus(e.target.value)}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm">
                                            <option value="PAYER">PAYER — Плательщик НДС</option>
                                            <option value="NON_PAYER">NON_PAYER — Не плательщик</option>
                                            <option value="USN_5">USN_5 — УСН 5%</option>
                                            <option value="USN_7">USN_7 — УСН 7%</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Тип поставки</label>
                                        <select value={profSupplyType} onChange={e => setProfSupplyType(e.target.value)}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm">
                                            <option value="GOODS">GOODS — Товары</option>
                                            <option value="SERVICE">SERVICE — Услуги</option>
                                            <option value="LEASE">LEASE — Аренда</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Валюта</label>
                                        <select value={profCurrency} onChange={e => setProfCurrency(e.target.value)}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm">
                                            <option value="RUB">RUB — Рубль</option>
                                            <option value="BYN">BYN — Белорусский рубль</option>
                                            <option value="KZT">KZT — Тенге</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Действует с *</label>
                                        <input type="date" value={profEffectiveFrom} onChange={e => setProfEffectiveFrom(e.target.value)}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">Действует по (опц.)</label>
                                        <input type="date" value={profEffectiveTo} onChange={e => setProfEffectiveTo(e.target.value)}
                                            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-gray-500">Примечание</label>
                                    <textarea value={profNotes} onChange={e => setProfNotes(e.target.value)}
                                        rows={2} placeholder="Нормативная база, особые условия..."
                                        className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" />
                                </div>

                                {profError && <p className="text-sm text-red-700">{profError}</p>}
                                {profSuccess && <p className="text-sm text-emerald-700">{profSuccess}</p>}

                                <div className="flex gap-3">
                                    <button type="submit" disabled={profSubmitting}
                                        className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                                        {profSubmitting ? 'Сохранение...' : (editingProfId ? 'Сохранить' : 'Создать профиль')}
                                    </button>
                                    <button type="button" onClick={() => { setShowProfForm(false); resetProfForm(); }}
                                        className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-gray-700">
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </Card>
                    )}

                    <Card className="rounded-2xl border-black/10">
                        {loading && <p className="text-sm text-gray-500">Загрузка...</p>}
                        {!loading && profError && !showProfForm && <p className="mb-3 text-sm text-red-700">{profError}</p>}
                        {!loading && regulatoryProfiles.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-gray-500">Регуляторные профили не созданы.</p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Нажмите «+ Добавить профиль» или запустите seed-скрипт пресетов 2026.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-gray-700">
                                    <thead>
                                        <tr className="border-b border-black/10 text-left">
                                            <th className="px-3 py-2 font-medium text-gray-900">Код</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Наименование</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Юрисдикция</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">НДС осн.</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">НДС льготн.</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Кросс</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Режим</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Валюта</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">С</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regulatoryProfiles.map(rp => (
                                            <tr key={rp.id}
                                                data-testid={`reg-profile-row-${rp.id}`}
                                                className="border-b border-black/5 hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                                                        {rp.code}
                                                    </span>
                                                    {rp.isSystemPreset && (
                                                        <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                                            SYSTEM
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-gray-800">{rp.name}</td>
                                                <td className="px-3 py-2">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                        {rp.jurisdiction.code}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 font-mono text-gray-800">
                                                    {pct(rp.rulesJson?.vatRate)}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-gray-500">
                                                    {pct(rp.rulesJson?.vatRateReduced)}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-gray-500">
                                                    {pct(rp.rulesJson?.crossBorderVatRate)}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-500">
                                                    {rp.rulesJson?.vatPayerStatus ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-500">
                                                    {rp.rulesJson?.currencyCode ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-400">
                                                    {rp.rulesJson?.effectiveFrom ?? '—'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditProfForm(rp)}
                                                            className="text-xs text-gray-600 underline underline-offset-2 hover:text-gray-900"
                                                        >
                                                            Изменить
                                                        </button>
                                                        {!rp.isSystemPreset && (
                                                            <button
                                                                type="button"
                                                                disabled={profDeleting === rp.id}
                                                                onClick={() => handleDeleteProf(rp)}
                                                                className="text-xs text-red-600 underline underline-offset-2 disabled:opacity-50"
                                                            >
                                                                {profDeleting === rp.id ? '...' : 'Удалить'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <p className="text-xs text-gray-400">
                        💡 Системные пресеты (отмечены SYSTEM) нельзя удалить. Для добавления пресетов запустите:{' '}
                        <code className="rounded bg-gray-100 px-1">npx ts-node apps/api/seed_regulatory_presets.ts</code>
                    </p>
                </>
            )}

            {/* ─── TAB: Юрисдикции ─────────────────────────────────────── */}
            {tab === 'jurisdictions' && (
                <>
                    {showJurForm && (
                        <Card className="rounded-2xl border-black/10">
                            <h2 className="mb-4 text-base font-medium text-gray-900">Добавить юрисдикцию</h2>
                            <form onSubmit={handleCreateJur} className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs text-gray-500">Код</label>
                                    <input type="text" value={jurCode} onChange={e => setJurCode(e.target.value)}
                                        placeholder="RU" className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required />
                                </div>
                                <div className="flex-[2]">
                                    <label className="mb-1 block text-xs text-gray-500">Наименование</label>
                                    <input type="text" value={jurName} onChange={e => setJurName(e.target.value)}
                                        placeholder="Российская Федерация"
                                        className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm" required />
                                </div>
                                <button type="submit" disabled={jurSubmitting}
                                    className="rounded-2xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                                    {jurSubmitting ? '...' : 'Добавить'}
                                </button>
                            </form>
                            {jurError && <p className="mt-3 text-sm text-red-700">{jurError}</p>}
                        </Card>
                    )}

                    <Card className="rounded-2xl border-black/10">
                        {loading && <p className="text-sm text-gray-500">Загрузка...</p>}
                        {!loading && jurisdictions.length === 0 && (
                            <p className="text-sm text-gray-500 py-4 text-center">Юрисдикции не созданы.</p>
                        )}
                        {!loading && jurisdictions.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-gray-700">
                                    <thead>
                                        <tr className="border-b border-black/10 text-left">
                                            <th className="px-3 py-2 font-medium text-gray-900">Код</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Наименование</th>
                                            <th className="px-3 py-2 font-medium text-gray-900">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jurisdictions.map(j => (
                                            <tr key={j.id} className="border-b border-black/5 hover:bg-gray-50">
                                                {editingJurId === j.id ? (
                                                    <>
                                                        <td className="px-3 py-1.5">
                                                            <input type="text" value={editJurCode}
                                                                onChange={e => setEditJurCode(e.target.value)}
                                                                className="w-24 rounded-lg border border-black/10 px-3 py-1 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input type="text" value={editJurName}
                                                                onChange={e => setEditJurName(e.target.value)}
                                                                className="w-64 rounded-lg border border-black/10 px-3 py-1 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <form onSubmit={handleUpdateJur} className="flex gap-2">
                                                                <button type="submit" disabled={jurUpdating}
                                                                    className="text-xs text-black underline underline-offset-2 disabled:opacity-50">
                                                                    {jurUpdating ? '...' : 'Сохранить'}
                                                                </button>
                                                                <button type="button" onClick={() => setEditingJurId(null)}
                                                                    className="text-xs text-gray-500 underline underline-offset-2">
                                                                    Отмена
                                                                </button>
                                                            </form>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-3 py-2">
                                                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">{j.code}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-800">{j.name}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex gap-3">
                                                                <button type="button"
                                                                    onClick={() => { setEditingJurId(j.id); setEditJurCode(j.code); setEditJurName(j.name); }}
                                                                    className="text-xs text-gray-600 underline underline-offset-2 hover:text-gray-900">
                                                                    Изменить
                                                                </button>
                                                                <button type="button"
                                                                    disabled={jurDeletingId === j.id}
                                                                    onClick={() => handleDeleteJur(j)}
                                                                    className="text-xs text-red-600 underline underline-offset-2 disabled:opacity-50">
                                                                    {jurDeletingId === j.id ? '...' : 'Удалить'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {jurError && <p className="mt-3 text-sm text-red-700">{jurError}</p>}
                    </Card>
                </>
            )}

            {/* Stats bar */}
            {!loading && !error && (
                <div className="flex gap-4">
                    {[
                        { label: 'Контрагентов', val: parties.length },
                        { label: 'Юрисдикций', val: jurisdictions.length },
                        { label: 'Рег. профилей', val: regulatoryProfiles.length },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                            <p className="text-xs text-gray-500">{s.label}</p>
                            <p className="text-lg font-medium text-gray-900">{s.val}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Landmark, Pencil, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { BankAccountSchema, PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { cn } from '@/lib/utils';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { getBankLookupReferenceMismatches } from '@/shared/lib/party-bank-validation';

export function PartyBankAccountsTab() {
    const { control, formState: { errors }, watch, setValue } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [saveHint, setSaveHint] = useState<string | null>(null);

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'bankAccounts',
    });

    const handleAdd = () => {
        setEditingIndex(null);
        setIsDrawerOpen(true);
        setSaveHint(null);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setIsDrawerOpen(true);
        setSaveHint(null);
    };

    const handleSaveRow = (data: any) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
            setSaveHint('Счет обновлен в карточке. Следующий шаг: нажмите основной "Сохранить", чтобы записать изменения в базу.');
        } else {
            append(data);
            setSaveHint('Счет добавлен в карточку. Следующий шаг: нажмите основной "Сохранить", чтобы записать его в базу.');
        }
        setIsDrawerOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-medium text-gray-900 tracking-tight">Банковские реквизиты</h2>
                </div>
                {isEdit && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAdd}
                        className="h-8 px-4 rounded-xl border-black/10 bg-white hover:bg-black hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Добавить счет
                    </Button>
                )}
            </div>

            <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                {saveHint ? (
                    <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800">
                        {saveHint}
                    </div>
                ) : null}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-black/5 bg-gray-50/50">
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[25%] transition-colors">Банк</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[30%] transition-colors">IBAN / Номер счета</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[15%] transition-colors">БИК</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[10%] transition-colors">Валюта</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[10%] transition-colors text-center">Статус</th>
                                {isEdit && <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[10%] text-right transition-colors">Действия</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {fields.map((field, index) => (
                                <tr key={field.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-gray-900 leading-none">{field.bankName || '—'}</span>
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{field.accountName || 'Без названия'}</span>
                                                {field.status ? (
                                                    <span className={cn(
                                                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                                                        field.status === 'ACTIVE'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700',
                                                    )}>
                                                        {field.status === 'ACTIVE' ? 'Банк активен' : field.status}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {field.inn || field.kpp ? (
                                                <span className="text-[10px] text-gray-500">
                                                    {[field.inn ? `ИНН ${field.inn}` : null, field.kpp ? `КПП ${field.kpp}` : null]
                                                        .filter(Boolean)
                                                        .join(' • ')}
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[12px] text-gray-700 bg-gray-50/50 px-2 py-0.5 rounded border border-black/5 leading-none">
                                            {field.accountNumber || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[12px] text-gray-600">
                                            {field.bic || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                                            {field.currency || 'RUB'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {field.isPrimary ? (
                                            <div className="flex items-center justify-center text-green-600 transition-colors" title="Основной счет">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center text-gray-200 transition-colors">
                                                <CheckCircle2 className="h-4 w-4 opacity-20" />
                                            </div>
                                        )}
                                    </td>
                                    {isEdit && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(index)}
                                                    className="p-1.5 text-gray-400 hover:text-black hover:bg-black/5 rounded-lg transition-all shadow-none"
                                                    title="Редактировать"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-none"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {fields.length === 0 && (
                                <tr>
                                    <td colSpan={isEdit ? 6 : 5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5 border-dashed">
                                                <Landmark className="h-5 w-5 text-gray-300" />
                                            </div>
                                            <span className="text-sm font-normal text-gray-400">Банковские счета не добавлены</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BankAccountDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSaveRow}
                initialData={editingIndex !== null ? fields[editingIndex] : null}
            />
        </div>
    );
}

function BankAccountDrawer({ open, onClose, onSave, initialData }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
}) {
    const [data, setData] = useState({
        accountName: '',
        accountNumber: '',
        bic: '',
        bankName: '',
        swift: '',
        corrAccount: '',
        inn: '',
        kpp: '',
        address: '',
        status: '',
        lookupSource: '',
        lookupReferenceBankName: '',
        lookupReferenceCorrAccount: '',
        lookupReferenceInn: '',
        lookupReferenceKpp: '',
        currency: 'RUB',
        isPrimary: false,
    });
    const [lookupState, setLookupState] = useState<{
        status: 'idle' | 'loading' | 'success' | 'not_found' | 'error';
        message?: string;
        source?: string;
    }>({ status: 'idle' });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<'accountName' | 'accountNumber' | 'bic' | 'corrAccount' | 'bankName' | 'inn' | 'kpp', string>>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const lastLookupBicRef = useRef<string>('');

    useEffect(() => {
        if (!open) {
            return;
        }

        if (initialData) {
            setData({
                accountName: initialData.accountName || '',
                accountNumber: initialData.accountNumber || '',
                bic: initialData.bic || '',
                bankName: initialData.bankName || '',
                swift: initialData.swift || '',
                corrAccount: initialData.corrAccount || '',
                inn: initialData.inn || '',
                kpp: initialData.kpp || '',
                address: initialData.address || '',
                status: initialData.status || '',
                lookupSource: initialData.lookupSource || '',
                lookupReferenceBankName: initialData.lookupReferenceBankName || '',
                lookupReferenceCorrAccount: initialData.lookupReferenceCorrAccount || '',
                lookupReferenceInn: initialData.lookupReferenceInn || '',
                lookupReferenceKpp: initialData.lookupReferenceKpp || '',
                currency: initialData.currency || 'RUB',
                isPrimary: initialData.isPrimary || false,
            });
            lastLookupBicRef.current = initialData.bic || '';
            setLookupState({ status: 'idle' });
            setFieldErrors({});
            setSubmitError(null);
            return;
        }

        setData({
            accountName: '',
            accountNumber: '',
            bic: '',
            bankName: '',
            swift: '',
            corrAccount: '',
            inn: '',
            kpp: '',
            address: '',
            status: '',
            lookupSource: '',
            lookupReferenceBankName: '',
            lookupReferenceCorrAccount: '',
            lookupReferenceInn: '',
            lookupReferenceKpp: '',
            currency: 'RUB',
            isPrimary: false,
        });
        lastLookupBicRef.current = '';
        setLookupState({ status: 'idle' });
        setFieldErrors({});
        setSubmitError(null);
    }, [initialData, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const normalizedBic = data.bic.replace(/\D/g, '');
        if (normalizedBic.length !== 9) {
            if (lookupState.status !== 'idle') {
                setLookupState({ status: 'idle' });
            }
            return;
        }

        if (lastLookupBicRef.current === normalizedBic) {
            return;
        }

        let active = true;
        const timer = window.setTimeout(async () => {
            setLookupState({ status: 'loading', message: 'Проверяем БИК в банковом справочнике…' });
            try {
                const response = await partyAssetsApi.lookupBankByBic(normalizedBic);
                if (!active) {
                    return;
                }
                lastLookupBicRef.current = normalizedBic;

                if (response.status === 'FOUND' && response.result) {
                    setData((prev) => ({
                        ...prev,
                        bic: normalizedBic,
                        bankName: response.result?.paymentName || response.result?.bankName || prev.bankName,
                        swift: response.result?.swift || prev.swift,
                        corrAccount: response.result?.corrAccount || prev.corrAccount,
                        inn: response.result?.inn || prev.inn,
                        kpp: response.result?.kpp || prev.kpp,
                        address: response.result?.address || prev.address,
                        status: response.result?.status || prev.status,
                        lookupSource: response.source || prev.lookupSource,
                        lookupReferenceBankName: response.result?.paymentName || response.result?.bankName || prev.lookupReferenceBankName,
                        lookupReferenceCorrAccount: response.result?.corrAccount || prev.lookupReferenceCorrAccount,
                        lookupReferenceInn: response.result?.inn || prev.lookupReferenceInn,
                        lookupReferenceKpp: response.result?.kpp || prev.lookupReferenceKpp,
                    }));
                    setLookupState({
                        status: 'success',
                        source: response.source,
                        message: response.result?.corrAccount
                            ? `Банк и корр. счет заполнены автоматически из ${response.source}.`
                            : `Банк найден в ${response.source}. Проверь корр. счет вручную.`,
                    });
                    return;
                }

                if (response.status === 'NOT_FOUND') {
                    setLookupState({
                        status: 'not_found',
                        source: response.source,
                        message: 'По этому БИК банк не найден. Проверь цифры или заполни реквизиты вручную.',
                    });
                    return;
                }

                setLookupState({
                    status: 'error',
                    source: response.source,
                    message: response.error || 'Не удалось получить реквизиты банка автоматически.',
                });
            } catch (error) {
                if (!active) {
                    return;
                }
                console.error('Bank lookup failed:', error);
                setLookupState({
                    status: 'error',
                    message: 'Сервис автозаполнения банка сейчас недоступен. Поля можно заполнить вручную.',
                });
            }
        }, 450);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [data.bic, lookupState.status, open]);

    const isAdd = !initialData;
    const lookupMismatches = getBankLookupReferenceMismatches(data);

    const handleDrawerSave = () => {
        const parsed = BankAccountSchema.safeParse(data);

        if (!parsed.success) {
            const flattened = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                accountName: flattened.accountName?.[0],
                accountNumber: flattened.accountNumber?.[0],
                bic: flattened.bic?.[0],
                corrAccount: flattened.corrAccount?.[0],
                bankName: flattened.bankName?.[0],
                inn: flattened.inn?.[0],
                kpp: flattened.kpp?.[0],
            });
            setSubmitError('Счет не добавлен в карточку. Исправьте поля с ошибками и затем нажмите "Добавить счет в карточку".');
            return;
        }

        setFieldErrors({});
        setSubmitError(null);
        onSave(parsed.data);
    };

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? "Новый банковский счет" : "Редактирование счета"}>
            <div className="space-y-6 pt-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
                    Шаг 1: заполните реквизиты и нажмите "Добавить счет в карточку". Шаг 2: нажмите основной "Сохранить" в карточке контрагента.
                </div>
                {submitError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
                        {submitError}
                    </div>
                ) : null}
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Назначение счета</label>
                        <Input
                            value={data.accountName}
                            onChange={e => {
                                setData({ ...data, accountName: e.target.value });
                                setFieldErrors((prev) => ({ ...prev, accountName: undefined }));
                            }}
                            placeholder="Напр. Основной расчетный счет"
                            className={cn('h-11 rounded-xl focus:ring-black/5', fieldErrors.accountName ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                        />
                        {fieldErrors.accountName ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.accountName}</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Валюта</label>
                            <select
                                value={data.currency}
                                onChange={e => setData({ ...data, currency: e.target.value })}
                                className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                            >
                                <option value="RUB">RUB — Рубль</option>
                                <option value="USD">USD — Доллар</option>
                                <option value="EUR">EUR — Евро</option>
                                <option value="CNY">CNY — Юань</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.isPrimary}
                                    onChange={e => setData({ ...data, isPrimary: e.target.checked })}
                                    className="h-5 w-5 rounded border-black/10 text-black focus:ring-black/5"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">Основной счет</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Номер счета</label>
                        <Input
                            value={data.accountNumber}
                            onChange={e => {
                                const normalized = e.target.value.replace(/\D/g, '').slice(0, 20);
                                setData({ ...data, accountNumber: normalized });
                                setFieldErrors((prev) => ({ ...prev, accountNumber: undefined }));
                            }}
                            placeholder="40702810..."
                            className={cn('h-11 rounded-xl font-mono focus:ring-black/5', fieldErrors.accountNumber ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                        />
                        {fieldErrors.accountNumber ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.accountNumber}</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">БИК</label>
                            <Input
                                value={data.bic}
                                onChange={e => {
                                    const normalizedBic = e.target.value.replace(/\D/g, '').slice(0, 9);
                                    if (normalizedBic !== lastLookupBicRef.current) {
                                    setLookupState({ status: 'idle' });
                                }
                                setData({
                                    ...data,
                                    bic: normalizedBic,
                                        swift: normalizedBic === data.bic ? data.swift : '',
                                        corrAccount: normalizedBic === data.bic ? data.corrAccount : '',
                                        inn: normalizedBic === data.bic ? data.inn : '',
                                        kpp: normalizedBic === data.bic ? data.kpp : '',
                                        address: normalizedBic === data.bic ? data.address : '',
                                        status: normalizedBic === data.bic ? data.status : '',
                                        lookupSource: normalizedBic === data.bic ? data.lookupSource : '',
                                        lookupReferenceBankName: normalizedBic === data.bic ? data.lookupReferenceBankName : '',
                                        lookupReferenceCorrAccount: normalizedBic === data.bic ? data.lookupReferenceCorrAccount : '',
                                        lookupReferenceInn: normalizedBic === data.bic ? data.lookupReferenceInn : '',
                                        lookupReferenceKpp: normalizedBic === data.bic ? data.lookupReferenceKpp : '',
                                    });
                                    setFieldErrors((prev) => ({ ...prev, bic: undefined, corrAccount: undefined, accountNumber: undefined, bankName: undefined, inn: undefined, kpp: undefined }));
                                }}
                                placeholder="044525..."
                                className={cn('h-11 rounded-xl font-mono focus:ring-black/5', fieldErrors.bic ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                            />
                            {fieldErrors.bic ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.bic}</div> : null}
                            <div className="min-h-[18px] pt-1">
                                {lookupState.status === 'loading' ? (
                                    <div className="flex items-center gap-2 text-[11px] text-blue-600">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>{lookupState.message}</span>
                                    </div>
                                ) : null}
                                {lookupState.status === 'success' ? (
                                    <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>{lookupState.message}</span>
                                    </div>
                                ) : null}
                                {lookupState.status === 'not_found' ? (
                                    <div className="flex items-center gap-2 text-[11px] text-amber-700">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{lookupState.message}</span>
                                    </div>
                                ) : null}
                                {lookupState.status === 'error' ? (
                                    <div className="flex items-center gap-2 text-[11px] text-red-600">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{lookupState.message}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Корр. счет</label>
                            <Input
                                value={data.corrAccount}
                                onChange={e => {
                                    const normalized = e.target.value.replace(/\D/g, '').slice(0, 20);
                                    setData({ ...data, corrAccount: normalized });
                                    setFieldErrors((prev) => ({ ...prev, corrAccount: undefined }));
                                }}
                                placeholder="30101810..."
                                className={cn('h-11 rounded-xl font-mono focus:ring-black/5', fieldErrors.corrAccount ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                            />
                            {fieldErrors.corrAccount ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.corrAccount}</div> : null}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Наименование банка</label>
                        <Input
                            value={data.bankName}
                            onChange={e => {
                                setData({ ...data, bankName: e.target.value });
                                setFieldErrors((prev) => ({ ...prev, bankName: undefined }));
                            }}
                            placeholder="Заполнится по БИК или введи вручную"
                            className={cn('h-11 rounded-xl focus:ring-black/5', fieldErrors.bankName ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                        />
                        {fieldErrors.bankName ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.bankName}</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">ИНН банка</label>
                            <Input
                                value={data.inn}
                                onChange={e => {
                                    const normalized = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setData({ ...data, inn: normalized });
                                    setFieldErrors((prev) => ({ ...prev, inn: undefined }));
                                }}
                                placeholder="7707083893"
                                className={cn('h-11 rounded-xl font-mono focus:ring-black/5', fieldErrors.inn ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                            />
                            {fieldErrors.inn ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.inn}</div> : null}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">КПП банка</label>
                            <Input
                                value={data.kpp}
                                onChange={e => {
                                    const normalized = e.target.value.replace(/\D/g, '').slice(0, 9);
                                    setData({ ...data, kpp: normalized });
                                    setFieldErrors((prev) => ({ ...prev, kpp: undefined }));
                                }}
                                placeholder="623402001"
                                className={cn('h-11 rounded-xl font-mono focus:ring-black/5', fieldErrors.kpp ? 'border-red-300 focus:ring-red-100' : 'border-black/10')}
                            />
                            {fieldErrors.kpp ? <div className="px-1 text-[11px] text-red-600">{fieldErrors.kpp}</div> : null}
                        </div>
                    </div>

                    {(data.status || data.inn || data.kpp || data.address) ? (
                        <div className="rounded-2xl border border-black/10 bg-gray-50/70 px-4 py-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Данные банка из справочника</div>
                            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700">
                                {data.status ? (
                                    <div>
                                        <span className="text-gray-500">Статус: </span>
                                        <span className="font-medium">{data.status === 'ACTIVE' ? 'ACTIVE / Банк действует' : data.status}</span>
                                    </div>
                                ) : null}
                                {(data.inn || data.kpp) ? (
                                    <div>
                                        <span className="text-gray-500">Реквизиты банка: </span>
                                        <span className="font-medium">
                                            {[data.inn ? `ИНН ${data.inn}` : null, data.kpp ? `КПП ${data.kpp}` : null]
                                                .filter(Boolean)
                                                .join(' • ')}
                                        </span>
                                    </div>
                                ) : null}
                                {data.address ? (
                                    <div>
                                        <span className="text-gray-500">Адрес: </span>
                                        <span className="font-medium">{data.address}</span>
                                    </div>
                                ) : null}
                                {data.lookupSource ? (
                                    <div>
                                        <span className="text-gray-500">Источник: </span>
                                        <span className="font-medium">{data.lookupSource}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {lookupMismatches.length > 0 ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Расхождение со справочником по БИК</div>
                            <div className="mt-2 space-y-1 text-sm text-amber-800">
                                {lookupMismatches.map((mismatch) => (
                                    <div key={mismatch.field}>{mismatch.message}. Проверь, что реквизиты относятся к одному и тому же банку.</div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="pt-6">
                    <Button
                        type="button"
                        onClick={handleDrawerSave}
                        className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isAdd ? 'Добавить счет в карточку' : 'Сохранить счет в карточке'}
                    </Button>
                </div>
            </div>
        </SidePanelForm>
    );
}

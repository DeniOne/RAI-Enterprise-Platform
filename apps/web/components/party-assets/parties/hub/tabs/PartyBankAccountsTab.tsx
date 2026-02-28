'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Landmark, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { cn } from '@/lib/utils';

export function PartyBankAccountsTab() {
    const { control, formState: { errors }, watch, setValue } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'bankAccounts',
    });

    const handleAdd = () => {
        setEditingIndex(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setIsDrawerOpen(true);
    };

    const handleSaveRow = (data: any) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
        } else {
            append(data);
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
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{field.accountName || 'Без названия'}</span>
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
        corrAccount: '',
        currency: 'RUB',
        isPrimary: false,
    });

    useState(() => {
        if (initialData) {
            setData({
                accountName: initialData.accountName || '',
                accountNumber: initialData.accountNumber || '',
                bic: initialData.bic || '',
                bankName: initialData.bankName || '',
                corrAccount: initialData.corrAccount || '',
                currency: initialData.currency || 'RUB',
                isPrimary: initialData.isPrimary || false,
            });
        }
    });

    const isAdd = !initialData;

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? "Новый банковский счет" : "Редактирование счета"}>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Назначение счета</label>
                        <Input
                            value={data.accountName}
                            onChange={e => setData({ ...data, accountName: e.target.value })}
                            placeholder="Напр. Основной расчетный счет"
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                        />
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
                            onChange={e => setData({ ...data, accountNumber: e.target.value })}
                            placeholder="40702810..."
                            className="h-11 rounded-xl border-black/10 font-mono focus:ring-black/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">БИК</label>
                            <Input
                                value={data.bic}
                                onChange={e => setData({ ...data, bic: e.target.value })}
                                placeholder="044525..."
                                className="h-11 rounded-xl border-black/10 font-mono focus:ring-black/5"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Корр. счет</label>
                            <Input
                                value={data.corrAccount}
                                onChange={e => setData({ ...data, corrAccount: e.target.value })}
                                placeholder="30101810..."
                                className="h-11 rounded-xl border-black/10 font-mono focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Наименование банка</label>
                        <Input
                            value={data.bankName}
                            onChange={e => setData({ ...data, bankName: e.target.value })}
                            placeholder="АО Т-БАНК..."
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        onClick={() => onSave(data)}
                        className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isAdd ? 'Добавить счет' : 'Сохранить изменения'}
                    </Button>
                </div>
            </div>
        </SidePanelForm>
    );
}

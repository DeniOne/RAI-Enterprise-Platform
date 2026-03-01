'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Users, Pencil, Star, Mail, Phone, Calendar } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { cn } from '@/lib/utils';

const CONTACT_POSITIONS = [
    { value: 'SIGNATORY', label: 'Подписант' },
    { value: 'CEO', label: 'Генеральный директор' },
    { value: 'CHIEF_AGRONOMIST', label: 'Главный агроном' },
    { value: 'AGRONOMIST', label: 'Агроном' },
    { value: 'CHIEF_ACCOUNTANT', label: 'Главный бухгалтер' },
    { value: 'OTHER', label: 'Другое' },
];

export function PartyContactsTab() {
    const { control, formState: { errors } } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { fields, append, remove, update: updateField } = useFieldArray({
        control,
        name: 'contacts',
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
            updateField(editingIndex, data);
        } else {
            append(data);
        }
        setIsDrawerOpen(false);
    };

    const getPositionLabel = (value: string) => {
        return CONTACT_POSITIONS.find(p => p.value === value)?.label || value;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-medium text-gray-900 tracking-tight">Ключевые лица / ЛОПР</h2>
                </div>
                {isEdit && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAdd}
                        className="h-8 px-4 rounded-xl border-black/10 bg-white hover:bg-black hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Добавить лицо
                    </Button>
                )}
            </div>

            <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-black/5 bg-gray-50/50">
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[25%] transition-colors">ФИО</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[20%] transition-colors">Роль / Должность</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[25%] transition-colors">Контакты</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[15%] transition-colors">Срок полномочий</th>
                                {isEdit && <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[15%] text-right transition-colors">Действия</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {fields.map((field, index) => (
                                <tr key={field.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {field.isPrimary && (
                                                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                                            )}
                                            <span className="font-semibold text-gray-900 leading-none">{field.fullName || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100/50 text-gray-600 text-[10px] font-bold border border-black/5 uppercase tracking-wide">
                                            {getPositionLabel(field.position)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {field.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    {field.phone}
                                                </div>
                                            )}
                                            {field.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    {field.email}
                                                </div>
                                            )}
                                            {!field.phone && !field.email && <span className="text-gray-300">нет данных</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(field.validFrom || field.validTo) ? (
                                            <div className="flex flex-col gap-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-tighter">
                                                {field.validFrom && <span>с {field.validFrom}</span>}
                                                {field.validTo && <span>по {field.validTo}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    {isEdit && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(index)}
                                                    className="p-1.5 text-gray-400 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                                                    title="Редактировать"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                                    <td colSpan={isEdit ? 5 : 4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5 border-dashed">
                                                <Users className="h-5 w-5 text-gray-300" />
                                            </div>
                                            <span className="text-sm font-normal text-gray-400">Список лиц пуст</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ContactDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSaveRow}
                initialData={editingIndex !== null ? fields[editingIndex] : null}
            />
        </div>
    );
}

function ContactDrawer({ open, onClose, onSave, initialData }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
}) {
    const [data, setData] = useState({
        fullName: '',
        position: 'OTHER',
        phone: '',
        email: '',
        isPrimary: false,
        validFrom: '',
        validTo: '',
    });

    useState(() => {
        if (initialData) {
            setData({
                fullName: initialData.fullName || '',
                position: initialData.position || 'OTHER',
                phone: initialData.phone || '',
                email: initialData.email || '',
                isPrimary: initialData.isPrimary || false,
                validFrom: initialData.validFrom || '',
                validTo: initialData.validTo || '',
            });
        }
    });

    const isAdd = !initialData;

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? "Добавление ключевого лица" : "Редактирование данных"}>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">ФИО полностью</label>
                        <Input
                            value={data.fullName}
                            onChange={e => setData({ ...data, fullName: e.target.value })}
                            placeholder="Напр. Иванов Иван Иванович"
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Должность / Роль</label>
                            <select
                                value={data.position}
                                onChange={e => setData({ ...data, position: e.target.value as any })}
                                className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            >
                                {CONTACT_POSITIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.isPrimary}
                                    onChange={e => setData({ ...data, isPrimary: e.target.checked })}
                                    className="h-5 w-5 rounded border-black/10 text-black focus:ring-black/5 transition-all"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-black">Основной контакт</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Телефон</label>
                            <Input
                                value={data.phone}
                                onChange={e => setData({ ...data, phone: e.target.value })}
                                placeholder="+7..."
                                className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">E-mail</label>
                            <Input
                                value={data.email}
                                onChange={e => setData({ ...data, email: e.target.value })}
                                placeholder="example@..."
                                className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-black/5 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Срок полномочий</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Действует с</label>
                                <Input
                                    type="date"
                                    value={data.validFrom}
                                    onChange={e => setData({ ...data, validFrom: e.target.value })}
                                    className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Действует по</label>
                                <Input
                                    type="date"
                                    value={data.validTo}
                                    onChange={e => setData({ ...data, validTo: e.target.value })}
                                    className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        onClick={() => onSave(data)}
                        className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isAdd ? 'Добавить лицо' : 'Сохранить изменения'}
                    </Button>
                </div>
            </div>
        </SidePanelForm>
    );
}

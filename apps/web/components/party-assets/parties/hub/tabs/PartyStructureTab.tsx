'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import {
    Plus,
    Trash2,
    Network,
    Building2,
    Landmark,
    Calendar,
    ArrowRightLeft,
    Shield,
    Link as LinkIcon,
    Pencil,
    ExternalLink
} from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const RELATION_TYPES = [
    { value: 'PARENT', label: 'Материнская компания' },
    { value: 'CHILD', label: 'Дочерняя компания' },
    { value: 'MANAGING', label: 'Управляющая компания' },
    { value: 'MANAGED', label: 'Под управлением' },
];

const ASSET_ROLES = [
    { value: 'OWNER', label: 'Собственник' },
    { value: 'TENANT', label: 'Арендатор' },
    { value: 'OPERATOR', label: 'Оператор' },
    { value: 'PLEDGEE', label: 'Залогодержатель' },
];

export function PartyStructureTab() {
    const { control } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();

    const [editingRelationIndex, setEditingRelationIndex] = useState<number | null>(null);
    const [isRelationDrawerOpen, setIsRelationDrawerOpen] = useState(false);

    const [editingAssetIndex, setEditingAssetIndex] = useState<number | null>(null);
    const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);

    const {
        fields: relationFields,
        append: appendRelation,
        remove: removeRelation,
        update: updateRelation
    } = useFieldArray({
        control,
        name: 'relations',
    });

    const {
        fields: assetFields,
        append: appendAsset,
        remove: removeAsset,
        update: updateAsset
    } = useFieldArray({
        control,
        name: 'assetRelations',
    });

    const handleAddRelation = () => {
        setEditingRelationIndex(null);
        setIsRelationDrawerOpen(true);
    };

    const handleEditRelation = (index: number) => {
        setEditingRelationIndex(index);
        setIsRelationDrawerOpen(true);
    };

    const handleSaveRelation = (data: any) => {
        if (editingRelationIndex !== null) {
            updateRelation(editingRelationIndex, data);
        } else {
            appendRelation(data);
        }
        setIsRelationDrawerOpen(false);
    };

    const handleAddAsset = () => {
        setEditingAssetIndex(null);
        setIsAssetDrawerOpen(true);
    };

    const handleEditAsset = (index: number) => {
        setEditingAssetIndex(index);
        setIsAssetDrawerOpen(true);
    };

    const handleSaveAsset = (data: any) => {
        if (editingAssetIndex !== null) {
            updateAsset(editingAssetIndex, data);
        } else {
            appendAsset(data);
        }
        setIsAssetDrawerOpen(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Section 1: Corporate Structure */}
            <section className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-900 tracking-tight">Корпоративная структура (Холдинг / УК)</h2>
                    </div>
                    {isEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddRelation}
                            className="h-8 px-4 rounded-xl border-black/10 bg-white hover:bg-black hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Добавить связь
                        </Button>
                    )}
                </div>

                <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-black/5 bg-gray-50/50">
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[35%] transition-colors">Связанный контрагент</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[20%] transition-colors">Тип связи</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[15%] transition-colors text-center">Доля, %</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[20%] transition-colors">Период действия</th>
                                    {isEdit && <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[10%] text-right transition-colors">Действия</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {relationFields.map((field, index) => (
                                    <tr key={field.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="h-3 w-3 text-gray-400" />
                                                <span className="font-semibold text-gray-900 leading-none">{field.relatedPartyId || 'Не указан'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wide">
                                                {RELATION_TYPES.find(t => t.value === field.type)?.label || field.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-[12px] font-bold text-gray-700">
                                                {field.share || 0}%
                                            </span>
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
                                                        onClick={() => handleEditRelation(index)}
                                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                                                        title="Редактировать"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRelation(index)}
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
                                {relationFields.length === 0 && (
                                    <tr>
                                        <td colSpan={isEdit ? 5 : 4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5 border-dashed">
                                                    <ArrowRightLeft className="h-5 w-5 text-gray-300" />
                                                </div>
                                                <span className="text-sm font-normal text-gray-400">Иерархические связи не настроены</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Section 2: Operational Assets */}
            <section className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <Landmark className="h-3.5 w-3.5 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-900 tracking-tight">Операционные активы (Хозяйства / Фермы)</h2>
                    </div>
                    {isEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddAsset}
                            className="h-8 px-4 rounded-xl border-black/10 bg-white hover:bg-black hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Привязать хозяйство
                        </Button>
                    )}
                </div>

                <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-black/5 bg-gray-50/50">
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[35%] transition-colors">Объект</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[20%] transition-colors">Роль контрагента</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[35%] transition-colors">Правовое основание</th>
                                    {isEdit && <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[10%] text-right transition-colors">Действия</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {assetFields.map((field, index) => (
                                    <tr key={field.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                                <Link
                                                    href={`/assets/farms/${field.assetId}`}
                                                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1"
                                                >
                                                    {field.assetId || '—'}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                                                {ASSET_ROLES.find(r => r.value === field.role)?.label || field.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600 italic">
                                            {field.basis || 'не указано'}
                                        </td>
                                        {isEdit && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditAsset(index)}
                                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                                                        title="Редактировать"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAsset(index)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Отвязать"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {assetFields.length === 0 && (
                                    <tr>
                                        <td colSpan={isEdit ? 4 : 3} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5 border-dashed">
                                                    <Shield className="h-5 w-5 text-gray-300" />
                                                </div>
                                                <span className="text-sm font-normal text-gray-400">Привязанные хозяйства отсутствуют</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Section 3: Visual Preview (Empty State) */}
            <section className="pt-8 border-t border-black/5">
                <div className="p-12 rounded-3xl bg-gray-50/30 border-2 border-dashed border-black/5 flex flex-col items-center justify-center gap-5 text-center transition-all hover:bg-gray-50/50">
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-md border border-black/5 flex items-center justify-center animate-pulse">
                        <Network className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-base font-semibold text-gray-900">Визуальный движок структуры</h3>
                        <p className="text-xs text-gray-400 font-normal leading-relaxed">
                            Интерактивный граф иерархий и связей будет доступен после активации модуля <span className="text-blue-500 font-medium">Graph Engine v2</span>.
                        </p>
                    </div>
                    {!isEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-8 rounded-xl border-black/10 text-xs font-semibold hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                            Запросить активацию модуля
                        </Button>
                    )}
                </div>
            </section>

            <RelationDrawer
                open={isRelationDrawerOpen}
                onClose={() => setIsRelationDrawerOpen(false)}
                onSave={handleSaveRelation}
                initialData={editingRelationIndex !== null ? relationFields[editingRelationIndex] : null}
            />

            <AssetRelationDrawer
                open={isAssetDrawerOpen}
                onClose={() => setIsAssetDrawerOpen(false)}
                onSave={handleSaveAsset}
                initialData={editingAssetIndex !== null ? assetFields[editingAssetIndex] : null}
            />
        </div>
    );
}

function RelationDrawer({ open, onClose, onSave, initialData }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
}) {
    const [data, setData] = useState({
        type: 'CHILD',
        relatedPartyId: '',
        share: 0,
        validFrom: '',
        validTo: '',
    });

    useState(() => {
        if (initialData) {
            setData({
                type: initialData.type || 'CHILD',
                relatedPartyId: initialData.relatedPartyId || '',
                share: initialData.share || 0,
                validFrom: initialData.validFrom || '',
                validTo: initialData.validTo || '',
            });
        }
    });

    const isAdd = !initialData;

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? "Новая корпоративная связь" : "Редактирование связи"}>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Тип связи</label>
                        <select
                            value={data.type}
                            onChange={e => setData({ ...data, type: e.target.value as any })}
                            className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        >
                            {RELATION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Связанный контрагент</label>
                        <Input
                            value={data.relatedPartyId}
                            onChange={e => setData({ ...data, relatedPartyId: e.target.value })}
                            placeholder="Напр. ООО «Август»"
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Доля участия, %</label>
                        <Input
                            type="number"
                            value={data.share}
                            onChange={e => setData({ ...data, share: Number(e.target.value) })}
                            placeholder="0-100"
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5 font-mono"
                        />
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

                <div className="pt-6">
                    <Button
                        onClick={() => onSave(data)}
                        className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isAdd ? 'Добавить связь' : 'Сохранить изменения'}
                    </Button>
                </div>
            </div>
        </SidePanelForm>
    );
}

function AssetRelationDrawer({ open, onClose, onSave, initialData }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
}) {
    const [data, setData] = useState({
        assetId: '',
        role: 'OPERATOR',
        basis: '',
    });

    useState(() => {
        if (initialData) {
            setData({
                assetId: initialData.assetId || '',
                role: initialData.role || 'OPERATOR',
                basis: initialData.basis || '',
            });
        }
    });

    const isAdd = !initialData;

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? "Привязка хозяйства" : "Редактирование привязки"}>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Объект (Хозяйство)</label>
                        <select
                            value={data.assetId}
                            onChange={e => setData({ ...data, assetId: e.target.value })}
                            className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        >
                            <option value="">Выберите из списка...</option>
                            <option value="farm-1">ООО «Авангард» (Краснодар)</option>
                            <option value="farm-2">КФХ «Светлый путь» (Ставрополь)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Роль контрагента</label>
                        <select
                            value={data.role}
                            onChange={e => setData({ ...data, role: e.target.value as any })}
                            className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        >
                            {ASSET_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Правовое основание</label>
                        <textarea
                            value={data.basis}
                            onChange={e => setData({ ...data, basis: e.target.value })}
                            placeholder="№ договора / свидетельства..."
                            rows={3}
                            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none leading-normal"
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        onClick={() => onSave(data)}
                        className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isAdd ? 'Привязать объект' : 'Сохранить изменения'}
                    </Button>
                </div>
            </div>
        </SidePanelForm>
    );
}

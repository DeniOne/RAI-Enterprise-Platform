'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, MapPin, Building2, Navigation, BadgeCheck } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { DataField, useEditMode } from '@/components/party-assets/common/DataField';
import { cn } from '@/lib/utils';

export function PartyProfileTab() {
    const { control, formState: { errors }, watch } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'addresses',
    });

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-1 duration-500">
            {/* Grid: Core Requisites & Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Col: Main Names */}
                <section className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-900">Идентификация субъекта</h2>
                    </div>

                    <div className="space-y-6">
                        <Controller
                            name="legalName"
                            control={control}
                            render={({ field }) => (
                                <DataField
                                    label="Полное юридическое наименование"
                                    value={field.value}
                                    required={true}
                                >
                                    <textarea
                                        {...field}
                                        rows={3}
                                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none leading-normal"
                                        placeholder="Введите юридическое название..."
                                    />
                                    {errors.legalName && <p className="text-[10px] text-red-500 mt-1">{errors.legalName.message}</p>}
                                </DataField>
                            )}
                        />
                        <Controller
                            name="shortName"
                            control={control}
                            render={({ field }) => (
                                <DataField
                                    label="Краткое наименование / Бренд"
                                    value={field.value}
                                    required={true}
                                >
                                    <Input {...field} placeholder="ООО..." className="h-10 bg-white border-black/10 rounded-xl text-sm font-normal shadow-none transition-all focus:ring-black/5" error={errors.shortName?.message} />
                                </DataField>
                            )}
                        />
                    </div>
                </section>

                {/* Right Col: Codes & System Data */}
                <section className="lg:col-span-5 bg-gray-50/50 p-6 rounded-2xl border border-black/5 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                        <h2 className="text-sm font-medium text-gray-900">Коды и реестры</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <DataField
                            label="ИНН / УНП"
                            value={<span className="font-mono text-gray-700 tracking-tight">{watch('inn') || '—'}</span>}
                            isReadOnly
                            required={true}
                        />

                        <Controller
                            name="kpp"
                            control={control}
                            render={({ field }) => (
                                <DataField label="КПП" value={field.value}>
                                    <Input {...field} placeholder="—" className="h-9 bg-white border-black/10 rounded-lg text-sm font-normal shadow-none py-0" error={errors.kpp?.message} />
                                </DataField>
                            )}
                        />

                        <Controller
                            name="ogrn"
                            control={control}
                            render={({ field }) => (
                                <DataField label="ОГРН / ОГРНИП" value={field.value}>
                                    <Input {...field} placeholder="—" className="h-9 bg-white border-black/10 rounded-lg text-sm font-normal shadow-none py-0" error={errors.ogrn?.message} />
                                </DataField>
                            )}
                        />

                        <DataField
                            label="Юрисдикция"
                            value={
                                <div className="h-7 px-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg inline-flex items-center text-[10px] font-semibold uppercase tracking-widest leading-none">
                                    Россия (RU)
                                </div>
                            }
                            isReadOnly
                            required={true}
                        />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/50 flex gap-2.5 items-start">
                        <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-amber-600">!</span>
                        </div>
                        <p className="text-[11px] font-medium text-amber-700/80 leading-snug">Изменение ИНН требует перерегистрации через эскалацию.</p>
                    </div>
                </section>
            </div>

            {/* Locations Section (Compact Grid) */}
            <section className="space-y-6 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <Navigation className="h-3.5 w-3.5 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-900">Локации и адреса</h2>
                    </div>
                    {isEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ type: 'LEGAL', city: '', street: '' })}
                            className="rounded-lg border-black/10 bg-white hover:bg-black hover:text-white transition-all h-8 px-4 font-semibold text-xs shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Добавить адрес
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className={cn(
                            "bg-white border rounded-2xl p-5 relative transition-all duration-300",
                            isEdit ? "border-black/10 shadow-sm border-l-4 border-l-blue-500" : "border-black/5 hover:border-black/10"
                        )}>
                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                    <Controller
                                        name={`addresses.${index}.type`}
                                        control={control}
                                        render={({ field: selectField }) => (
                                            <DataField label="Тип адреса" value={
                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                                    {selectField.value === 'LEGAL' ? 'Юридический' :
                                                        selectField.value === 'POSTAL' ? 'Почтовый' :
                                                            selectField.value === 'ACTUAL' ? 'Фактический' : 'Другой'}
                                                </span>
                                            } className="min-w-[120px]">
                                                <select
                                                    {...selectField}
                                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                                >
                                                    <option value="LEGAL">Юридический</option>
                                                    <option value="POSTAL">Почтовый</option>
                                                    <option value="ACTUAL">Фактический</option>
                                                    <option value="DELIVERY">Доставка</option>
                                                </select>
                                            </DataField>
                                        )}
                                    />

                                    <Controller
                                        name={`addresses.${index}.index`}
                                        control={control}
                                        render={({ field: inputField }) => (
                                            <DataField label="Индекс" value={inputField.value} className="min-w-[80px]">
                                                <Input {...inputField} placeholder="123456" className="h-8 bg-white border-black/10 rounded-lg text-xs" />
                                            </DataField>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Controller
                                        name={`addresses.${index}.city`}
                                        control={control}
                                        render={({ field: inputField }) => (
                                            <DataField label="Регион / Город" value={inputField.value}>
                                                <Input {...inputField} placeholder="г. Москва" className="h-9 bg-white border-black/10 rounded-lg text-sm" />
                                            </DataField>
                                        )}
                                    />
                                    <Controller
                                        name={`addresses.${index}.street`}
                                        control={control}
                                        render={({ field: inputField }) => (
                                            <DataField label="Улица, дом, офис" value={inputField.value}>
                                                <Input {...inputField} placeholder="ул. Ленина, д. 1" className="h-9 bg-white border-black/10 rounded-lg text-sm" />
                                            </DataField>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-black/5 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center gap-3">
                            <MapPin className="h-6 w-6 text-gray-200" />
                            <p className="text-sm font-normal text-gray-400">Адреса не зафиксированы</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

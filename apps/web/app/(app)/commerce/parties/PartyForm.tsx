'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui';

// Type definitions passed from parent
type Jurisdiction = { id: string; code: string; name: string };
type RegulatoryProfile = { id: string; name: string; jurisdiction: Jurisdiction };
type Party = any; // Will refine later

const partySchema = z.object({
    legalName: z.string().min(1, 'Обязательное поле'),
    jurisdictionId: z.string().min(1, 'Обязательное поле'),
    regulatoryProfileId: z.string().optional(),
    registrationData: z.object({
        farm: z.object({
            mode: z.enum(['SAME_AS_LEGAL', 'CUSTOM']).default('SAME_AS_LEGAL'),
            farmName: z.string().optional(),
            holdingName: z.string().optional(),
            accountId: z.string().optional(),
            holdingId: z.string().optional(),
        }).superRefine((value, ctx) => {
            if (value.mode === 'CUSTOM' && !String(value.farmName || '').trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Укажите наименование хозяйства',
                    path: ['farmName'],
                });
            }
        }),

        shortName: z.string().optional(),
        legalForm: z.string().optional(),
        comment: z.string().optional(),

        // Specific identifiers
        inn: z.string().optional(),
        kpp: z.string().optional(),
        ogrn: z.string().optional(),
        unp: z.string().optional(),
        okpo: z.string().optional(),
        bin: z.string().optional(),
        kbe: z.string().optional(),

        addresses: z.array(z.object({
            type: z.string(),
            address: z.string().min(1, 'Адрес обязателен'),
            isPrimary: z.boolean().default(false),
        })),

        contacts: z.array(z.object({
            roleType: z.enum(['SIGNATORY', 'OPERATIONAL']),
            fullName: z.string().min(1, 'ФИО обязательно'),
            position: z.string().optional(),
            basisOfAuthority: z.string().optional(), // Устав, Доверенность
            phones: z.string().optional(),
            email: z.string().email('Неверный Email').optional().or(z.literal('')),
        })),

        banks: z.array(z.object({
            bankName: z.string().min(1, 'Наименование обязательно'),
            accountNumber: z.string().min(1, 'Счет обязателен'),
            bic: z.string().optional(),
            corrAccount: z.string().optional(),
            currency: z.string().default('RUB'),
            isPrimary: z.boolean().default(false),
        })),
    }).optional()
});

type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormProps {
    party?: Party | null;
    jurisdictions: Jurisdiction[];
    regulatoryProfiles: RegulatoryProfile[];
    onSubmit: (values: PartyFormValues) => Promise<void>;
    onCancel: () => void;
    onDelete?: (id: string) => Promise<void>;
    isSubmitting?: boolean;
    error?: string | null;
}

export function PartyForm({
    party,
    jurisdictions,
    regulatoryProfiles,
    onSubmit,
    onCancel,
    onDelete,
    isSubmitting,
    error
}: PartyFormProps) {
    const defaultValues: Partial<PartyFormValues> = {
        legalName: party?.legalName || '',
        jurisdictionId: party?.jurisdiction?.id || '',
        regulatoryProfileId: party?.regulatoryProfile?.id || '',
        registrationData: party?.registrationData || {
            farm: {
                mode: 'SAME_AS_LEGAL',
                farmName: party?.legalName || '',
                holdingName: party?.legalName || '',
                accountId: '',
                holdingId: '',
            },
            shortName: '', legalForm: '', comment: '',
            inn: '', kpp: '', ogrn: '', unp: '', okpo: '', bin: '', kbe: '',
            addresses: [], contacts: [], banks: []
        }
    };

    const form = useForm<PartyFormValues>({
        resolver: zodResolver(partySchema),
        defaultValues,
    });

    const { control, handleSubmit, watch, register, formState: { errors } } = form;

    // Field Arrays
    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control, name: 'registrationData.addresses' });
    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({ control, name: 'registrationData.contacts' });
    const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({ control, name: 'registrationData.banks' });

    const selectedJurId = watch('jurisdictionId');
    const selectedJurCode = jurisdictions.find(j => j.id === selectedJurId)?.code || '';
    const legalName = watch('legalName');
    const farmMode = watch('registrationData.farm.mode');

    useEffect(() => {
        if (farmMode === 'SAME_AS_LEGAL') {
            form.setValue('registrationData.farm.farmName', legalName || '', { shouldDirty: true });
            const currentHolding = watch('registrationData.farm.holdingName');
            if (!String(currentHolding || '').trim()) {
                form.setValue('registrationData.farm.holdingName', legalName || '', { shouldDirty: true });
            }
        }
    }, [farmMode, legalName]);

    // Filter regulatory profiles by selected jurisdiction
    const filteredProfiles = regulatoryProfiles.filter(p => !selectedJurId || p.jurisdiction.id === selectedJurId);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white border border-black/10 p-6 rounded-2xl">
            <div>
                <h2 className="text-xl font-medium mb-4">{party ? 'Редактирование контрагента' : 'Новый контрагент'}</h2>
                {error && <div className="text-red-500 mb-4">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Юридическое наименование *</label>
                        <input {...register('legalName')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" placeholder="ООО Ромашка" />
                        {errors.legalName && <span className="text-red-500 text-sm">{errors.legalName.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Краткое наименование</label>
                        <input {...register('registrationData.shortName')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Юрисдикция *</label>
                        <select {...register('jurisdictionId')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal bg-white">
                            <option value="">Выберите юрисдикцию...</option>
                            {jurisdictions.map(j => (
                                <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                            ))}
                        </select>
                        {errors.jurisdictionId && <span className="text-red-500 text-sm">{errors.jurisdictionId.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Организационно-правовая форма</label>
                        <input {...register('registrationData.legalForm')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" placeholder="ООО, АО, ИП" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Регуляторный профиль</label>
                        <select {...register('regulatoryProfileId')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal bg-white">
                            <option value="">Нет (Общий режим)</option>
                            {filteredProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Юрисдикционые спецификаторы */}
            {selectedJurCode && (
                <div>
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">Реквизиты ({selectedJurCode})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedJurCode === 'RU' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
                                    <input {...register('registrationData.inn')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">КПП</label>
                                    <input {...register('registrationData.kpp')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ОГРН / ОГРНИП</label>
                                    <input {...register('registrationData.ogrn')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                            </>
                        )}
                        {selectedJurCode === 'BY' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">УНП</label>
                                    <input {...register('registrationData.unp')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ОКПО</label>
                                    <input {...register('registrationData.okpo')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                            </>
                        )}
                        {selectedJurCode === 'KZ' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">БИН / ИИН</label>
                                    <input {...register('registrationData.bin')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">КБЕ</label>
                                    <input {...register('registrationData.kbe')} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Хозяйство *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex gap-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" value="SAME_AS_LEGAL" {...register('registrationData.farm.mode')} />
                            Совпадает с юрлицом
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" value="CUSTOM" {...register('registrationData.farm.mode')} />
                            Отдельное хозяйство
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Наименование хозяйства *</label>
                        <input
                            {...register('registrationData.farm.farmName')}
                            className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal"
                            placeholder="ООО Поле-1"
                            disabled={farmMode === 'SAME_AS_LEGAL'}
                        />
                        {errors.registrationData?.farm?.farmName && <span className="text-red-500 text-sm">{errors.registrationData.farm.farmName.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Группа/холдинг хозяйства</label>
                        <input
                            {...register('registrationData.farm.holdingName')}
                            className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal"
                            placeholder="Стехолдинг"
                        />
                    </div>
                </div>
            </div>

            {/* Адреса */}
            <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-medium">Адреса</h3>
                    <button type="button" onClick={() => appendAddress({ type: 'юридический', address: '', isPrimary: false })} className="text-sm text-blue-600 hover:text-blue-800">+ Добавить адрес</button>
                </div>
                {addressFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-start">
                        <div className="md:col-span-3">
                            <select {...register(`registrationData.addresses.${index}.type`)} className="w-full border border-black/10 rounded-lg px-2 py-2 text-sm bg-white">
                                <option value="юридический">Юридический</option>
                                <option value="фактический">Фактический</option>
                                <option value="почтовый">Почтовый</option>
                                <option value="разгрузки">Разгрузки</option>
                            </select>
                        </div>
                        <div className="md:col-span-8">
                            <input {...register(`registrationData.addresses.${index}.address`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Введите полный адрес..." />
                            {errors.registrationData?.addresses?.[index]?.address && <span className="text-red-500 text-xs">{errors.registrationData.addresses[index]?.address?.message}</span>}
                        </div>
                        <div className="md:col-span-1 pt-2">
                            <button type="button" onClick={() => removeAddress(index)} className="text-red-500 text-sm">Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Контакты / ЛОПР */}
            <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-medium">Связанные лица / ЛОПР</h3>
                    <button type="button" onClick={() => appendContact({ roleType: 'OPERATIONAL', fullName: '', position: '', phones: '', email: '' })} className="text-sm text-blue-600 hover:text-blue-800">+ Добавить лицо</button>
                </div>
                {contactFields.map((field, index) => {
                    const roleType = watch(`registrationData.contacts.${index}.roleType`);
                    return (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50/50">
                            <div className="flex justify-between mb-3">
                                <div className="flex gap-4 items-center">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                                        <input type="radio" value="SIGNATORY" {...register(`registrationData.contacts.${index}.roleType`)} />
                                        Подписант
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                                        <input type="radio" value="OPERATIONAL" {...register(`registrationData.contacts.${index}.roleType`)} />
                                        Операционный
                                    </label>
                                </div>
                                <button type="button" onClick={() => removeContact(index)} className="text-red-500 text-sm">Удалить</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <input {...register(`registrationData.contacts.${index}.fullName`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="ФИО полностью *" />
                                    {errors.registrationData?.contacts?.[index]?.fullName && <span className="text-red-500 text-xs">{errors.registrationData.contacts[index]?.fullName?.message}</span>}
                                </div>
                                <div>
                                    <input {...register(`registrationData.contacts.${index}.position`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Должность (Директор, Гл. Агроном)" />
                                </div>
                                {roleType === 'SIGNATORY' && (
                                    <div className="md:col-span-2">
                                        <input {...register(`registrationData.contacts.${index}.basisOfAuthority`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Действует на основании (Устава, Доверенности №... от...)" />
                                    </div>
                                )}
                                <div>
                                    <input {...register(`registrationData.contacts.${index}.phones`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Телефоны" />
                                </div>
                                <div>
                                    <input {...register(`registrationData.contacts.${index}.email`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Email" />
                                    {errors.registrationData?.contacts?.[index]?.email && <span className="text-red-500 text-xs">{errors.registrationData.contacts[index]?.email?.message}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Банковские реквизиты */}
            <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-medium">Банковские реквизиты</h3>
                    <button type="button" onClick={() => appendBank({ bankName: '', accountNumber: '', bic: '', corrAccount: '', currency: 'RUB', isPrimary: false })} className="text-sm text-blue-600 hover:text-blue-800">+ Добавить счет</button>
                </div>
                {bankFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50/50">
                        <div className="flex justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">Счет #{index + 1}</h4>
                            <button type="button" onClick={() => removeBank(index)} className="text-red-500 text-sm">Удалить</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <input {...register(`registrationData.banks.${index}.bankName`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Наименование банка *" />
                                {errors.registrationData?.banks?.[index]?.bankName && <span className="text-red-500 text-xs">{errors.registrationData.banks[index]?.bankName?.message}</span>}
                            </div>
                            <div>
                                <input {...register(`registrationData.banks.${index}.accountNumber`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Расчетный счет (IBAN) *" />
                                {errors.registrationData?.banks?.[index]?.accountNumber && <span className="text-red-500 text-xs">{errors.registrationData.banks[index]?.accountNumber?.message}</span>}
                            </div>
                            <div>
                                <input {...register(`registrationData.banks.${index}.bic`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="БИК / SWIFT" />
                            </div>
                            <div>
                                <input {...register(`registrationData.banks.${index}.corrAccount`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm" placeholder="Корр. счет" />
                            </div>
                            <div>
                                <select {...register(`registrationData.banks.${index}.currency`)} className="w-full border border-black/10 rounded-lg px-4 py-2 text-sm bg-white">
                                    <option value="RUB">RUB</option>
                                    <option value="BYN">BYN</option>
                                    <option value="KZT">KZT</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="CNY">CNY</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Комментарий */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительный комментарий</label>
                <textarea {...register('registrationData.comment')} rows={3} className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal" placeholder="Любая дополнительная информация о контрагенте..." />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-black/10">
                <div className="flex gap-4">
                    <button type="submit" disabled={isSubmitting} className="bg-black text-white rounded-2xl px-6 py-3 font-medium disabled:opacity-50">
                        {isSubmitting ? 'Сохранение...' : 'Сохранить контрагента'}
                    </button>
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-black font-medium px-4">
                        Отмена
                    </button>
                </div>
                {party && onDelete && (
                    <button type="button" onClick={() => onDelete(party.id)} className="text-red-500 hover:text-red-700 font-medium px-4">
                        Удалить контрагента
                    </button>
                )}
            </div>
        </form>
    );
}

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Plus, AlertCircle, X, Globe, Fingerprint, Building } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PartyQuickCreateSchema, PartyQuickCreateValues } from '@/shared/lib/party-schemas';
import { partyAssetsApi } from '@/lib/party-assets-api';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function PartyQuickCreateDrawer({ open, onClose }: Props) {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PartyQuickCreateValues>({
        resolver: zodResolver(PartyQuickCreateSchema),
        defaultValues: {
            jurisdictionId: 'RU',
            type: 'LEGAL_ENTITY',
            inn: '',
            legalName: '',
            kpp: '',
        },
    });

    const innValue = watch('inn');
    const jurisdictionId = watch('jurisdictionId');
    const partyType = watch('type');

    if (!open) return null;

    const handleLookup = async () => {
        if (!innValue || innValue.length < 9) {
            setSearchError('Введите корректный идентификатор (ИНН/УНП)');
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            const result = await partyAssetsApi.lookupParty({
                jurisdictionId,
                partyType,
                identification: { inn: innValue },
            });
            if (result && result.legalName) {
                setValue('legalName', result.legalName);
                if (result.identification?.kpp) setValue('kpp', result.identification.kpp);
            } else {
                setSearchError('Данные не обнаружены. Пожалуйста, введите наименование вручную.');
            }
        } catch (error) {
            setSearchError('Ошибка синхронизации с государственными реестрами. Доступен ручной ввод.');
        } finally {
            setIsSearching(false);
        }
    };

    const onSubmit = async (data: PartyQuickCreateValues) => {
        setIsSubmitting(true);
        try {
            const created = await partyAssetsApi.createParty({
                legalName: data.legalName,
                jurisdictionId: data.jurisdictionId,
                type: data.type,
                registrationData: {
                    identification: {
                        inn: data.inn,
                        kpp: data.kpp,
                    },
                },
                status: 'ACTIVE',
            });
            onClose();
            router.push(`/parties/${created.id}`);
        } catch (error) {
            console.error('Creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 rounded-l-[2.5rem] border-l border-black/5">
                <div className="p-10 space-y-10">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-medium tracking-tight text-gray-900">Быстрая регистрация</h3>
                            <p className="text-sm font-normal text-gray-500">Инициация новой записи в институциональном реестре контрагентов</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-black transition-all border border-transparent hover:border-black/5"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Jurisdiction & Type Section */}
                        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50/50 rounded-3xl border border-black/5">
                            <Controller
                                name="jurisdictionId"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest pl-1">
                                            <Globe className="h-3 w-3" />
                                            <span>Юрисдикция</span>
                                        </label>
                                        <select
                                            {...field}
                                            className="flex h-11 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="RU">Россия (RU)</option>
                                            <option value="BY">Беларусь (BY)</option>
                                            <option value="KZ">Казахстан (KZ)</option>
                                        </select>
                                    </div>
                                )}
                            />

                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest pl-1">
                                            <Fingerprint className="h-3 w-3" />
                                            <span>Тип субъекта</span>
                                        </label>
                                        <select
                                            {...field}
                                            className="flex h-11 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="LEGAL_ENTITY">Юридическое лицо</option>
                                            <option value="IP">Индивидуальный предприниматель</option>
                                            <option value="KFH">КФХ</option>
                                        </select>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Identification Section */}
                        <div className="space-y-6">
                            <div className="relative group">
                                <Controller
                                    name="inn"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest pl-1">
                                                <Search className="h-3 w-3" />
                                                <span>Идентификатор (ИНН / УНП)</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    {...field}
                                                    placeholder="0000000000"
                                                    className="h-12 bg-white border-black/10 rounded-2xl text-base font-normal shadow-none transition-all focus:ring-black/5 flex-1"
                                                    error={errors.inn?.message}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-12 px-5 rounded-2xl border-black/10 hover:bg-black hover:text-white transition-all font-medium"
                                                    onClick={handleLookup}
                                                    disabled={isSearching}
                                                >
                                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                    <span className="ml-2">Найти</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                />

                                {searchError && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{searchError}</span>
                                    </div>
                                )}
                            </div>

                            <Controller
                                name="legalName"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest pl-1">
                                            <Building className="h-3 w-3" />
                                            <span>Полное наименование</span>
                                        </label>
                                        <Input
                                            {...field}
                                            placeholder="ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ..."
                                            className="h-12 bg-white border-black/10 rounded-2xl text-base font-normal shadow-none transition-all focus:ring-black/5"
                                            error={errors.legalName?.message}
                                        />
                                    </div>
                                )}
                            />

                            {partyType === 'LEGAL_ENTITY' && jurisdictionId === 'RU' && (
                                <Controller
                                    name="kpp"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            label="КПП"
                                            placeholder="000000001"
                                            className="h-12 bg-white border-black/10 rounded-2xl text-base font-normal shadow-none transition-all focus:ring-black/5"
                                            error={errors.kpp?.message}
                                        />
                                    )}
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-black/5 flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-3xl bg-black text-white hover:bg-gray-800 transition-all font-medium text-base shadow-lg shadow-black/10"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Plus className="h-5 w-5 mr-2" />
                                )}
                                Зарегистрировать и открыть профиль
                            </Button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full h-12 rounded-2xl text-gray-400 hover:text-black hover:bg-gray-50 transition-all text-sm font-medium"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

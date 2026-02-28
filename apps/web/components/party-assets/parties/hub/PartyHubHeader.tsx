'use client';

import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Shield, History, Share2, Pencil, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { calculatePartyCompleteness } from '@/shared/lib/party-completeness';
import { cn } from '@/lib/utils';

interface Props {
    isSaving: boolean;
}

export function PartyHubHeader({ isSaving }: Props) {
    const router = useRouter();
    const { watch, reset, formState: { isDirty } } = useFormContext<PartyFullProfileValues>();
    const { isEdit, setEdit } = useEditMode();

    const allValues = watch();
    const completeness = calculatePartyCompleteness(allValues);

    const legalName = allValues.legalName;
    const shortName = allValues.shortName;
    const type = allValues.type;
    const inn = allValues.inn;

    const handleCancel = () => {
        reset(); // Rollback form state
        setEdit(false);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Completeness Banner / Warning */}
            {completeness.percent < 100 && (
                <div className="animate-in slide-in-from-top-4 duration-500 bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-red-900 leading-none">Карточка заполнена не полностью ({completeness.score} из {completeness.total})</h3>
                            <p className="text-xs text-red-700/80 font-medium">
                                <span className="text-red-800">Осталось заполнить:</span> {completeness.missingLabels.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation & Secondary Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/parties')}
                        className="h-8 w-8 flex items-center justify-center hover:bg-black/5 rounded-xl transition-all border border-black/5 bg-white"
                        title="Назад к реестру"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-400" />
                    </button>
                    <nav className="flex items-center gap-2 text-[10px] font-medium text-gray-500 tracking-widest uppercase">
                        <span className="hover:text-black cursor-pointer transition-colors" onClick={() => router.push('/parties')}>Реестр</span>
                        <span>/</span>
                        <span className="text-black/60 truncate max-w-[150px]">{shortName || 'Карточка субъекта'}</span>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <div className="mr-4 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-black/5">
                        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-700",
                                    completeness.percent === 100 ? "bg-green-500" : "bg-amber-400"
                                )}
                                style={{ width: `${completeness.percent}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 tracking-tighter w-8">{completeness.percent}%</span>
                        {completeness.percent === 100 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                    </div>
                    <button className="h-8 px-3 rounded-lg text-[10px] uppercase tracking-wider font-medium text-gray-400 hover:text-black hover:bg-black/5 transition-all flex items-center gap-2 border border-transparent hover:border-black/5">
                        <History className="h-3.5 w-3.5" />
                        <span>История</span>
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-black/5 transition-all border border-transparent hover:border-black/5">
                        <Share2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Identity & Actions Area */}
            <div className="flex items-start justify-between gap-6 border-b border-black/5 pb-5">
                <div className="space-y-4 flex-1 min-w-0">
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-3">
                            <h1 className="text-2xl font-medium tracking-tight text-gray-900 leading-tight">
                                {shortName || 'Инициация профиля'}
                            </h1>
                            <div className="flex items-center gap-1.5 shrink-0 align-middle mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-50 text-green-700 border border-green-100 uppercase tracking-widest">
                                    В реестре холдинга
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-widest">
                                    {type === 'LEGAL_ENTITY' ? 'Юрлицо' : 'Физлицо'}
                                </span>
                            </div>
                        </div>
                        <p className="text-[13px] text-gray-500 font-normal leading-relaxed truncate" title={legalName}>
                            {legalName || '—'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {/* Identity Group */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">ИНН:</span>
                                <span className="font-mono text-[10px] text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-black/5 leading-none">{inn || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Юрисдикция:</span>
                                <span className="text-[10px] font-medium text-gray-700">Россия (RU)</span>
                            </div>
                        </div>

                        <div className="h-3 w-px bg-black/5 hidden md:block" />

                        {/* Process & Compliance Groups */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-900 font-medium leading-none">Верифицирован (Этап 1)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-3 w-3 text-blue-500" />
                                <span className="text-[9px] uppercase tracking-wider font-medium text-blue-600">СБ: Проверка пройдена</span>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex items-center gap-3 shrink-0 self-center">
                    {!isEdit ? (
                        <Button
                            type="button"
                            onClick={() => setEdit(true)}
                            variant="outline"
                            className="h-10 px-5 rounded-lg border-black/10 text-xs font-semibold hover:bg-black hover:text-white transition-all shadow-none"
                        >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Редактировать
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                                type="button"
                                onClick={handleCancel}
                                variant="ghost"
                                className="h-10 px-5 text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                className="h-10 rounded-lg bg-black px-6 text-xs font-semibold text-white transition-all hover:bg-gray-800 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
                                disabled={isSaving || !isDirty}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-3.5 w-3.5 mr-2" />
                                )}
                                Сохранить
                                {isDirty && !isSaving && (
                                    <div className="ml-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse outline outline-2 outline-black" />
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

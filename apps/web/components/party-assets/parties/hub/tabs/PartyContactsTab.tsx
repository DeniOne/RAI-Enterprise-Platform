'use client';

import { useEffect, useState } from 'react';
import {
    Calendar,
    CheckCircle2,
    Copy,
    Mail,
    Pencil,
    Phone,
    Plus,
    Send,
    Star,
    Trash2,
    Users,
} from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
    FrontOfficeInvitationResponse,
    partyAssetsApi,
} from '@/lib/party-assets-api';
import { Input, Button } from '@/components/ui';
import { PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { useEditMode } from '@/components/party-assets/common/DataField';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';

const CONTACT_POSITIONS = [
    { value: 'SIGNATORY', label: 'Подписант' },
    { value: 'CEO', label: 'Генеральный директор' },
    { value: 'CHIEF_AGRONOMIST', label: 'Главный агроном' },
    { value: 'AGRONOMIST', label: 'Агроном' },
    { value: 'CHIEF_ACCOUNTANT', label: 'Главный бухгалтер' },
    { value: 'OTHER', label: 'Другое' },
];

type ContactRow = PartyFullProfileValues['contacts'][number] & {
    formKey?: string;
};

type ContactAccessStatus = 'INVITED' | 'ACTIVE' | 'REVOKED' | undefined;

function getFrontOfficeAccessMeta(status?: ContactAccessStatus) {
    switch (status) {
        case 'ACTIVE':
            return {
                label: 'Доступ активирован',
                className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                actionLabel: 'Активирован',
            };
        case 'INVITED':
            return {
                label: 'Ожидает активации',
                className: 'border-amber-200 bg-amber-50 text-amber-700',
                actionLabel: 'Переотправить',
            };
        case 'REVOKED':
            return {
                label: 'Доступ отозван',
                className: 'border-slate-200 bg-slate-100 text-slate-600',
                actionLabel: 'Пригласить снова',
            };
        default:
            return null;
    }
}

function createContactId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `contact_${crypto.randomUUID()}`;
    }

    return `contact_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getPositionLabel(value: string) {
    return CONTACT_POSITIONS.find((position) => position.value === value)?.label || value;
}

export function PartyContactsTab({ partyId }: { partyId: string }) {
    const { control } = useFormContext<PartyFullProfileValues>();
    const { isEdit } = useEditMode();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [inviteIndex, setInviteIndex] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { fields, append, remove, update: updateField } = useFieldArray({
        control,
        name: 'contacts',
        keyName: 'formKey',
    });

    const showActions = true;

    const handleAdd = () => {
        setEditingIndex(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setIsDrawerOpen(true);
    };

    const handleInvite = (index: number) => {
        setInviteIndex(index);
    };

    const handleSaveRow = (data: PartyFullProfileValues['contacts'][number]) => {
        const nextContact = {
            ...data,
            id: data.id || createContactId(),
        };

        if (editingIndex !== null) {
            updateField(editingIndex, nextContact);
        } else {
            append(nextContact);
        }

        setIsDrawerOpen(false);
    };

    const handleInvited = (contactId: string, response: FrontOfficeInvitationResponse) => {
        const targetIndex = fields.findIndex((field) => (field as ContactRow).id === contactId);
        if (targetIndex < 0) {
            return;
        }

        const currentContact = fields[targetIndex] as ContactRow;
        const { formKey, ...rest } = currentContact;

        updateField(targetIndex, {
            ...rest,
            telegramId: response.invitation.telegramId,
            frontOfficeAccess: {
                ...(currentContact.frontOfficeAccess || {}),
                status: 'INVITED',
                telegramId: response.invitation.telegramId,
                invitationId: response.invitation.id,
                proposedLogin: response.invitation.proposedLogin || undefined,
                invitedAt: new Date().toISOString(),
            },
        });
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
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[25%]">ФИО</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[18%]">Роль / Должность</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[25%]">Контакты</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[12%]">Срок полномочий</th>
                                {showActions && (
                                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px] w-[20%] text-right">
                                        Действия
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {fields.map((field, index) => {
                                const contact = field as ContactRow;
                                const accessMeta = getFrontOfficeAccessMeta(contact.frontOfficeAccess?.status);
                                const accessTelegramId =
                                    contact.frontOfficeAccess?.telegramId || contact.telegramId || null;
                                const inviteDisabled = isEdit || contact.frontOfficeAccess?.status === 'ACTIVE';
                                const inviteLabel = accessMeta?.actionLabel || 'Пригласить';
                                const inviteTitle = isEdit
                                    ? 'Сначала сохраните карточку контрагента'
                                    : contact.frontOfficeAccess?.status === 'ACTIVE'
                                        ? 'Доступ уже активирован для этого контакта'
                                        : 'Пригласить контакт в систему';

                                return (
                                    <tr key={contact.formKey} className="group hover:bg-gray-50/80 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    {contact.isPrimary && (
                                                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                                                    )}
                                                    <span className="font-semibold text-gray-900 leading-none">
                                                        {contact.fullName || '—'}
                                                    </span>
                                                </div>
                                                {accessMeta ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${accessMeta.className}`}>
                                                            {accessMeta.label}
                                                        </span>
                                                        {accessTelegramId ? (
                                                            <span className="text-[11px] text-gray-500">
                                                                Telegram: {accessTelegramId}
                                                            </span>
                                                        ) : null}
                                                        {contact.frontOfficeAccess?.proposedLogin ? (
                                                            <span className="text-[11px] text-gray-500">
                                                                Логин: {contact.frontOfficeAccess.proposedLogin}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100/50 text-gray-600 text-[10px] font-bold border border-black/5 uppercase tracking-wide">
                                                {getPositionLabel(contact.position)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {contact.phone ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        {contact.phone}
                                                    </div>
                                                ) : null}
                                                {contact.email ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        {contact.email}
                                                    </div>
                                                ) : null}
                                                {!contact.phone && !contact.email ? (
                                                    <span className="text-gray-300">нет данных</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.validFrom || contact.validTo ? (
                                                <div className="flex flex-col gap-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-tighter">
                                                    {contact.validFrom ? <span>с {contact.validFrom}</span> : null}
                                                    {contact.validTo ? <span>по {contact.validTo}</span> : null}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        {showActions ? (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => handleInvite(index)}
                                                        disabled={inviteDisabled}
                                                        className="h-9 px-3 rounded-xl text-[11px] font-semibold uppercase tracking-wide"
                                                        title={inviteTitle}
                                                    >
                                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                                        {inviteLabel}
                                                    </Button>
                                                    {isEdit ? (
                                                        <>
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
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                );
                            })}
                            {fields.length === 0 && (
                                <tr>
                                    <td colSpan={showActions ? 5 : 4} className="px-6 py-12 text-center">
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
                initialData={editingIndex !== null ? (fields[editingIndex] as ContactRow) : null}
            />

            <InviteDrawer
                open={inviteIndex !== null}
                partyId={partyId}
                contact={inviteIndex !== null ? (fields[inviteIndex] as ContactRow) : null}
                onClose={() => setInviteIndex(null)}
                onInvited={handleInvited}
            />
        </div>
    );
}

function ContactDrawer({
    open,
    onClose,
    onSave,
    initialData,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: PartyFullProfileValues['contacts'][number]) => void;
    initialData: ContactRow | null;
}) {
    const [data, setData] = useState<PartyFullProfileValues['contacts'][number]>({
        id: undefined,
        fullName: '',
        position: 'OTHER',
        phone: '',
        email: '',
        telegramId: '',
        frontOfficeAccess: undefined,
        isPrimary: false,
        validFrom: '',
        validTo: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (initialData) {
            setData({
                id: initialData.id,
                fullName: initialData.fullName || '',
                position: initialData.position || 'OTHER',
                phone: initialData.phone || '',
                email: initialData.email || '',
                telegramId: initialData.telegramId || '',
                frontOfficeAccess: initialData.frontOfficeAccess,
                isPrimary: Boolean(initialData.isPrimary),
                validFrom: initialData.validFrom || '',
                validTo: initialData.validTo || '',
            });
            return;
        }

        setData({
            id: undefined,
            fullName: '',
            position: 'OTHER',
            phone: '',
            email: '',
            telegramId: '',
            frontOfficeAccess: undefined,
            isPrimary: false,
            validFrom: '',
            validTo: '',
        });
    }, [initialData, open]);

    const isAdd = !initialData;

    return (
        <SidePanelForm open={open} onClose={onClose} title={isAdd ? 'Добавление ключевого лица' : 'Редактирование данных'}>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">ФИО полностью</label>
                        <Input
                            value={data.fullName}
                            onChange={(event) => setData({ ...data, fullName: event.target.value })}
                            placeholder="Напр. Иванов Иван Иванович"
                            className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Должность / Роль</label>
                            <select
                                value={data.position}
                                onChange={(event) => setData({ ...data, position: event.target.value as PartyFullProfileValues['contacts'][number]['position'] })}
                                className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            >
                                {CONTACT_POSITIONS.map((position) => (
                                    <option key={position.value} value={position.value}>
                                        {position.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.isPrimary}
                                    onChange={(event) => setData({ ...data, isPrimary: event.target.checked })}
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
                                onChange={(event) => setData({ ...data, phone: event.target.value })}
                                placeholder="+7..."
                                className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Эл. почта</label>
                            <Input
                                value={data.email}
                                onChange={(event) => setData({ ...data, email: event.target.value })}
                                placeholder="Введите адрес почты"
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
                                    onChange={(event) => setData({ ...data, validFrom: event.target.value })}
                                    className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Действует по</label>
                                <Input
                                    type="date"
                                    value={data.validTo}
                                    onChange={(event) => setData({ ...data, validTo: event.target.value })}
                                    className="h-11 rounded-xl border-black/10 focus:ring-black/5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        type="button"
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

function InviteDrawer({
    open,
    partyId,
    contact,
    onClose,
    onInvited,
}: {
    open: boolean;
    partyId: string;
    contact: ContactRow | null;
    onClose: () => void;
    onInvited: (contactId: string, response: FrontOfficeInvitationResponse) => void;
}) {
    const [telegramId, setTelegramId] = useState('');
    const [proposedLogin, setProposedLogin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [copiedField, setCopiedField] = useState<'activation' | 'bot' | null>(null);
    const [result, setResult] = useState<FrontOfficeInvitationResponse | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setTelegramId('');
        setProposedLogin('');
        setIsSubmitting(false);
        setError('');
        setCopiedField(null);
        setResult(null);
    }, [contact?.id, open]);

    const handleCopy = async (value: string, field: 'activation' | 'bot') => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
        } catch (copyError) {
            console.error('Не удалось скопировать ссылку:', copyError);
            window.alert('Не удалось скопировать ссылку. Скопируйте её вручную из поля.');
        }
    };

    const handleSubmit = async () => {
        if (!contact?.id) {
            setError('Сначала сохраните карточку контакта.');
            return;
        }

        if (!telegramId.trim()) {
            setError('Укажите ID Telegram.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await partyAssetsApi.createFrontOfficeInvitation({
                partyId,
                partyContactId: contact.id,
                telegramId: telegramId.trim(),
                proposedLogin: proposedLogin.trim() || undefined,
                fullName: contact.fullName?.trim() || undefined,
                position: contact.position,
                phone: contact.phone?.trim() || undefined,
                email: contact.email?.trim() || undefined,
            });

            setResult(response);
            onInvited(contact.id, response);
        } catch (requestError) {
            console.error('Не удалось создать приглашение:', requestError);
            const message =
                typeof requestError === 'object' &&
                requestError !== null &&
                'response' in requestError &&
                typeof (requestError as any).response?.data?.message === 'string'
                    ? (requestError as any).response.data.message
                    : 'Не удалось создать приглашение. Проверьте данные и повторите попытку.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanelForm
            open={open}
            onClose={onClose}
            title={result ? 'Приглашение создано' : 'Приглашение в систему'}
        >
            <div className="space-y-6 pt-4">
                <div className="rounded-2xl border border-black/10 bg-gray-50/80 px-4 py-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Контакт</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">{contact?.fullName || 'Без имени'}</div>
                    <div className="mt-1 text-sm text-gray-500">
                        {contact?.position ? getPositionLabel(contact.position) : 'Должность не указана'}
                    </div>
                    {contact?.phone || contact?.email ? (
                        <div className="mt-3 space-y-1 text-xs text-gray-600">
                            {contact.phone ? <div>Телефон: {contact.phone}</div> : null}
                            {contact.email ? <div>Эл. почта: {contact.email}</div> : null}
                        </div>
                    ) : null}
                </div>

                {!result ? (
                    <>
                        <div className="space-y-4">
                            <Input
                                label="ID Telegram"
                                value={telegramId}
                                onChange={(event) => setTelegramId(event.target.value)}
                                placeholder="Напр. 123456789"
                                error={error || undefined}
                                className="h-11 rounded-xl"
                            />
                            <Input
                                label="Рекомендуемый логин"
                                value={proposedLogin}
                                onChange={(event) => setProposedLogin(event.target.value)}
                                placeholder="Необязательно"
                                className="h-11 rounded-xl"
                            />
                            <p className="text-xs leading-relaxed text-gray-500">
                                После создания приглашения система отправит ссылку на бота и страницу регистрации.
                                Основной вход будет по `Telegram`, логин нужен как дополнительный способ доступа.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="button"
                                loading={isSubmitting}
                                onClick={handleSubmit}
                                className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-800 font-semibold"
                            >
                                Создать приглашение
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold">Инвайт зафиксирован в системе</div>
                                    <div className="text-xs leading-relaxed opacity-90">
                                        Контакт привязан к `Telegram ID` {result.invitation.telegramId}. Срок действия приглашения:
                                        {' '}
                                        {new Date(result.invitation.expiresAt).toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block space-y-1">
                                <span className="text-xs font-medium text-gray-700">Ссылка на регистрацию</span>
                                <div className="flex gap-2">
                                    <Input readOnly value={result.links.activationUrl} className="h-11 rounded-xl" />
                                    <Button type="button" variant="outline" className="h-11 px-4 rounded-xl" onClick={() => handleCopy(result.links.activationUrl, 'activation')}>
                                        <Copy className="h-4 w-4 mr-1.5" />
                                        {copiedField === 'activation' ? 'Скопировано' : 'Копировать'}
                                    </Button>
                                </div>
                            </label>

                            {result.links.botStartLink ? (
                                <label className="block space-y-1">
                                    <span className="text-xs font-medium text-gray-700">Ссылка на бота</span>
                                    <div className="flex gap-2">
                                        <Input readOnly value={result.links.botStartLink} className="h-11 rounded-xl" />
                                        <Button type="button" variant="outline" className="h-11 px-4 rounded-xl" onClick={() => handleCopy(result.links.botStartLink as string, 'bot')}>
                                            <Copy className="h-4 w-4 mr-1.5" />
                                            {copiedField === 'bot' ? 'Скопировано' : 'Копировать'}
                                        </Button>
                                    </div>
                                </label>
                            ) : null}
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-gray-50 px-4 py-4 text-xs text-gray-600">
                            {result.delivery.delivered
                                ? 'Бот подтвердил отправку приглашения.'
                                : `Бот не подтвердил доставку${result.delivery.reason ? `: ${result.delivery.reason}` : ''}. Ссылку можно отправить вручную.`}
                        </div>

                        <div className="pt-2">
                            <Button type="button" variant="outline" className="w-full h-11 rounded-2xl" onClick={onClose}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </SidePanelForm>
    );
}

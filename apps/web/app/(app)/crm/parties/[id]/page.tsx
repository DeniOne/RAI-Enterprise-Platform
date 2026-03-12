'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyFullProfileSchema, PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { PartyHubHeader } from '@/components/party-assets/parties/hub/PartyHubHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditModeProvider, useEditMode } from '@/components/party-assets/common/DataField';
import { cn } from '@/lib/utils';

import { PartyProfileTab } from '@/components/party-assets/parties/hub/tabs/PartyProfileTab';
import { PartyBankAccountsTab } from '@/components/party-assets/parties/hub/tabs/PartyBankAccountsTab';
import { PartyContactsTab } from '@/components/party-assets/parties/hub/tabs/PartyContactsTab';
import { PartyStructureTab } from '@/components/party-assets/parties/hub/tabs/PartyStructureTab';

type SaveNotice =
    | { type: 'success' | 'error' | 'warning'; title: string; message: string }
    | null;

function mapPositionToRoleType(position?: string): 'SIGNATORY' | 'OPERATIONAL' {
    return position === 'SIGNATORY' ? 'SIGNATORY' : 'OPERATIONAL';
}

function mapRelationTypeToBackend(value: string): 'OWNERSHIP' | 'MANAGEMENT' | 'AFFILIATED' | 'AGENCY' {
    switch (value) {
        case 'PARENT':
        case 'CHILD':
            return 'OWNERSHIP';
        case 'MANAGING':
        case 'MANAGED':
            return 'MANAGEMENT';
        default:
            return 'AFFILIATED';
    }
}

function mapBackendRelationToForm(value: any, partyId: string): 'PARENT' | 'CHILD' | 'MANAGING' | 'MANAGED' {
    if (value.relationType === 'OWNERSHIP') {
        return value.fromPartyId === partyId ? 'CHILD' : 'PARENT';
    }
    return value.fromPartyId === partyId ? 'MANAGED' : 'MANAGING';
}

function buildRelationPayload(
    relation: any,
    partyId: string,
): {
    fromPartyId: string;
    toPartyId: string;
    relationType: 'OWNERSHIP' | 'MANAGEMENT' | 'AFFILIATED' | 'AGENCY';
    sharePct?: number;
    validFrom: string;
    validTo?: string;
    basisDocId?: string;
} {
    switch (relation.type) {
        case 'PARENT':
            return {
                fromPartyId: relation.relatedPartyId,
                toPartyId: partyId,
                relationType: 'OWNERSHIP',
                sharePct: relation.share || undefined,
                validFrom: relation.validFrom,
                validTo: relation.validTo || undefined,
                basisDocId: relation.basisDocId || undefined,
            };
        case 'CHILD':
            return {
                fromPartyId: partyId,
                toPartyId: relation.relatedPartyId,
                relationType: 'OWNERSHIP',
                sharePct: relation.share || undefined,
                validFrom: relation.validFrom,
                validTo: relation.validTo || undefined,
                basisDocId: relation.basisDocId || undefined,
            };
        case 'MANAGING':
            return {
                fromPartyId: relation.relatedPartyId,
                toPartyId: partyId,
                relationType: 'MANAGEMENT',
                validFrom: relation.validFrom,
                validTo: relation.validTo || undefined,
                basisDocId: relation.basisDocId || undefined,
            };
        default:
            return {
                fromPartyId: partyId,
                toPartyId: relation.relatedPartyId,
                relationType: 'MANAGEMENT',
                validFrom: relation.validFrom,
                validTo: relation.validTo || undefined,
                basisDocId: relation.basisDocId || undefined,
            };
    }
}

function normalizeDay(value?: string) {
    return value ? value.slice(0, 10) : '';
}

function buildContactLocalId(
    contact: {
        id?: string | null;
        fullName?: string | null;
        position?: string | null;
        phone?: string | null;
        email?: string | null;
    },
    fallbackKey?: string,
) {
    const existingId = typeof contact.id === 'string' ? contact.id.trim() : '';
    if (existingId) {
        return existingId;
    }

    const normalized = [
        contact.fullName,
        contact.position,
        contact.phone,
        contact.email,
        fallbackKey,
    ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .join('_')
        .replace(/[^a-z0-9а-яё_-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 96);

    return `contact_${normalized || fallbackKey || 'item'}`;
}

function findExistingRegistrationContact(existingContacts: unknown, contact: {
    id?: string;
    fullName: string;
    phone?: string;
    email?: string;
}) {
    if (!Array.isArray(existingContacts)) {
        return null;
    }

    const byId = contact.id
        ? existingContacts.find((item: any) => typeof item?.id === 'string' && item.id === contact.id)
        : null;
    if (byId) {
        return byId as Record<string, unknown>;
    }

    const normalizedFullName = contact.fullName.trim().toLowerCase();
    const normalizedEmail = (contact.email || '').trim().toLowerCase();
    const normalizedPhone = (contact.phone || '').trim();

    return (
        existingContacts.find((item: any) => {
            const itemFullName = String(item?.fullName || '').trim().toLowerCase();
            const itemEmail = String(item?.email || '').trim().toLowerCase();
            const itemPhone = String(item?.phones || '').trim();

            return (
                itemFullName === normalizedFullName &&
                itemEmail === normalizedEmail &&
                itemPhone === normalizedPhone
            );
        }) as Record<string, unknown> | undefined
    ) ?? null;
}

function areArraysEqual(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function buildFormValuesFromPartyData(
    data: any,
    relations: Array<any>,
    assetsData: { roles?: Array<any> },
    partyId: string,
): PartyFullProfileValues {
    const reg = data.registrationData;

    return {
        legalName: data.legalName,
        shortName: data.shortName || '',
        inn: reg?.inn || '',
        kpp: reg?.kpp || '',
        ogrn: reg?.ogrn || reg?.ogrnip || '',
        jurisdictionId: data.jurisdictionId,
        type: data.type,
        addresses: (reg?.addresses || []).map((addr: any) => ({
            type: (['LEGAL', 'POSTAL', 'ACTUAL', 'DELIVERY'].includes(addr.type)
                ? addr.type
                : 'LEGAL') as any,
            index: addr.index || '',
            region: addr.region || '',
            city: addr.city || '—',
            street: addr.address || addr.full || '',
        })),
        bankAccounts: (reg?.banks || []).map((b: any) => ({
            accountName: b.accountName || 'Основной',
            accountNumber: b.accountNumber,
            bic: b.bic || '',
            bankName: b.bankName,
            corrAccount: b.corrAccount || '',
            currency: b.currency || 'RUB',
            isPrimary: Boolean(b.isPrimary),
        })),
        contacts: (reg?.contacts || []).map((c: any) => ({
            id: buildContactLocalId(
                {
                    id: c.id,
                    fullName: c.fullName,
                    position: c.position || (c.roleType === 'SIGNATORY' ? 'SIGNATORY' : 'OTHER'),
                    phone: c.phones,
                    email: c.email,
                },
                `${partyId}_${c.fullName || 'contact'}`,
            ),
            fullName: c.fullName,
            position: (c.position || (c.roleType === 'SIGNATORY' ? 'SIGNATORY' : 'OTHER')) as any,
            phone: c.phones || '',
            email: c.email || '',
            telegramId: c.telegramId || c.frontOfficeAccess?.telegramId || '',
            frontOfficeAccess:
                c.frontOfficeAccess && typeof c.frontOfficeAccess === 'object'
                    ? {
                        status: c.frontOfficeAccess.status,
                        telegramId: c.frontOfficeAccess.telegramId,
                        invitationId: c.frontOfficeAccess.invitationId,
                        bindingId: c.frontOfficeAccess.bindingId,
                        userId: c.frontOfficeAccess.userId,
                        proposedLogin: c.frontOfficeAccess.proposedLogin,
                        invitedAt: c.frontOfficeAccess.invitedAt,
                        activatedAt: c.frontOfficeAccess.activatedAt,
                    }
                    : undefined,
            isPrimary: Boolean(c.isPrimary),
            validFrom: c.validFrom || '',
            validTo: c.validTo || '',
        })),
        relations: relations.map((r: any) => ({
            id: r.id,
            type: mapBackendRelationToForm(r, partyId),
            relatedPartyId: r.toPartyId === partyId ? r.fromPartyId : r.toPartyId,
            relatedPartyName: r.toPartyId === partyId ? r.fromPartyName : r.toPartyName,
            validFrom: normalizeDay(r.validFrom),
            validTo: normalizeDay(r.validTo),
            basisDocId: r.basisDocId || '',
            share: r.sharePct || 0,
        })),
        assetRelations: (assetsData.roles || []).map((role: any) => ({
            id: role.id,
            assetId: role.assetId,
            role:
                role.role === 'OWNER'
                    ? 'OWNER'
                    : role.role === 'LESSEE'
                        ? 'TENANT'
                        : role.role === 'BENEFICIARY'
                            ? 'PLEDGEE'
                            : 'OPERATOR',
            basis: role.basisDoc || '',
            validFrom: normalizeDay(role.validFrom),
            validTo: normalizeDay(role.validTo),
        })),
    };
}

function PartyHubContent({
    partyId,
    isSaving,
    onSubmit,
    onInvalid,
    saveNotice,
}: {
    partyId: string,
    isSaving: boolean,
    onSubmit: (v: PartyFullProfileValues) => Promise<boolean>,
    onInvalid: () => void,
    saveNotice: SaveNotice,
}) {
    const { setEdit } = useEditMode();

    const handleSubmit = async (values: PartyFullProfileValues) => {
        const saved = await onSubmit(values);
        if (saved) {
            setEdit(false);
        }
    };

    return (
        <form onSubmit={useFormContext<PartyFullProfileValues>().handleSubmit(handleSubmit, onInvalid)} className="space-y-4 max-w-6xl mx-auto px-6 py-4">
            {saveNotice ? (
                <div
                    className={cn(
                        'rounded-2xl border px-4 py-3 flex items-start gap-3',
                        saveNotice.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                        saveNotice.type === 'error' && 'border-red-200 bg-red-50 text-red-900',
                        saveNotice.type === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900',
                    )}
                >
                    <div className="mt-0.5">
                        {saveNotice.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm font-semibold">{saveNotice.title}</div>
                        <div className="text-xs leading-relaxed opacity-90">{saveNotice.message}</div>
                    </div>
                </div>
            ) : null}
            <PartyHubHeader isSaving={isSaving} />

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="profile">Основное и Реквизиты</TabsTrigger>
                    <TabsTrigger value="bank">Банковские счета</TabsTrigger>
                    <TabsTrigger value="contacts">Ключевые лица / ЛОПР</TabsTrigger>
                    <TabsTrigger value="structure">Связанные активы</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <PartyProfileTab />
                </TabsContent>
                <TabsContent value="bank">
                    <PartyBankAccountsTab />
                </TabsContent>
                <TabsContent value="contacts">
                    <PartyContactsTab partyId={partyId} />
                </TabsContent>
                <TabsContent value="structure">
                    <PartyStructureTab />
                </TabsContent>
            </Tabs>
        </form>
    );
}

export default function PartyEntityHubPage() {
    const params = useParams();
    const partyId = params.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveNotice, setSaveNotice] = useState<SaveNotice>(null);
    const initialStructureRef = useRef<Pick<PartyFullProfileValues, 'relations' | 'assetRelations'> | null>(null);
    const originalPartyRef = useRef<any>(null);

    const methods = useForm<PartyFullProfileValues>({
        resolver: zodResolver(PartyFullProfileSchema),
        defaultValues: {
            legalName: '',
            shortName: '',
            inn: '',
            kpp: '',
            ogrn: '',
            jurisdictionId: 'RU',
            type: 'LEGAL_ENTITY',
            addresses: [],
            bankAccounts: [],
            contacts: [],
        },
    });

    const currentValues = methods.watch();
    const structureChanged = useMemo(() => {
        if (!initialStructureRef.current) {
            return false;
        }
        return !areArraysEqual(initialStructureRef.current.relations, currentValues.relations)
            || !areArraysEqual(initialStructureRef.current.assetRelations, currentValues.assetRelations);
    }, [currentValues.assetRelations, currentValues.relations]);

    useEffect(() => {
        async function load() {
            try {
                const [data, relations, assetsData] = await Promise.all([
                    partyAssetsApi.getParty(partyId),
                    partyAssetsApi.getPartyRelations(partyId),
                    partyAssetsApi.getPartyAssets(partyId),
                ]);

                const formValues = buildFormValuesFromPartyData(data, relations, assetsData, partyId);
                originalPartyRef.current = data;
                methods.reset(formValues);
                initialStructureRef.current = {
                    relations: formValues.relations,
                    assetRelations: formValues.assetRelations,
                };
            } catch (error) {
                console.error('Failed to load party:', error);
                setSaveNotice({
                    type: 'error',
                    title: 'Не удалось загрузить карточку',
                    message: 'Проверьте соединение с API и повторите открытие карточки контрагента.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [partyId, methods]);

    const onSubmit = async (values: PartyFullProfileValues) => {
        setIsSaving(true);
        setSaveNotice(null);
        try {
            const latestParty =
                (await partyAssetsApi.getParty(partyId).catch(() => originalPartyRef.current)) ??
                originalPartyRef.current;
            const existingRegistrationData = latestParty?.registrationData ?? {};
            const existingContacts = Array.isArray(existingRegistrationData?.contacts)
                ? existingRegistrationData.contacts
                : [];
            const savedParty = await partyAssetsApi.updateParty(partyId, {
                legalName: values.legalName.trim(),
                shortName: values.shortName?.trim() || undefined,
                jurisdictionId: values.jurisdictionId,
                type: values.type as any,
                registrationData: {
                    ...existingRegistrationData,
                    partyType: values.type as any,
                    inn: values.inn?.trim() || undefined,
                    kpp: values.kpp?.trim() || undefined,
                    ogrn: values.ogrn?.trim() || undefined,
                    shortName: values.shortName?.trim() || undefined,
                    addresses: values.addresses.map((address) => ({
                        type: address.type,
                        address: [address.index, address.region, address.city, address.street]
                            .filter((part) => typeof part === 'string' && part.trim().length > 0)
                            .join(', '),
                    })),
                    contacts: values.contacts.map((contact) => {
                        const contactId = buildContactLocalId(
                            {
                                id: contact.id,
                                fullName: contact.fullName,
                                position: contact.position,
                                phone: contact.phone,
                                email: contact.email,
                            },
                            `${partyId}_${contact.fullName || 'contact'}`,
                        );
                        const existingContact =
                            findExistingRegistrationContact(existingContacts, {
                                id: contactId,
                                fullName: contact.fullName,
                                phone: contact.phone,
                                email: contact.email,
                            }) ?? {};

                        return {
                            ...existingContact,
                            id: contactId,
                            roleType: mapPositionToRoleType(contact.position),
                            fullName: contact.fullName.trim(),
                            position: contact.position,
                            basisOfAuthority:
                                typeof existingContact.basisOfAuthority === 'string'
                                    ? existingContact.basisOfAuthority
                                    : undefined,
                            phones: contact.phone?.trim() || undefined,
                            email: contact.email?.trim() || undefined,
                            isPrimary: Boolean(contact.isPrimary),
                        };
                    }),
                    banks: values.bankAccounts.map((bank) => ({
                        bankName: bank.bankName.trim(),
                        accountNumber: bank.accountNumber.trim(),
                        bic: bank.bic?.trim() || undefined,
                        corrAccount: bank.corrAccount?.trim() || undefined,
                        currency: bank.currency,
                        isPrimary: Boolean(bank.isPrimary),
                    })),
                },
            });

            const initialRelations = initialStructureRef.current?.relations ?? [];
            const initialAssetRelations = initialStructureRef.current?.assetRelations ?? [];

            const initialRelationsById = new Map(initialRelations.filter((item) => item.id).map((item) => [item.id as string, item]));
            const currentRelationsById = new Map(values.relations.filter((item) => item.id).map((item) => [item.id as string, item]));

            for (const initialRelation of initialRelations) {
                if (initialRelation.id && !currentRelationsById.has(initialRelation.id)) {
                    await partyAssetsApi.deletePartyRelation(initialRelation.id);
                }
            }

            for (const relation of values.relations) {
                if (!relation.validFrom) {
                    throw new Error('Для корпоративной связи нужно заполнить дату начала действия.');
                }
                const payload = buildRelationPayload(relation, partyId);
                if (relation.id) {
                    const initialRelation = initialRelationsById.get(relation.id);
                    if (!initialRelation || !areArraysEqual(initialRelation, relation)) {
                        await partyAssetsApi.updatePartyRelation(relation.id, payload);
                    }
                } else {
                    await partyAssetsApi.createPartyRelation(payload);
                }
            }

            const initialAssetRelationsById = new Map(initialAssetRelations.filter((item) => item.id).map((item) => [item.id as string, item]));
            const currentAssetRelationsById = new Map(values.assetRelations.filter((item) => item.id).map((item) => [item.id as string, item]));

            for (const initialAssetRelation of initialAssetRelations) {
                if (initialAssetRelation.id && !currentAssetRelationsById.has(initialAssetRelation.id)) {
                    await partyAssetsApi.deleteAssetRole(initialAssetRelation.assetId, initialAssetRelation.id);
                }
            }

            for (const assetRelation of values.assetRelations) {
                const validFrom = assetRelation.validFrom || new Date().toISOString().slice(0, 10);
                const mappedAssetRole: 'OWNER' | 'LESSEE' | 'BENEFICIARY' | 'OPERATOR' =
                    assetRelation.role === 'OWNER'
                        ? 'OWNER'
                        : assetRelation.role === 'TENANT'
                            ? 'LESSEE'
                            : assetRelation.role === 'PLEDGEE'
                                ? 'BENEFICIARY'
                                : 'OPERATOR';
                const assetPayload = {
                    role: mappedAssetRole,
                    validFrom,
                    validTo: assetRelation.validTo || undefined,
                    basisDoc: assetRelation.basis.trim(),
                };

                if (assetRelation.id) {
                    const initialAssetRelation = initialAssetRelationsById.get(assetRelation.id);
                    if (!initialAssetRelation || !areArraysEqual(initialAssetRelation, assetRelation)) {
                        await partyAssetsApi.updateAssetRole(assetRelation.assetId, assetRelation.id, assetPayload);
                    }
                } else {
                    await partyAssetsApi.assignAssetRole({
                        assetId: assetRelation.assetId,
                        partyId,
                        role: assetPayload.role,
                        validFrom: assetPayload.validFrom,
                        validTo: assetPayload.validTo,
                        basisDoc: assetPayload.basisDoc,
                    } as any);
                }
            }

            const reloadedRelations = await partyAssetsApi.getPartyRelations(partyId);
            const reloadedAssets = await partyAssetsApi.getPartyAssets(partyId);
            const resetValues = buildFormValuesFromPartyData(savedParty, reloadedRelations, reloadedAssets, partyId);
            originalPartyRef.current = savedParty;
            methods.reset(resetValues);
            initialStructureRef.current = {
                relations: resetValues.relations,
                assetRelations: resetValues.assetRelations,
            };

            setSaveNotice({
                type: 'success',
                title: 'Карточка сохранена',
                message: structureChanged
                    ? 'Изменения по карточке, корпоративным связям и привязанным активам сохранены.'
                    : 'Изменения успешно записаны в карточку контрагента.',
            });
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            const message =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as any).response?.data?.message === 'string'
                    ? (error as any).response.data.message
                    : 'Не удалось сохранить карточку. Проверьте обязательные поля и повторите попытку.';
            setSaveNotice({
                type: 'error',
                title: 'Сохранение не выполнено',
                message,
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const onInvalid = () => {
        setSaveNotice({
            type: 'error',
            title: 'Форма не сохранена',
            message: 'В карточке есть невалидные поля. Проверьте обязательные поля на вкладках "Основное", "Банковские счета", "Ключевые лица" и "Связанные активы".',
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-black/20" />
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <EditModeProvider>
                <PartyHubContent
                    partyId={partyId}
                    isSaving={isSaving}
                    onSubmit={onSubmit}
                    onInvalid={onInvalid}
                    saveNotice={saveNotice}
                />
            </EditModeProvider>
        </FormProvider>
    );
}

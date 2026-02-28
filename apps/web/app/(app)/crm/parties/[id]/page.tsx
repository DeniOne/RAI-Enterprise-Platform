'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyFullProfileSchema, PartyFullProfileValues } from '@/shared/lib/party-schemas';
import { PartyHubHeader } from '@/components/party-assets/parties/hub/PartyHubHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditModeProvider, useEditMode } from '@/components/party-assets/common/DataField';

import { PartyProfileTab } from '@/components/party-assets/parties/hub/tabs/PartyProfileTab';
import { PartyBankAccountsTab } from '@/components/party-assets/parties/hub/tabs/PartyBankAccountsTab';
import { PartyContactsTab } from '@/components/party-assets/parties/hub/tabs/PartyContactsTab';
import { PartyStructureTab } from '@/components/party-assets/parties/hub/tabs/PartyStructureTab';

function PartyHubContent({ isSaving, onSubmit }: { isSaving: boolean, onSubmit: (v: any) => void }) {
    const { setEdit } = useEditMode();

    const handleSubmit = async (values: any) => {
        await onSubmit(values);
        setEdit(false);
    };

    return (
        <form onSubmit={useFormContext().handleSubmit(handleSubmit)} className="space-y-4 max-w-6xl mx-auto px-6 py-4">
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
                    <PartyContactsTab />
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

    useEffect(() => {
        async function load() {
            try {
                const [data, relations, assetsData] = await Promise.all([
                    partyAssetsApi.getParty(partyId),
                    partyAssetsApi.getPartyRelations(partyId),
                    partyAssetsApi.getPartyAssets(partyId),
                ]);

                const reg = data.registrationData;

                methods.reset({
                    legalName: data.legalName,
                    shortName: data.shortName || '',
                    inn: reg?.inn || '',
                    kpp: reg?.kpp || '',
                    ogrn: reg?.ogrn || reg?.ogrnip || '',
                    jurisdictionId: data.jurisdictionId,
                    type: data.type,
                    // Маппинг адресов
                    addresses: (reg?.addresses || []).map((addr) => ({
                        type: (['LEGAL', 'POSTAL', 'ACTUAL', 'DELIVERY'].includes(addr.type)
                            ? addr.type
                            : 'LEGAL') as any,
                        city: '—', // В API плоская строка, в схеме обязателен город
                        street: addr.address,
                    })),
                    // Маппинг банковских счетов
                    bankAccounts: (reg?.banks || []).map((b) => ({
                        accountName: 'Основной',
                        accountNumber: b.accountNumber,
                        bic: b.bic || '',
                        bankName: b.bankName,
                        corrAccount: b.corrAccount || '',
                    })),
                    // Маппинг контактов
                    contacts: (reg?.contacts || []).map((c) => ({
                        fullName: c.fullName,
                        position: (c.roleType === 'SIGNATORY' ? 'SIGNATORY' : 'OTHER') as any,
                        phone: c.phones || '',
                        email: c.email || '',
                        isPrimary: false,
                    })),
                    // Маппинг связей
                    relations: relations.map((r) => ({
                        type: (r.relationType === 'OWNERSHIP' ? 'PARENT' : 'MANAGING') as any,
                        relatedPartyId: r.toPartyId === partyId ? r.fromPartyId : r.toPartyId,
                        validFrom: r.validFrom,
                        validTo: r.validTo,
                        share: r.sharePct || 0,
                    })),
                    // Маппинг активов
                    assetRelations: assetsData.roles.map((role) => ({
                        assetId: role.assetId,
                        role: (role.role === 'OWNER' ? 'OWNER' : 'OPERATOR') as any,
                        basis: 'Договор', // В API нет основания в ролях, ставим заглушку
                    })),
                });
            } catch (error) {
                console.error('Failed to load party:', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [partyId, methods]);

    const onSubmit = async (values: PartyFullProfileValues) => {
        setIsSaving(true);
        try {
            console.log('Saving values:', values);
            // Тут будет вызов partyAssetsApi.updateParty когда его допилят
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
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
                <PartyHubContent isSaving={isSaving} onSubmit={onSubmit} />
            </EditModeProvider>
        </FormProvider>
    );
}

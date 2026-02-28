'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { EntityCard } from '@/components/party-assets/common/EntityCard';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { AssetDto, AssetPartyRoleDto, PartyDto, PartyRelationDto } from '@/shared/types/party-assets';
import { PartyProfileTab } from './PartyProfileTab';
import { PartyRequisitesTab } from './PartyRequisitesTab';
import { PartyStructureTab } from './PartyStructureTab';
import { PartyAssetsTab } from './PartyAssetsTab';
import { PartyContactsTab } from './PartyContactsTab';
import { PartyBankAccountsTab } from './PartyBankAccountsTab';

export function PartyDetailsPage({ partyId }: { partyId: string }) {
  const [party, setParty] = useState<PartyDto | null>(null);
  const [relations, setRelations] = useState<PartyRelationDto[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [roles, setRoles] = useState<AssetPartyRoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [partyData, relationData, partyAssets] = await Promise.all([
        partyAssetsApi.getParty(partyId),
        partyAssetsApi.getPartyRelations(partyId),
        partyAssetsApi.getPartyAssets(partyId),
      ]);
      setParty(partyData);
      setRelations(relationData);
      setAssets(partyAssets.assets ?? []);
      setRoles(partyAssets.roles ?? []);
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return <p className="mx-auto w-full max-w-7xl px-4 text-sm font-normal text-gray-500 sm:px-6 lg:px-8">Загрузка...</p>;
  }

  if (!party) {
    return <p className="mx-auto w-full max-w-7xl px-4 text-sm font-normal text-red-600 sm:px-6 lg:px-8">Контрагент не найден.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title={party.legalName} description="Карточка контрагента" />

      <EntityCard title="Данные контрагента">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="requisites">Реквизиты</TabsTrigger>
            <TabsTrigger value="structure">Структура</TabsTrigger>
            <TabsTrigger value="assets">Активы</TabsTrigger>
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
            <TabsTrigger value="bank">Банковские счета</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <PartyProfileTab party={party} />
          </TabsContent>
          <TabsContent value="requisites">
            <PartyRequisitesTab party={party} />
          </TabsContent>
          <TabsContent value="structure">
            <PartyStructureTab partyId={partyId} relations={relations} reload={reload} />
          </TabsContent>
          <TabsContent value="assets">
            <PartyAssetsTab partyId={partyId} assets={assets} roles={roles} reload={reload} />
          </TabsContent>
          <TabsContent value="contacts">
            <PartyContactsTab party={party} />
          </TabsContent>
          <TabsContent value="bank">
            <PartyBankAccountsTab party={party} />
          </TabsContent>
          <TabsContent value="documents">
            <p className="text-sm font-normal text-gray-600">Документы: заглушка.</p>
          </TabsContent>
        </Tabs>
      </EntityCard>
    </div>
  );
}

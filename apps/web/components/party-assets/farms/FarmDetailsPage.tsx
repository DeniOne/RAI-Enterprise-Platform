'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { EntityCard } from '@/components/party-assets/common/EntityCard';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { AssetDto, AssetPartyRoleDto, FarmDto } from '@/shared/types/party-assets';
import { FarmProfileTab } from './FarmProfileTab';
import { FarmRolesTab } from './FarmRolesTab';
import { FarmFieldsTab } from './FarmFieldsTab';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

export function FarmDetailsPage({ farmId }: { farmId: string }) {
  const [farm, setFarm] = useState<FarmDto | null>(null);
  const [roles, setRoles] = useState<AssetPartyRoleDto[]>([]);
  const [fields, setFields] = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const setActiveEntityRefs = useWorkspaceContextStore((s) => s.setActiveEntityRefs);
  const setSelectedRowSummary = useWorkspaceContextStore((s) => s.setSelectedRowSummary);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [farmData, roleData, fieldData] = await Promise.all([
        partyAssetsApi.getFarm(farmId),
        partyAssetsApi.getAssetRoles(farmId),
        partyAssetsApi.getFarmFields(farmId),
      ]);
      setFarm(farmData);
      setRoles(roleData);
      setFields(fieldData);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    if (farm) {
      setActiveEntityRefs([{ kind: 'farm', id: farmId }]);
      setSelectedRowSummary({
        kind: 'farm',
        id: farmId,
        title: farm.name,
        subtitle: 'Карточка хозяйства'
      });
    }
  }, [farm, farmId, setActiveEntityRefs, setSelectedRowSummary]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return <p className="mx-auto w-full max-w-7xl px-4 text-sm font-normal text-gray-500 sm:px-6 lg:px-8">Загрузка...</p>;
  }

  if (!farm) {
    return <p className="mx-auto w-full max-w-7xl px-4 text-sm font-normal text-red-600 sm:px-6 lg:px-8">Хозяйство не найдено.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title={farm.name} description="Карточка хозяйства" />
      <EntityCard title="Данные хозяйства">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="roles">Роли</TabsTrigger>
            <TabsTrigger value="fields">Поля</TabsTrigger>
            <TabsTrigger value="history">История/Сезоны</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <FarmProfileTab farm={farm} />
          </TabsContent>
          <TabsContent value="roles">
            <FarmRolesTab farmId={farmId} roles={roles} reload={reload} />
          </TabsContent>
          <TabsContent value="fields">
            <FarmFieldsTab fields={fields} />
          </TabsContent>
          <TabsContent value="history">
            <p className="text-sm font-normal text-gray-600">История/Сезоны: интеграция с модулем сезонов.</p>
          </TabsContent>
        </Tabs>
      </EntityCard>
    </div>
  );
}

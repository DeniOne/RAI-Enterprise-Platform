'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { AssetDto } from '@/shared/types/party-assets';

export default function ObjectsRoute() {
  const [objects, setObjects] = useState<AssetDto[]>([]);

  useEffect(() => {
    void partyAssetsApi.listAssetsByType('OBJECT').then(setObjects).catch(() => setObjects([]));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Объекты" description="Реестр объектов" />
      <ul className="flex flex-wrap gap-3">
        {objects.map((objectItem) => (
          <li key={objectItem.id} className="inline-flex w-fit items-center rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm">
            {objectItem.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

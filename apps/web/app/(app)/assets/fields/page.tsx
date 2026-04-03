'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { formatUiEntityName } from '@/lib/ui-language';
import { AssetDto } from '@/shared/types/party-assets';

export default function FieldsRoute() {
  const [fields, setFields] = useState<AssetDto[]>([]);

  useEffect(() => {
    void partyAssetsApi.listAssetsByType('FIELD').then(setFields).catch(() => setFields([]));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Поля" description="Реестр полей" action={{ label: '+ Новое поле', href: '/assets/fields/new' }} />
      <ul className="flex flex-wrap gap-3">
        {fields.map((field) => (
          <li key={field.id} className="inline-flex w-fit items-center rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm">
            {formatUiEntityName(field.name)}
          </li>
        ))}
      </ul>
    </div>
  );
}

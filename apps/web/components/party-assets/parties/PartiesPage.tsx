'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';
import { PartyListItemVm } from '@/shared/types/party-assets';

export function PartiesPage() {
  const [items, setItems] = useState<PartyListItemVm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    partyAssetsApi
      .listParties()
      .then((data) => {
        if (active) {
          setItems(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Реестр контрагентов"
        description="Реестр контрагентов без встроенного создания хозяйств"
        action={{ label: '+ Новый контрагент', href: '/parties/new' }}
      />

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-max text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-700">Наименование</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-700">Тип</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-700">Холдинг (вычисляемое)</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-700">Хозяйства</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm font-normal text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm font-normal text-gray-500">
                  Контрагенты отсутствуют.
                </td>
              </tr>
            ) : (
              items.map((party) => (
                <tr key={party.id} className="border-b border-black/5 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 font-normal text-gray-800">
                    <Link href={`/parties/${encodeURIComponent(party.id)}`} className="hover:underline">
                      {party.legalName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{partyTypeLabel(party.type)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                      {party.holdingDerivedName || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{party.farmsCount ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

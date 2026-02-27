'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { FarmListItemVm } from '@/shared/types/party-assets';

export function FarmsPage() {
  const [items, setItems] = useState<FarmListItemVm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    partyAssetsApi
      .listFarms()
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
        title="Реестр хозяйств"
        description="Реестр хозяйств, вычисляемые поля только для чтения"
        action={{ label: '+ Новое хозяйство', href: '/assets/farms/new' }}
      />

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-max text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Хозяйство</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Оператор (вычисляемое)</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Собственник (вычисляемое)</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Холдинг (вычисляемое)</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Аренда (вычисляемое)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-gray-500">
                  Хозяйства отсутствуют.
                </td>
              </tr>
            ) : (
              items.map((farm) => (
                <tr key={farm.id} className="border-b border-black/5 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/assets/farms/${encodeURIComponent(farm.id)}`} className="hover:underline">
                      {farm.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{farm.operatorParty?.name || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{farm.ownerParty?.name || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{farm.holdingDerivedName || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{farm.hasLease ? 'Да' : 'Нет'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

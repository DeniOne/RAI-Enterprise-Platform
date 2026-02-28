'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';
import { PartyListItemVm } from '@/shared/types/party-assets';
import { calculatePartyCompleteness } from '@/shared/lib/party-completeness';
import { PartyQuickCreateDrawer } from './PartyQuickCreateDrawer';
import { Search, Filter, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PartiesPage() {
  const [items, setItems] = useState<PartyListItemVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    partyAssetsApi
      .listParties()
      .then((data) => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-700">
      {/* Canonical Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium tracking-tight text-gray-900">Реестр контрагентов</h1>
          <p className="text-sm font-normal text-gray-500">Управление базой институциональных партнеров и их юридическими данными</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Поиск по ИНН или названию..."
              className="h-11 pl-10 pr-4 bg-white border border-black/10 rounded-2xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-black/5 transition-all w-64"
            />
          </div>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="h-11 rounded-2xl bg-black px-6 text-sm font-medium text-white transition-all hover:bg-gray-800 shadow-sm"
          >
            + Новый контрагент
          </Button>
        </div>
      </div>

      <PartyQuickCreateDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Registry Surface */}
      <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest">
            <List className="h-3.5 w-3.5" />
            <span>Институциональный реестр</span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white border border-black/5 rounded-xl">
            <button className="p-1.5 rounded-lg bg-black/5 text-black transition-all">
              <List className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-400 hover:bg-black/5 transition-all">
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50/50">
                <th className="px-6 py-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Наименование</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Тип</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Холдинг</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Полнота</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase tracking-wider text-[10px] text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                      <span className="text-sm font-normal text-gray-400">Синхронизация с реестром...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-normal">
                    Записи в реестре не обнаружены
                  </td>
                </tr>
              ) : (
                items.map((party) => {
                  const completeness = calculatePartyCompleteness({
                    legalName: party.legalName,
                    shortName: party.shortName,
                    inn: party.registrationData?.inn,
                    kpp: party.registrationData?.kpp,
                    ogrn: party.registrationData?.ogrn || party.registrationData?.ogrnip,
                    jurisdictionId: party.jurisdictionId,
                    type: party.type,
                    addresses: (party.registrationData?.addresses || []) as any,
                    bankAccounts: (party.registrationData?.banks || []) as any,
                    contacts: (party.registrationData?.contacts || []) as any,
                    assetRelations: party.farmsCount ? new Array(party.farmsCount).fill({}) : []
                  });

                  return (
                    <tr key={party.id} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-5">
                        <Link
                          href={`/parties/${encodeURIComponent(party.id)}`}
                          className="text-gray-900 font-medium hover:text-black transition-colors block max-w-md truncate"
                          title={party.legalName}
                        >
                          {party.shortName || party.legalName}
                        </Link>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">ID: {party.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100/50 text-gray-600 text-[11px] font-medium border border-black/5">
                          {partyTypeLabel(party.type)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-500 font-normal">
                          {party.holdingDerivedName || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div className="flex items-center justify-between text-[10px] font-medium transition-colors">
                            <span className={cn(
                              completeness.percent === 100 ? "text-green-600" : "text-amber-600"
                            )}>
                              {completeness.score} из {completeness.total}
                            </span>
                            <span className="text-gray-400">{completeness.percent}%</span>
                          </div>
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                completeness.percent === 100 ? "bg-green-500" : "bg-amber-400"
                              )}
                              style={{ width: `${completeness.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="inline-flex items-center gap-1 text-green-600 text-[11px] font-medium px-2 py-1 rounded-full bg-green-50 border border-green-100">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100/50 flex gap-4 items-start max-w-3xl mx-auto">
        <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
          <Search className="h-4 w-4 text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 leading-none">Системное уведомление</p>
          <p className="text-xs font-normal text-blue-600 leading-relaxed">
            Регистрация хозяйств производится в выделенном реестре активов. Привязка активов к контрагентам
            осуществляется в карточке управления правами.
          </p>
        </div>
      </div>
    </div>
  );
}

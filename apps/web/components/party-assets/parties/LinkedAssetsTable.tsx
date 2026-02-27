import Link from 'next/link';
import { AssetDto, AssetPartyRoleDto } from '@/shared/types/party-assets';
import { assetRoleLabel, assetTypeLabel } from '@/shared/lib/party-assets-labels';

export function LinkedAssetsTable({ assets, roles }: { assets: AssetDto[]; roles: AssetPartyRoleDto[] }) {
  if (assets.length === 0) {
    return <p className="text-sm text-gray-500">Связанные активы отсутствуют.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className="w-max text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-gray-50">
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Актив</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Тип</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Роли</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const links = roles.filter((role) => role.assetId === asset.id);
            const detailsHref = asset.type === 'FARM' ? `/assets/farms/${encodeURIComponent(asset.id)}` : '#';
            return (
              <tr key={asset.id} className="border-b border-black/5 last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3">
                  {detailsHref === '#' ? asset.name : <Link href={detailsHref} className="hover:underline">{asset.name}</Link>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{assetTypeLabel(asset.type)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {links.map((role) => (
                      <span key={role.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                        {assetRoleLabel(role.role)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

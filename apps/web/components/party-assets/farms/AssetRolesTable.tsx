import { AssetPartyRoleDto } from '@/shared/types/party-assets';
import { assetRoleLabel } from '@/shared/lib/party-assets-labels';

export function AssetRolesTable({ roles }: { roles: AssetPartyRoleDto[] }) {
  if (roles.length === 0) {
    return <p className="text-sm text-gray-500">Роли отсутствуют.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className="w-max text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-gray-50">
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Контрагент</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Роль</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Период</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b border-black/5 last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3">{role.partyId}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{assetRoleLabel(role.role)}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                {role.validFrom} - {role.validTo || '...'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { AssetPartyRoleDto } from '@/shared/types/party-assets';
import { AssetRolesTable } from './AssetRolesTable';
import { AssetRoleEditorDrawer } from './AssetRoleEditorDrawer';
import { canActivateFarm } from '@/shared/lib/party-assets-invariants';

export function FarmRolesTab({
  farmId,
  roles,
  reload,
}: {
  farmId: string;
  roles: AssetPartyRoleDto[];
  reload: () => Promise<void>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activation = useMemo(() => canActivateFarm(roles, new Date().toISOString().slice(0, 10)), [roles]);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border px-4 py-3 text-sm ${activation.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {activation.ok ? 'Инвариант роли оператора соблюден.' : activation.reason}
      </div>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
      >
        + Добавить роль
      </button>
      <AssetRolesTable roles={roles} />
      <AssetRoleEditorDrawer assetId={farmId} existingRoles={roles} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={reload} />
    </div>
  );
}

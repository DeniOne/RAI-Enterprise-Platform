'use client';

import { useState } from 'react';
import { AssetDto, AssetPartyRoleDto } from '@/shared/types/party-assets';
import { LinkedAssetsTable } from './LinkedAssetsTable';
import { AssignAssetRoleDrawer } from './AssignAssetRoleDrawer';

export function PartyAssetsTab({
  partyId,
  assets,
  roles,
  reload,
}: {
  partyId: string;
  assets: AssetDto[];
  roles: AssetPartyRoleDto[];
  reload: () => Promise<void>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
      >
        + Назначить роль актива
      </button>
      <LinkedAssetsTable assets={assets} roles={roles} />
      <AssignAssetRoleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        partyId={partyId}
        existingRoles={roles}
        onSaved={reload}
      />
    </div>
  );
}

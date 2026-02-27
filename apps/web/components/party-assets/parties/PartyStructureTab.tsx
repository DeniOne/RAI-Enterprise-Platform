'use client';

import { useState } from 'react';
import { PartyRelationDto } from '@/shared/types/party-assets';
import { PartyStructureTree } from './PartyStructureTree';
import { RelationEditorDrawer } from './RelationEditorDrawer';

export function PartyStructureTab({
  partyId,
  relations,
  reload,
}: {
  partyId: string;
  relations: PartyRelationDto[];
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
        + Добавить связь
      </button>
      <PartyStructureTree relations={relations} />
      <RelationEditorDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} fromPartyId={partyId} onSaved={reload} />
    </div>
  );
}

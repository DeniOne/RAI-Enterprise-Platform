'use client';

import { FormEvent, useState } from 'react';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { AssetPartyRoleDto } from '@/shared/types/party-assets';
import { hasOverlappingAssetRole, validateDateRange } from '@/shared/lib/party-assets-invariants';
import { assetRoleLabel } from '@/shared/lib/party-assets-labels';

const ROLE_OPTIONS: AssetPartyRoleDto['role'][] = ['OWNER', 'OPERATOR', 'LESSEE', 'MANAGER', 'BENEFICIARY'];

export function AssetRoleEditorDrawer({
  assetId,
  existingRoles,
  open,
  onClose,
  onSaved,
}: {
  assetId: string;
  existingRoles: AssetPartyRoleDto[];
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [partyId, setPartyId] = useState('');
  const [role, setRole] = useState<AssetPartyRoleDto['role']>('OPERATOR');
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const dateError = validateDateRange(validFrom, validTo || undefined);
    if (dateError) {
      setError(dateError);
      return;
    }

    const candidate: AssetPartyRoleDto = {
      id: 'new',
      assetId,
      partyId,
      role,
      validFrom,
      validTo: validTo || undefined,
    };

    if (hasOverlappingAssetRole(existingRoles, candidate)) {
      setError('Дубликат роли по датам запрещен.');
      return;
    }

    try {
      await partyAssetsApi.assignAssetRole({
        assetId,
        partyId,
        role,
        validFrom,
        validTo: validTo || undefined,
      });
      await onSaved();
      onClose();
    } catch {
      setError('Не удалось назначить роль.');
    }
  };

  return (
    <SidePanelForm open={open} onClose={onClose} title="Роль контрагента в хозяйстве">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={partyId}
          onChange={(event) => setPartyId(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
          placeholder="ID контрагента"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AssetPartyRoleDto['role'])}
          className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
        >
          {ROLE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {assetRoleLabel(value)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
          />
          <input
            type="date"
            value={validTo}
            onChange={(event) => setValidTo(event.target.value)}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
          />
        </div>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button type="submit" className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
          Сохранить
        </button>
      </form>
    </SidePanelForm>
  );
}

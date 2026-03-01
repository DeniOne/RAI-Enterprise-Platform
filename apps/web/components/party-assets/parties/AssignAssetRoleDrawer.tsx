'use client';

import { FormEvent, useEffect, useState } from 'react';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { AssetPartyRoleDto, FarmListItemVm } from '@/shared/types/party-assets';
import { hasOverlappingAssetRole, validateDateRange } from '@/shared/lib/party-assets-invariants';
import { assetRoleLabel } from '@/shared/lib/party-assets-labels';

const ROLES: AssetPartyRoleDto['role'][] = ['OWNER', 'OPERATOR', 'LESSEE', 'MANAGER', 'BENEFICIARY'];

export function AssignAssetRoleDrawer({
  open,
  onClose,
  partyId,
  existingRoles,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  partyId: string;
  existingRoles: AssetPartyRoleDto[];
  onSaved: () => Promise<void>;
}) {
  const [farms, setFarms] = useState<FarmListItemVm[]>([]);
  const [assetId, setAssetId] = useState('');
  const [role, setRole] = useState<AssetPartyRoleDto['role']>('OPERATOR');
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      partyAssetsApi
        .listFarms()
        .then((data) => {
          setFarms(data);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!assetId) {
      setError('Выберите актив.');
      return;
    }

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
      setError('Дубликат роли с пересечением дат запрещен.');
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
    <SidePanelForm open={open} onClose={onClose} title="Назначить роль в активе">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-black/40 uppercase px-1">Хозяйство (Ферма)</label>
          <select
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
          >
            <option value="">Выберите хозяйство...</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name} {farm.regionCode ? `(${farm.regionCode})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-black/40 uppercase px-1">Роль в активе</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AssetPartyRoleDto['role'])}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
          >
            {ROLES.map((roleCode) => (
              <option key={roleCode} value={roleCode}>
                {assetRoleLabel(roleCode)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/40 uppercase px-1">Дата начала</label>
            <input
              type="date"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/40 uppercase px-1">Дата окончания</label>
            <input
              type="date"
              value={validTo}
              onChange={(event) => setValidTo(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            />
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-black/40"
          disabled={isLoading || !assetId}
        >
          {isLoading ? 'Загрузка...' : 'Сохранить'}
        </button>
      </form>
    </SidePanelForm>
  );
}

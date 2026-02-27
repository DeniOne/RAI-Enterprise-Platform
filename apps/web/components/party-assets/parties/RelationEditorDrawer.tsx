'use client';

import { FormEvent, useState } from 'react';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyRelationType } from '@/shared/types/party-assets';
import { validateOwnershipRelation } from '@/shared/lib/party-assets-invariants';
import { partyRelationTypeLabel } from '@/shared/lib/party-assets-labels';

const RELATION_TYPES: PartyRelationType[] = ['OWNERSHIP', 'MANAGEMENT', 'AFFILIATED', 'AGENCY'];

export function RelationEditorDrawer({
  open,
  onClose,
  fromPartyId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  fromPartyId: string;
  onSaved: () => Promise<void>;
}) {
  const [toPartyId, setToPartyId] = useState('');
  const [relationType, setRelationType] = useState<PartyRelationType>('MANAGEMENT');
  const [sharePct, setSharePct] = useState('');
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      fromPartyId,
      toPartyId,
      relationType,
      sharePct: sharePct ? Number(sharePct) : undefined,
      validFrom,
      validTo: validTo || undefined,
    };

    const invariantError = validateOwnershipRelation({ id: 'new', ...payload });
    if (invariantError) {
      setError(invariantError);
      return;
    }

    try {
      await partyAssetsApi.createPartyRelation(payload);
      await onSaved();
      onClose();
    } catch {
      setError('Не удалось сохранить связь.');
    }
  };

  return (
    <SidePanelForm open={open} onClose={onClose} title="Новая связь контрагентов">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={toPartyId}
          onChange={(event) => setToPartyId(event.target.value)}
          placeholder="ID целевого контрагента"
          className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
        />
        <select
          value={relationType}
          onChange={(event) => setRelationType(event.target.value as PartyRelationType)}
          className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
        >
          {RELATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {partyRelationTypeLabel(type)}
            </option>
          ))}
        </select>
        <input
          value={sharePct}
          onChange={(event) => setSharePct(event.target.value)}
          placeholder="Доля, % (для связи владения)"
          className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            type="date"
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
          />
          <input
            value={validTo}
            onChange={(event) => setValidTo(event.target.value)}
            type="date"
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

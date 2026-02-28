'use client';

import { FormEvent, useEffect, useState } from 'react';
import { SidePanelForm } from '@/components/party-assets/common/SidePanelForm';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyListItemVm, PartyRelationType } from '@/shared/types/party-assets';
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
  const [parties, setParties] = useState<PartyListItemVm[]>([]);
  const [toPartyId, setToPartyId] = useState('');
  const [relationType, setRelationType] = useState<PartyRelationType>('MANAGEMENT');
  const [sharePct, setSharePct] = useState('');
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      partyAssetsApi
        .listParties()
        .then((data) => {
          // Filter out the current party to prevent self-relations
          setParties(data.filter((p) => p.id !== fromPartyId));
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, fromPartyId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!toPartyId) {
      setError('Выберите контрагента.');
      return;
    }

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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-black/40 uppercase px-1">Целевой контрагент</label>
          <select
            value={toPartyId}
            onChange={(event) => setToPartyId(event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
          >
            <option value="">Выберите контрагента...</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.legalName} ({party.jurisdictionName})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-black/40 uppercase px-1">Тип связи</label>
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
        </div>

        {relationType === 'OWNERSHIP' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/40 uppercase px-1">Доля владения, %</label>
            <input
              value={sharePct}
              onChange={(event) => setSharePct(event.target.value)}
              placeholder="0-100"
              type="number"
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/40 uppercase px-1">Дата начала</label>
            <input
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
              type="date"
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/40 uppercase px-1">Дата окончания</label>
            <input
              value={validTo}
              onChange={(event) => setValidTo(event.target.value)}
              type="date"
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            />
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-black/40"
          disabled={isLoading || !toPartyId}
        >
          {isLoading ? 'Загрузка...' : 'Сохранить'}
        </button>
      </form>
    </SidePanelForm>
  );
}

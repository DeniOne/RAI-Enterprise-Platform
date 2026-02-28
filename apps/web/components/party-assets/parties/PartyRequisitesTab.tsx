'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { PartyDto } from '@/shared/types/party-assets';
import { formatLookupBadgeDate } from '@/shared/lib/party-lookup';
import { getPartyRequisiteFields, getPartyRequisiteValue } from '@/shared/lib/party-requisites-schema';

type Jurisdiction = {
  id: string;
  code: string;
  name: string;
};

export function PartyRequisitesTab({ party }: { party: PartyDto }) {
  const requisites = party.registrationData;
  const [jurisdictionCode, setJurisdictionCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api.partyManagement
      .jurisdictions()
      .then((response) => {
        if (!active) {
          return;
        }

        const items = Array.isArray(response?.data) ? (response.data as Jurisdiction[]) : [];
        const matched = items.find((item) => item.id === party.jurisdictionId);
        setJurisdictionCode(matched?.code ?? null);
      })
      .catch(() => {
        if (active) {
          setJurisdictionCode(null);
        }
      });

    return () => {
      active = false;
    };
  }, [party.jurisdictionId]);

  const fields = useMemo(
    () => getPartyRequisiteFields(jurisdictionCode, party.type),
    [jurisdictionCode, party.type],
  );

  return (
    <div className="space-y-4">
      {requisites?.dataProvenance ? (
        <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
          Заполнено из {requisites.dataProvenance.lookupSource} {formatLookupBadgeDate(requisites.dataProvenance.fetchedAt)}
        </span>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.key === 'legalAddress' ? 'md:col-span-2' : ''}>
            <Field label={field.label} value={getPartyRequisiteValue(requisites, field.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <p className="text-xs font-normal text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-normal text-gray-800">{value}</p>
    </div>
  );
}

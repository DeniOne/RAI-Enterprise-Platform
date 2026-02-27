import { PartyDto } from '@/shared/types/party-assets';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';

export function PartyProfileTab({ party }: { party: PartyDto }) {
  const shortName = party.shortName || party.registrationData?.shortName || '—';
  const comment = party.comment || party.registrationData?.comment || '—';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Юридическое наименование" value={party.legalName} />
      <Field label="Тип" value={partyTypeLabel(party.type)} />
      <Field label="Юрисдикция" value={party.jurisdictionId} />
      <Field label="Статус" value={party.status} />
      <Field label="Краткое наименование" value={shortName} />
      <Field label="Комментарий" value={comment} />
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

import { PartyDto } from '@/shared/types/party-assets';
import { formatLookupBadgeDate } from '@/shared/lib/party-lookup';

export function PartyRequisitesTab({ party }: { party: PartyDto }) {
  const requisites = party.registrationData;
  const legalAddress = requisites?.addresses?.find((item) => item.type === 'LEGAL')?.address ?? requisites?.addresses?.[0]?.address ?? '—';

  return (
    <div className="space-y-4">
      {requisites?.dataProvenance ? (
        <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
          Заполнено из {requisites.dataProvenance.lookupSource} {formatLookupBadgeDate(requisites.dataProvenance.fetchedAt)}
        </span>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="ИНН" value={requisites?.inn || '—'} />
        <Field label="КПП" value={requisites?.kpp || '—'} />
        <Field label="ОГРН" value={requisites?.ogrn || '—'} />
        <Field label="ОГРНИП" value={requisites?.ogrnip || '—'} />
        <Field label="УНП" value={requisites?.unp || '—'} />
        <Field label="БИН" value={requisites?.bin || '—'} />
        <div className="md:col-span-2">
          <Field label="Юридический адрес" value={legalAddress} />
        </div>
      </div>
      <p className="text-sm font-normal text-gray-600">
        Динамические реквизиты для юрисдикции <span className="font-normal text-gray-900">{party.jurisdictionId}</span> рендерятся через серверную схему.
      </p>
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

import { FarmDto } from '@/shared/types/party-assets';

export function FarmProfileTab({ farm }: { farm: FarmDto }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Наименование" value={farm.name} />
      <Field label="Регион" value={farm.regionCode || '—'} />
      <Field label="Статус" value={farm.status} />
      <Field label="Холдинг (вычисляемое)" value={farm.holdingDerivedName || '—'} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <p className="text-xs font-normal text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-800">{value}</p>
    </div>
  );
}

import { AssetDto } from '@/shared/types/party-assets';

export function FarmFieldsTab({ fields }: { fields: AssetDto[] }) {
  if (fields.length === 0) {
    return <p className="text-sm font-normal text-gray-500">Поля не найдены.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {fields.map((field) => (
        <li key={field.id} className="inline-flex w-fit flex-col rounded-2xl border border-black/10 px-4 py-2.5 text-sm">
          <p className="font-medium text-gray-900">{field.name}</p>
          <p className="text-gray-600">{field.regionCode || 'Регион не указан'}</p>
        </li>
      ))}
    </ul>
  );
}

import { PartyRelationDto } from '@/shared/types/party-assets';
import { partyRelationTypeLabel } from '@/shared/lib/party-assets-labels';

export function PartyStructureTree({ relations }: { relations: PartyRelationDto[] }) {
  if (relations.length === 0) {
    return <p className="text-sm font-normal text-gray-500">Связи отсутствуют.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {relations.map((relation) => (
        <li key={relation.id} className="inline-flex w-fit flex-col rounded-2xl border border-black/10 px-4 py-2.5 text-sm">
          <p className="font-medium text-gray-800">{partyRelationTypeLabel(relation.relationType)}</p>
          <p className="text-gray-600">
            {relation.fromPartyId} → {relation.toPartyId}
          </p>
          <p className="text-xs text-gray-500">
            {relation.validFrom} - {relation.validTo || '...'}
          </p>
        </li>
      ))}
    </ul>
  );
}

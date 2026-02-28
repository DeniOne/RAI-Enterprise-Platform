import { PartyRegistrationData, PartyType } from '@/shared/types/party-assets';

export type PartyRequisiteFieldKey = 'inn' | 'kpp' | 'ogrn' | 'ogrnip' | 'unp' | 'bin' | 'legalAddress';

export type PartyRequisiteField = {
  key: PartyRequisiteFieldKey;
  label: string;
};

const FIELD_LABELS: Record<PartyRequisiteFieldKey, string> = {
  inn: 'ИНН',
  kpp: 'КПП',
  ogrn: 'ОГРН',
  ogrnip: 'ОГРНИП',
  unp: 'УНП',
  bin: 'БИН',
  legalAddress: 'Юридический адрес',
};

function isEntrepreneurType(partyType: PartyType): boolean {
  return partyType === 'IP' || partyType === 'KFH';
}

export function getPartyRequisiteFields(jurisdictionCode: string | null | undefined, partyType: PartyType): PartyRequisiteField[] {
  const code = jurisdictionCode?.trim().toUpperCase();

  let keys: PartyRequisiteFieldKey[];
  switch (code) {
    case 'RU':
      keys = isEntrepreneurType(partyType)
        ? ['inn', 'ogrnip', 'legalAddress']
        : ['inn', 'kpp', 'ogrn', 'legalAddress'];
      break;
    case 'BY':
      keys = ['unp', 'legalAddress'];
      break;
    case 'KZ':
      keys = ['bin', 'legalAddress'];
      break;
    default:
      keys = ['legalAddress'];
      break;
  }

  return keys.map((key) => ({ key, label: FIELD_LABELS[key] }));
}

export function getPartyRequisiteValue(
  registrationData: PartyRegistrationData | null | undefined,
  key: PartyRequisiteFieldKey,
): string {
  if (key === 'legalAddress') {
    return (
      registrationData?.addresses?.find((item) => item.type === 'LEGAL')?.address ??
      registrationData?.addresses?.[0]?.address ??
      '—'
    );
  }

  return registrationData?.[key] || '—';
}

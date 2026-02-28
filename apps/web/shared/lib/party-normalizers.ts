import { PartyDto, PartyListItemVm, PartyRegistrationData, PartyStatus, PartyType } from '@/shared/types/party-assets';

type RawParty = Partial<PartyDto> & {
  registrationData?: PartyRegistrationData | null;
  holdingDerivedName?: string;
  farmsCount?: number;
};

function normalizeRegistrationData(value: unknown): PartyRegistrationData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as PartyRegistrationData;
}

function normalizePartyType(value: unknown): PartyType {
  switch (value) {
    case 'HOLDING':
    case 'LEGAL_ENTITY':
    case 'IP':
    case 'KFH':
    case 'MANAGEMENT_CO':
    case 'BANK':
    case 'INSURER':
      return value;
    default:
      return 'LEGAL_ENTITY';
  }
}

function normalizePartyStatus(value: unknown): PartyStatus {
  return value === 'FROZEN' ? 'FROZEN' : 'ACTIVE';
}

export function normalizePartyDto(raw: RawParty): PartyDto {
  const registrationData = normalizeRegistrationData(raw.registrationData);

  return {
    id: String(raw.id ?? ''),
    legalName: String(raw.legalName ?? ''),
    jurisdictionId: String(raw.jurisdictionId ?? ''),
    type: normalizePartyType(raw.type ?? registrationData?.partyType),
    status: normalizePartyStatus(raw.status ?? registrationData?.status),
    shortName: raw.shortName ?? registrationData?.shortName,
    comment: raw.comment ?? registrationData?.comment,
    registrationData,
  };
}

export function normalizePartyListItem(raw: RawParty): PartyListItemVm {
  return {
    ...normalizePartyDto(raw),
    holdingDerivedName: raw.holdingDerivedName,
    farmsCount: typeof raw.farmsCount === 'number' ? raw.farmsCount : 0,
  };
}

export type PartyType = 'HOLDING' | 'LEGAL_ENTITY' | 'IP' | 'KFH' | 'MANAGEMENT_CO' | 'BANK' | 'INSURER';
export type PartyRelationType = 'OWNERSHIP' | 'MANAGEMENT' | 'AFFILIATED' | 'AGENCY';
export type AssetType = 'FARM' | 'FIELD' | 'OBJECT';
export type AssetPartyRole = 'OWNER' | 'OPERATOR' | 'LESSEE' | 'MANAGER' | 'BENEFICIARY';
export type PartyStatus = 'ACTIVE' | 'FROZEN';

export interface PartyAddressRecord {
  type: string;
  address: string;
}

export interface PartyContactRecord {
  id?: string;
  roleType: 'SIGNATORY' | 'OPERATIONAL';
  fullName: string;
  position?: string;
  basisOfAuthority?: string;
  phones?: string;
  email?: string;
  telegramId?: string;
  frontOfficeAccess?: {
    status?: 'INVITED' | 'ACTIVE' | 'REVOKED';
    telegramId?: string;
    invitationId?: string;
    bindingId?: string;
    userId?: string;
    proposedLogin?: string;
    invitedAt?: string;
    activatedAt?: string;
  };
}

export interface PartyBankRecord {
  accountName?: string;
  bankName: string;
  accountNumber: string;
  bic?: string;
  swift?: string;
  corrAccount?: string;
  inn?: string;
  kpp?: string;
  address?: string;
  status?: string;
  lookupSource?: string;
  lookupReferenceBankName?: string;
  lookupReferenceCorrAccount?: string;
  lookupReferenceInn?: string;
  lookupReferenceKpp?: string;
  currency?: string;
  isPrimary?: boolean;
}

export interface PartyRegistrationData {
  partyType?: PartyType;
  status?: PartyStatus;
  shortName?: string;
  legalForm?: string;
  comment?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  ogrnip?: string;
  unp?: string;
  bin?: string;
  addresses?: PartyAddressRecord[];
  contacts?: PartyContactRecord[];
  banks?: PartyBankRecord[];
  requisites?: Partial<Pick<PartyRegistrationData, 'inn' | 'kpp' | 'ogrn' | 'ogrnip' | 'unp' | 'bin'>>;
  dataProvenance?: {
    lookupSource: string;
    fetchedAt: string;
    requestKey: string;
  };
}

export interface PartyDto {
  id: string;
  type: PartyType;
  legalName: string;
  shortName?: string;
  jurisdictionId: string;
  status: PartyStatus;
  comment?: string;
  registrationData?: PartyRegistrationData | null;
}

export interface PartyRelationDto {
  id: string;
  fromPartyId: string;
  toPartyId: string;
  relationType: PartyRelationType;
  sharePct?: number;
  validFrom: string;
  validTo?: string;
  basisDocId?: string;
  fromPartyName?: string;
  toPartyName?: string;
}

export interface AssetDto {
  id: string;
  type: AssetType;
  name: string;
  regionCode?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface FarmDto extends AssetDto {
  type: 'FARM';
  holdingDerivedName?: string;
}

export interface AssetPartyRoleDto {
  id: string;
  assetId: string;
  partyId: string;
  role: AssetPartyRole;
  validFrom: string;
  validTo?: string;
  basisDoc?: string;
}

export interface PartyListItemVm extends PartyDto {
  holdingDerivedName?: string;
  farmsCount?: number;
}

export interface FarmListItemVm extends FarmDto {
  operatorParty?: { id: string; name: string };
  ownerParty?: { id: string; name: string };
  holdingDerivedName?: string;
  hasLease?: boolean;
}

export interface PartyAssetsVm {
  assets: AssetDto[];
  roles: AssetPartyRoleDto[];
}

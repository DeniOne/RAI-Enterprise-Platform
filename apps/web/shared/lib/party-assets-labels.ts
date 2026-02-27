import { AssetPartyRole, AssetType, PartyRelationType, PartyType } from '@/shared/types/party-assets';

const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  HOLDING: 'Холдинг',
  LEGAL_ENTITY: 'Юридическое лицо',
  IP: 'ИП',
  KFH: 'КФХ',
  MANAGEMENT_CO: 'Управляющая компания',
  BANK: 'Банк',
  INSURER: 'Страховая компания',
};

export function partyTypeLabel(value: PartyType): string {
  return PARTY_TYPE_LABELS[value] ?? value;
}

const PARTY_RELATION_LABELS: Record<PartyRelationType, string> = {
  OWNERSHIP: 'Владение',
  MANAGEMENT: 'Управление',
  AFFILIATED: 'Аффилированность',
  AGENCY: 'Агентская связь',
};

export function partyRelationTypeLabel(value: PartyRelationType): string {
  return PARTY_RELATION_LABELS[value] ?? value;
}

const ASSET_ROLE_LABELS: Record<AssetPartyRole, string> = {
  OWNER: 'Собственник',
  OPERATOR: 'Оператор',
  LESSEE: 'Арендатор',
  MANAGER: 'Управляющий',
  BENEFICIARY: 'Бенефициар',
};

export function assetRoleLabel(value: AssetPartyRole): string {
  return ASSET_ROLE_LABELS[value] ?? value;
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  FARM: 'Хозяйство',
  FIELD: 'Поле',
  OBJECT: 'Объект',
};

export function assetTypeLabel(value: AssetType): string {
  return ASSET_TYPE_LABELS[value] ?? value;
}

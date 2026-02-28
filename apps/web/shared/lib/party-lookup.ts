import { PartyType } from '@/shared/types/party-assets';
import {
  IdentificationFieldKey,
  IdentificationSchemaField,
  PartyIdentificationSchema,
  PartyLookupJurisdiction,
} from '@/shared/types/party-lookup';

function computeChecksum(value: string, coefficients: number[]): number {
  const sum = coefficients.reduce((acc, coefficient, index) => {
    const digit = Number(value[index] ?? 0);
    return acc + digit * coefficient;
  }, 0);
  return (sum % 11) % 10;
}

export function isRuInnValid(value: string, partyType: Extract<PartyType, 'LEGAL_ENTITY' | 'IP' | 'KFH'>): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  if (partyType === 'LEGAL_ENTITY') {
    if (value.length !== 10) {
      return false;
    }
    const checksum = computeChecksum(value, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
    return checksum === Number(value[9]);
  }

  if (value.length !== 12) {
    return false;
  }

  const checksum11 = computeChecksum(value, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  const checksum12 = computeChecksum(value, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  return checksum11 === Number(value[10]) && checksum12 === Number(value[11]);
}

export function validateInnRU(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  if (value.length === 10) {
    return isRuInnValid(value, 'LEGAL_ENTITY');
  }
  if (value.length === 12) {
    return isRuInnValid(value, 'IP');
  }
  return false;
}

export function resolveLookupJurisdictionCode(code: string | undefined): PartyLookupJurisdiction | null {
  if (!code) {
    return null;
  }
  const normalized = code.trim().toUpperCase();
  if (normalized === 'RU' || normalized === 'BY' || normalized === 'KZ') {
    return normalized;
  }
  return null;
}

export function formatLookupBadgeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ru-RU');
}

export function normalizeIdentificationValue(value: string, field: IdentificationSchemaField): string {
  const normalized = field.mask === 'digits' ? value.replace(/\D+/g, '') : value;
  return normalized.slice(0, field.maxLength);
}

export function getIdentificationFieldValue(
  identification: Partial<Record<IdentificationFieldKey, string>>,
  key: IdentificationFieldKey,
): string {
  return identification[key] ?? '';
}

export function assertIdentificationSchemaSafety(schema: PartyIdentificationSchema): void {
  if (schema.jurisdictionId !== 'RU') {
    return;
  }
  const invalidFields = schema.fields
    .map((field) => field.key)
    .filter((field) => field === 'unp' || field === 'bin');
  if (invalidFields.length > 0) {
    throw new Error(`Небезопасная schema идентификации для RU: обнаружены поля ${invalidFields.join(', ')}`);
  }
}

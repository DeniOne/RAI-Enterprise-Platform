export function digitsOnly(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeBankText(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

const CONTROL_WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1];

function hasValidRussianBankChecksum(controlValue: string) {
  if (!/^\d{23}$/.test(controlValue)) {
    return false;
  }

  const checksum = controlValue
    .split('')
    .reduce((sum, digit, index) => sum + ((Number(digit) * CONTROL_WEIGHTS[index]) % 10), 0);

  return checksum % 10 === 0;
}

export function isValidRussianSettlementAccount(accountNumber: string, bic: string) {
  const normalizedAccount = digitsOnly(accountNumber);
  const normalizedBic = digitsOnly(bic);

  if (normalizedAccount.length !== 20 || normalizedBic.length !== 9) {
    return false;
  }

  return hasValidRussianBankChecksum(`${normalizedBic.slice(-3)}${normalizedAccount}`);
}

export function isValidRussianCorrespondentAccount(corrAccount: string, bic: string) {
  const normalizedCorrAccount = digitsOnly(corrAccount);
  const normalizedBic = digitsOnly(bic);

  if (normalizedCorrAccount.length !== 20 || normalizedBic.length !== 9) {
    return false;
  }

  return hasValidRussianBankChecksum(`0${normalizedBic.slice(4, 6)}${normalizedCorrAccount}`);
}

export interface BankLookupReferenceComparable {
  bankName?: string;
  corrAccount?: string;
  inn?: string;
  kpp?: string;
  lookupReferenceBankName?: string;
  lookupReferenceCorrAccount?: string;
  lookupReferenceInn?: string;
  lookupReferenceKpp?: string;
}

export function getBankLookupReferenceMismatches(value: BankLookupReferenceComparable) {
  const mismatches: Array<{ field: 'bankName' | 'corrAccount' | 'inn' | 'kpp'; message: string }> = [];

  if (
    value.lookupReferenceBankName &&
    value.bankName &&
    normalizeBankText(value.lookupReferenceBankName) !== normalizeBankText(value.bankName)
  ) {
    mismatches.push({
      field: 'bankName',
      message: 'Наименование банка отличается от справочника по указанному БИК',
    });
  }

  if (
    value.lookupReferenceCorrAccount &&
    value.corrAccount &&
    digitsOnly(value.lookupReferenceCorrAccount) !== digitsOnly(value.corrAccount)
  ) {
    mismatches.push({
      field: 'corrAccount',
      message: 'Корр. счет отличается от справочника по указанному БИК',
    });
  }

  if (
    value.lookupReferenceInn &&
    value.inn &&
    digitsOnly(value.lookupReferenceInn) !== digitsOnly(value.inn)
  ) {
    mismatches.push({
      field: 'inn',
      message: 'ИНН банка отличается от справочника по указанному БИК',
    });
  }

  if (
    value.lookupReferenceKpp &&
    value.kpp &&
    digitsOnly(value.lookupReferenceKpp) !== digitsOnly(value.kpp)
  ) {
    mismatches.push({
      field: 'kpp',
      message: 'КПП банка отличается от справочника по указанному БИК',
    });
  }

  return mismatches;
}

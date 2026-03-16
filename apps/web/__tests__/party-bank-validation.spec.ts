import {
  getBankLookupReferenceMismatches,
  isValidRussianCorrespondentAccount,
  isValidRussianSettlementAccount,
} from '@/shared/lib/party-bank-validation';
import { BankAccountSchema } from '@/shared/lib/party-schemas';

describe('party-bank-validation', () => {
  it('accepts valid russian bank details', () => {
    expect(isValidRussianSettlementAccount('40702810900000002859', '044525225')).toBe(true);
    expect(isValidRussianCorrespondentAccount('30101810400000000225', '044525225')).toBe(true);
  });

  it('rejects invalid russian bank details', () => {
    expect(isValidRussianSettlementAccount('40702810900000002852', '044525225')).toBe(false);
    expect(isValidRussianCorrespondentAccount('30101810400000000226', '044525225')).toBe(false);
  });

  it('adds actionable zod errors for invalid checksum', () => {
    const parsed = BankAccountSchema.safeParse({
      accountName: 'Основной',
      accountNumber: '40702810900000002852',
      bic: '044525225',
      bankName: 'ПАО СБЕРБАНК',
      corrAccount: '30101810400000000226',
      currency: 'RUB',
      isPrimary: true,
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const flattened = parsed.error.flatten().fieldErrors;
    expect(flattened.accountNumber?.[0]).toContain('контрольную проверку');
    expect(flattened.corrAccount?.[0]).toContain('контрольную проверку');
  });

  it('detects mismatch against lookup reference snapshot', () => {
    expect(getBankLookupReferenceMismatches({
      bankName: 'ДРУГОЙ БАНК',
      corrAccount: '30101810400000000225',
      inn: '7707083894',
      kpp: '773601001',
      lookupReferenceBankName: 'ПАО СБЕРБАНК',
      lookupReferenceCorrAccount: '30101810400000000225',
      lookupReferenceInn: '7707083893',
      lookupReferenceKpp: '773601001',
    })).toEqual([
      expect.objectContaining({ field: 'bankName' }),
      expect.objectContaining({ field: 'inn' }),
    ]);
  });

  it('adds zod errors when manual реквизиты disagree with lookup snapshot', () => {
    const parsed = BankAccountSchema.safeParse({
      accountName: 'Основной',
      accountNumber: '40702810900000002859',
      bic: '044525225',
      bankName: 'ДРУГОЙ БАНК',
      corrAccount: '30101810400000000225',
      inn: '7707083894',
      kpp: '773601001',
      lookupReferenceBankName: 'ПАО СБЕРБАНК',
      lookupReferenceCorrAccount: '30101810400000000225',
      lookupReferenceInn: '7707083893',
      lookupReferenceKpp: '773601001',
      currency: 'RUB',
      isPrimary: true,
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const flattened = parsed.error.flatten().fieldErrors;
    expect(flattened.bankName?.[0]).toContain('справочника');
    expect(flattened.inn?.[0]).toContain('справочника');
  });
});

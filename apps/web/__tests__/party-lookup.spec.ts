import { isRuInnValid, resolveLookupJurisdictionCode } from '@/shared/lib/party-lookup';

describe('party lookup helpers', () => {
  it('валидирует ИНН для RU', () => {
    expect(isRuInnValid('7707083893', 'LEGAL_ENTITY')).toBe(true);
    expect(isRuInnValid('7707083894', 'LEGAL_ENTITY')).toBe(false);
    expect(isRuInnValid('500100732259', 'IP')).toBe(true);
    expect(isRuInnValid('500100732258', 'IP')).toBe(false);
  });

  it('разрешает только RU/BY/KZ', () => {
    expect(resolveLookupJurisdictionCode('ru')).toBe('RU');
    expect(resolveLookupJurisdictionCode('BY')).toBe('BY');
    expect(resolveLookupJurisdictionCode('KZ')).toBe('KZ');
    expect(resolveLookupJurisdictionCode('US')).toBeNull();
  });
});

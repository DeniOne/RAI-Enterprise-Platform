import { isRuInnValid } from './ru-inn.validator';

describe('isRuInnValid', () => {
  it('валидирует ИНН юрлица (10 цифр)', () => {
    expect(isRuInnValid('7707083893', 'LEGAL_ENTITY')).toBe(true);
    expect(isRuInnValid('7707083894', 'LEGAL_ENTITY')).toBe(false);
  });

  it('валидирует ИНН ИП/КФХ (12 цифр)', () => {
    expect(isRuInnValid('500100732259', 'IP')).toBe(true);
    expect(isRuInnValid('500100732258', 'IP')).toBe(false);
    expect(isRuInnValid('500100732259', 'KFH')).toBe(true);
  });
});

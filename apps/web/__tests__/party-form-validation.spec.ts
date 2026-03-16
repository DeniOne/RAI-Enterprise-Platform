import {
  PARTY_TAB_LABELS,
  collectPartyValidationIssues,
  getPartyCompletenessTarget,
} from '@/shared/lib/party-form-validation';

describe('party-form-validation', () => {
  it('maps nested form errors to actionable issues', () => {
    const issues = collectPartyValidationIssues({
      ogrn: { message: 'Поле обязательно' },
      bankAccounts: [
        {
          accountNumber: { message: 'Р/с должен быть 20 знаков' },
        },
      ],
      contacts: [
        {
          email: { message: 'Некорректный email' },
        },
      ],
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'ogrn',
          tab: 'profile',
          tabLabel: PARTY_TAB_LABELS.profile,
          label: 'ОГРН / ОГРНИП',
        }),
        expect.objectContaining({
          path: 'bankAccounts.0.accountNumber',
          tab: 'bank',
          tabLabel: PARTY_TAB_LABELS.bank,
          label: 'Счет 1: номер счета',
        }),
        expect.objectContaining({
          path: 'contacts.0.email',
          tab: 'contacts',
          tabLabel: PARTY_TAB_LABELS.contacts,
          label: 'Контакт 1: email',
        }),
      ]),
    );
  });

  it('provides navigation targets for completeness hints', () => {
    expect(getPartyCompletenessTarget('ОГРН')).toEqual(
      expect.objectContaining({
        tab: 'profile',
        targetName: 'ogrn',
      }),
    );

    expect(getPartyCompletenessTarget('Связи в структуре')).toEqual(
      expect.objectContaining({
        tab: 'structure',
        anchorId: 'party-tab-structure',
      }),
    );
  });
});

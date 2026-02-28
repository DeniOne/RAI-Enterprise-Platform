import { normalizePartyDto, normalizePartyListItem } from '@/shared/lib/party-normalizers';

describe('party normalizers', () => {
  it('восстанавливает type/status/shortName/comment из registrationData', () => {
    const party = normalizePartyDto({
      id: 'party-1',
      legalName: 'ООО Рассвет',
      jurisdictionId: 'jur-1',
      registrationData: {
        partyType: 'BANK',
        status: 'FROZEN',
        shortName: 'Рассвет',
        comment: 'Проверка',
      },
    });

    expect(party.type).toBe('BANK');
    expect(party.status).toBe('FROZEN');
    expect(party.shortName).toBe('Рассвет');
    expect(party.comment).toBe('Проверка');
  });

  it('для списка подставляет farmsCount=0 по умолчанию', () => {
    const item = normalizePartyListItem({
      id: 'party-2',
      legalName: 'ООО Юг',
      jurisdictionId: 'jur-2',
      registrationData: {
        partyType: 'LEGAL_ENTITY',
        status: 'ACTIVE',
      },
    });

    expect(item.farmsCount).toBe(0);
    expect(item.type).toBe('LEGAL_ENTITY');
  });
});

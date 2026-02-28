import { getPartyRequisiteFields } from '@/shared/lib/party-requisites-schema';

describe('party requisites schema', () => {
  it('для RU LEGAL_ENTITY не показывает УНП и БИН', () => {
    expect(getPartyRequisiteFields('RU', 'LEGAL_ENTITY').map((field) => field.key)).toEqual([
      'inn',
      'kpp',
      'ogrn',
      'legalAddress',
    ]);
  });

  it('для RU IP показывает только ИНН, ОГРНИП и адрес', () => {
    expect(getPartyRequisiteFields('RU', 'IP').map((field) => field.key)).toEqual([
      'inn',
      'ogrnip',
      'legalAddress',
    ]);
  });

  it('для BY показывает только УНП и адрес', () => {
    expect(getPartyRequisiteFields('BY', 'LEGAL_ENTITY').map((field) => field.key)).toEqual([
      'unp',
      'legalAddress',
    ]);
  });

  it('для KZ показывает только БИН и адрес', () => {
    expect(getPartyRequisiteFields('KZ', 'LEGAL_ENTITY').map((field) => field.key)).toEqual([
      'bin',
      'legalAddress',
    ]);
  });
});

import { partyAssetsApi } from '@/lib/party-assets-api';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  buildIdempotencyKey: jest.fn(() => 'party-assets-party-create:test'),
  serializeIdempotencyPayload: jest.fn((value: unknown) => JSON.stringify(value)),
}));

describe('partyAssetsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('создаёт Party через /parties и сохраняет type/status в registrationData', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        id: 'party-1',
        type: 'LEGAL_ENTITY',
        legalName: 'ООО Рассвет',
        jurisdictionId: 'jur-1',
        status: 'ACTIVE',
        registrationData: {
          partyType: 'LEGAL_ENTITY',
          status: 'ACTIVE',
        },
      },
    });

    await partyAssetsApi.createParty({
      type: 'LEGAL_ENTITY',
      legalName: 'ООО Рассвет',
      jurisdictionId: 'jur-1',
      status: 'ACTIVE',
      registrationData: {
        partyType: 'LEGAL_ENTITY',
        status: 'ACTIVE',
      },
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/parties',
      {
        type: 'LEGAL_ENTITY',
        legalName: 'ООО Рассвет',
        shortName: undefined,
        jurisdictionId: 'jur-1',
        status: 'ACTIVE',
        comment: undefined,
        registrationData: {
          partyType: 'LEGAL_ENTITY',
          status: 'ACTIVE',
        },
      },
      {
        headers: {
          'Idempotency-Key': 'party-assets-party-create:test',
        },
      },
    );
  });
});

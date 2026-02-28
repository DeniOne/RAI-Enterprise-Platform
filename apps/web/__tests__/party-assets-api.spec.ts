import { partyAssetsApi } from '@/lib/party-assets-api';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('partyAssetsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('создаёт Party через /commerce/parties и сохраняет type/status в registrationData', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        id: 'party-1',
        legalName: 'ООО Рассвет',
        jurisdictionId: 'jur-1',
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

    expect(apiClient.post).toHaveBeenCalledWith('/commerce/parties', {
      legalName: 'ООО Рассвет',
      jurisdictionId: 'jur-1',
      regulatoryProfileId: undefined,
      registrationData: {
        partyType: 'LEGAL_ENTITY',
        status: 'ACTIVE',
      },
    });
  });
});

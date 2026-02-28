import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyCreateWizard } from '@/components/party-assets/parties/PartyCreateWizard';
import { api } from '@/lib/api';
import { partyAssetsApi } from '@/lib/party-assets-api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  api: {
    partyManagement: {
      jurisdictions: jest.fn(),
    },
  },
}));

jest.mock('@/lib/party-assets-api', () => ({
  partyAssetsApi: {
    getIdentificationSchema: jest.fn(),
    lookupParty: jest.fn(),
    createParty: jest.fn(),
  },
}));

describe('PartyCreateWizard lookup guard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (api.partyManagement.jurisdictions as jest.Mock).mockResolvedValue({
      data: [{ id: 'jur-ru', code: 'RU', name: 'Россия' }],
    });
    (partyAssetsApi.getIdentificationSchema as jest.Mock).mockResolvedValue({
      jurisdictionId: 'RU',
      partyType: 'LEGAL_ENTITY',
      fields: [
        { key: 'inn', label: 'ИНН', dataType: 'string', required: true, mask: 'digits', minLength: 10, maxLength: 10 },
        { key: 'kpp', label: 'КПП', dataType: 'string', required: false, mask: 'digits', minLength: 9, maxLength: 9 },
      ],
      lookup: { enabled: true, triggerKeys: ['inn'], buttonLabel: 'Найти по ИНН', debounceMs: 800 },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('не вызывает lookup при невалидном RU ИНН', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PartyCreateWizard />);

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    const innInput = await screen.findByLabelText(/ИНН/i);
    await user.type(innInput, '7707083894');

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(partyAssetsApi.lookupParty).not.toHaveBeenCalled();
    });
  });
});

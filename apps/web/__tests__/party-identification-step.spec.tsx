import { render, screen, waitFor } from '@testing-library/react';
import { PartyIdentificationStep } from '@/components/party-assets/parties/PartyIdentificationStep';
import { partyAssetsApi } from '@/lib/party-assets-api';

jest.mock('@/lib/party-assets-api', () => ({
  partyAssetsApi: {
    getIdentificationSchema: jest.fn(),
  },
}));

describe('PartyIdentificationStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерит только поля из schema.fields', async () => {
    (partyAssetsApi.getIdentificationSchema as jest.Mock).mockResolvedValue({
      jurisdictionId: 'RU',
      partyType: 'LEGAL_ENTITY',
      fields: [
        { key: 'inn', label: 'ИНН', dataType: 'string', required: true, mask: 'digits', minLength: 10, maxLength: 10 },
        { key: 'kpp', label: 'КПП', dataType: 'string', required: false, mask: 'digits', minLength: 9, maxLength: 9 },
      ],
      lookup: { enabled: true, triggerKeys: ['inn'], buttonLabel: 'Найти по ИНН', debounceMs: 800 },
    });

    render(
      <PartyIdentificationStep
        jurisdictionId="jur-ru"
        partyType="LEGAL_ENTITY"
        value={{}}
        onChangeField={jest.fn()}
        onSchemaLoaded={jest.fn()}
        onLookup={jest.fn()}
        onApply={jest.fn()}
        onManual={jest.fn()}
        lookupLoading={false}
      />,
    );

    await waitFor(() => expect(partyAssetsApi.getIdentificationSchema).toHaveBeenCalled());

    expect(screen.getByLabelText(/ИНН/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/КПП/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/УНП/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/БИН/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ОГРН/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ОГРНИП/i)).not.toBeInTheDocument();
  });
});

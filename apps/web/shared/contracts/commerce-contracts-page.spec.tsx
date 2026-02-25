import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    api: {
        commerce: {
            contracts: jest.fn(),
        },
    },
}));

import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import CommerceContractsPage from '@/app/(app)/commerce/contracts/page';

describe('Commerce contracts page smart routing', () => {
    beforeEach(() => {
        (HTMLElement.prototype as any).scrollIntoView = jest.fn();
        jest.clearAllMocks();
    });

    it('filters by severity and focuses row by entity', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (key: string) => {
                if (key === 'entity') return 'C-002';
                if (key === 'severity') return 'warning';
                return null;
            },
        });

        (api.commerce.contracts as jest.Mock).mockImplementation(() =>
            Promise.resolve({
            data: [
                {
                    id: 'a1',
                    number: 'C-001',
                    type: 'SUPPLY',
                    status: 'SIGNED',
                    validFrom: '2026-01-01T00:00:00.000Z',
                    validTo: null,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    roles: [],
                },
                {
                    id: 'a2',
                    number: 'C-002',
                    type: 'SUPPLY',
                    status: 'DRAFT',
                    validFrom: '2026-01-01T00:00:00.000Z',
                    validTo: null,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    roles: [],
                },
            ],
        }));

        render(<CommerceContractsPage />);

        await waitFor(() => expect(screen.queryByText('Загрузка договоров...')).not.toBeInTheDocument());
        await waitFor(() => expect(screen.getByTestId('contract-row-a2')).toBeInTheDocument());
        expect(screen.queryByTestId('contract-row-a1')).not.toBeInTheDocument();
        expect(screen.getByTestId('contract-row-a2')).toHaveAttribute('data-focus', 'true');
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkSurface } from './WorkSurface';

jest.mock('../store/governance.store', () => ({
    useGovernanceStore: () => ({
        activeEscalation: null,
        isQuorumModalOpen: false,
        setQuorumModalOpen: jest.fn(),
    }),
}));

jest.mock('../hooks/useSessionIntegrity', () => ({
    useSessionIntegrity: () => ({
        traceId: 'TX-TEST-1',
        integrityStatus: 'MISMATCH',
        mismatch: { expectedHash: 'aaa', actualHash: 'bbb' },
    }),
}));

describe('WorkSurface integrity freeze', () => {
    it('renders freeze overlay and forensic replay link on mismatch', () => {
        render(
            <WorkSurface>
                <div>Protected Content</div>
            </WorkSurface>
        );

        expect(screen.getByTestId('integrity-freeze-overlay')).toBeInTheDocument();
        expect(screen.getByText(/Ledger mismatch detected/i)).toBeInTheDocument();
        const replayLink = screen.getByRole('link', { name: /Open Trace Replay/i });
        expect(replayLink).toHaveAttribute('href', '/forensics/replay?traceId=TX-TEST-1');
    });
});


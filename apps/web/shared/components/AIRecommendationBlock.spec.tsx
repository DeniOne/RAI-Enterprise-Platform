import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIRecommendationBlock, AIExplainabilityDto } from './AIRecommendationBlock';
import { AuthorityContextType } from '@/core/governance/AuthorityContext';

const noAuthority: AuthorityContextType = {
    canApprove: false,
    canEdit: true,
    canEscalate: true,
    canOverride: false,
    canSign: false,
};

const signAuthority: AuthorityContextType = {
    canApprove: true,
    canEdit: true,
    canEscalate: true,
    canOverride: false,
    canSign: true,
};

const explainability: AIExplainabilityDto = {
    confidence: 0.94,
    verdict: 'HIGHLY_PROBABLE',
    factors: [{ name: 'Cost efficiency', weight: 0.6, impact: 0.4 }],
    counterfactuals: [{
        scenarioName: 'Delay purchase',
        deltaInput: { days: 10 },
        expectedOutcome: 'Cost increase',
        probabilityShift: -0.12,
    }],
    forensic: {
        modelVersion: 'strat-gpt-4o-v2',
        inferenceTimestamp: '2026-02-22T10:00:00.000Z',
        inputCanonicalHash: 'a'.repeat(64),
        explainabilityCanonicalHash: 'b'.repeat(64),
        ledgerTraceId: 'TRC-9901-X',
        ledgerTxId: 'TX-1',
        environment: 'prod',
    },
    limitationsDisclosed: true,
};

describe('AIRecommendationBlock', () => {
    it('renders institutional error state when explainability is missing', () => {
        render(<AIRecommendationBlock explainability={undefined} traceId="TRC-1" traceStatus="PENDING" authority={noAuthority} />);
        expect(screen.getByText(/Explainability payload missing - violates institutional policy/i)).toBeInTheDocument();
        expect(screen.getByText(/TraceID: TRC-1/i)).toBeInTheDocument();
    });

    it('does not leak forensic hashes without authority', async () => {
        const user = userEvent.setup();
        render(<AIRecommendationBlock explainability={explainability} traceId="TRC-9901-X" traceStatus="AVAILABLE" authority={noAuthority} />);
        await user.click(screen.getByRole('button', { name: /Forensic \/ Verify in Ledger/i }));
        expect(screen.getByText(/Forensic layer requires institutional authority/i)).toBeInTheDocument();
        expect(screen.queryByText(/INPUT_CANONICAL_HASH/i)).not.toBeInTheDocument();
        expect(screen.queryByText(new RegExp('a'.repeat(10)))).not.toBeInTheDocument();
    });

    it('supports progressive disclosure by intent', async () => {
        const user = userEvent.setup();
        render(<AIRecommendationBlock explainability={explainability} traceId="TRC-9901-X" traceStatus="AVAILABLE" authority={signAuthority} />);

        expect(screen.getByText(/HIGHLY_PROBABLE/i)).toBeInTheDocument();
        expect(screen.queryByText(/Cost efficiency/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Why\?/i }));
        expect(screen.getByText(/Cost efficiency/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Forensic \/ Verify in Ledger/i }));
        expect(screen.getByText(/INPUT_CANONICAL_HASH/i)).toBeInTheDocument();
        expect(screen.getByText(/MODEL_VERSION/i)).toBeInTheDocument();
    });

    it('binds ledger verify link to trace id and disables when trace is pending', () => {
        const { rerender } = render(
            <AIRecommendationBlock
                explainability={explainability}
                traceId="TRC-9901-X"
                traceStatus="AVAILABLE"
                authority={signAuthority}
            />
        );

        const verifyLink = screen.getByRole('link', { name: /Verify in Ledger/i });
        expect(verifyLink).toHaveAttribute('href', '/consulting/ledger/TRC-9901-X');

        rerender(
            <AIRecommendationBlock
                explainability={explainability}
                traceId={undefined}
                traceStatus="PENDING"
                authority={signAuthority}
            />
        );

        const forensicButton = screen.getByRole('button', { name: /Forensic \/ Verify in Ledger/i });
        expect(forensicButton).toBeDisabled();
        expect(forensicButton).toHaveAttribute('title', 'Awaiting ledger receipt');
    });
});

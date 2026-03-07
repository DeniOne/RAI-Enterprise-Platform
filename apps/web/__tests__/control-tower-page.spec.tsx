import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ControlTowerPage from '../app/(app)/control-tower/page';

jest.mock('next/link', () => {
    return function Link({ href, children }: { href: string; children: React.ReactNode }) {
        return <a href={href}>{children}</a>;
    };
});

jest.mock('@/lib/api', () => ({
    api: {
        explainability: {
            dashboard: jest.fn().mockResolvedValue({
                data: {
                    companyId: 'c1',
                    avgBsScore: 10,
                    p95BsScore: 20,
                    avgEvidenceCoverage: 85,
                    acceptanceRate: 60,
                    correctionRate: 10,
                    worstTraces: [],
                    qualityKnownTraceCount: 1,
                    qualityPendingTraceCount: 0,
                    criticalPath: [],
                },
            }),
            performance: jest.fn().mockResolvedValue({
                data: {
                    successRatePct: 99,
                    avgLatencyMs: 100,
                    p95LatencyMs: 150,
                    byAgent: [],
                },
            }),
            costHotspots: jest.fn().mockResolvedValue({
                data: {
                    companyId: 'c1',
                    tenantCost: { totalCostUsd: 1, byModel: [] },
                    topByCost: [],
                    topByDuration: [],
                },
            }),
            queuePressure: jest.fn().mockResolvedValue({
                data: {
                    companyId: 'c1',
                    pressureState: 'PRESSURED',
                    signalFresh: true,
                    totalBacklog: 6,
                    hottestQueue: 'runtime_active_tool_calls',
                    observedQueues: [
                        {
                            queueName: 'runtime_active_tool_calls',
                            lastSize: 6,
                            avgSize: 4,
                            peakSize: 7,
                            samples: 3,
                            lastObservedAt: '2026-03-07T10:00:00.000Z',
                        },
                    ],
                },
            }),
        },
        autonomy: {
            status: jest.fn().mockResolvedValue({
                data: {
                    companyId: 'c1',
                    level: 'TOOL_FIRST',
                    avgBsScorePct: 10,
                    knownTraceCount: 1,
                    driver: 'BS_AVG_TOOL_FIRST',
                    activeQualityAlert: false,
                },
            }),
        },
    },
}));

describe('ControlTowerPage queue visibility', () => {
    it('показывает live queue/backpressure state в control tower', async () => {
        render(<ControlTowerPage />);

        await waitFor(() => {
            expect(screen.getByText('Runtime pressure')).toBeInTheDocument();
        });

        expect(screen.getByText('pressured')).toBeInTheDocument();
        expect(screen.getByText('Backlog depth')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('Queue signal')).toBeInTheDocument();
        expect(screen.getByText('live')).toBeInTheDocument();
        expect(screen.getByText('runtime_active_tool_calls')).toBeInTheDocument();
        expect(screen.getByText(/last 6 \/ peak 7/)).toBeInTheDocument();
    });
});

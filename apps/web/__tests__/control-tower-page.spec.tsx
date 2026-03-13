import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ControlTowerPage from '../app/(app)/control-tower/page';

const usersMeMock = jest.fn();
const dashboardMock = jest.fn();
const performanceMock = jest.fn();
const costHotspotsMock = jest.fn();
const queuePressureMock = jest.fn();
const runtimeGovernanceSummaryMock = jest.fn();
const runtimeGovernanceAgentsMock = jest.fn();
const runtimeGovernanceDrilldownsMock = jest.fn();
const lifecycleSummaryMock = jest.fn();
const lifecycleAgentsMock = jest.fn();
const lifecycleHistoryMock = jest.fn();
const autonomyStatusMock = jest.fn();
const memoryHealthMock = jest.fn();
const pendingActionsListMock = jest.fn();

jest.mock('next/link', () => {
  return function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/lib/feature-flags', () => ({
  webFeatureFlags: {
    controlTowerMemory: true,
  },
}));

jest.mock('@/lib/api', () => ({
  api: {
    users: {
      me: (...args: unknown[]) => usersMeMock(...args),
    },
    explainability: {
      dashboard: (...args: unknown[]) => dashboardMock(...args),
      performance: (...args: unknown[]) => performanceMock(...args),
      costHotspots: (...args: unknown[]) => costHotspotsMock(...args),
      queuePressure: (...args: unknown[]) => queuePressureMock(...args),
      runtimeGovernanceSummary: (...args: unknown[]) => runtimeGovernanceSummaryMock(...args),
      runtimeGovernanceAgents: (...args: unknown[]) => runtimeGovernanceAgentsMock(...args),
      runtimeGovernanceDrilldowns: (...args: unknown[]) => runtimeGovernanceDrilldownsMock(...args),
      lifecycleSummary: (...args: unknown[]) => lifecycleSummaryMock(...args),
      lifecycleAgents: (...args: unknown[]) => lifecycleAgentsMock(...args),
      lifecycleHistory: (...args: unknown[]) => lifecycleHistoryMock(...args),
    },
    autonomy: {
      status: (...args: unknown[]) => autonomyStatusMock(...args),
    },
    memory: {
      health: (...args: unknown[]) => memoryHealthMock(...args),
    },
    pendingActions: {
      list: (...args: unknown[]) => pendingActionsListMock(...args),
    },
  },
}));

describe('ControlTowerPage queue visibility', () => {
  beforeEach(() => {
    usersMeMock.mockReset();
    dashboardMock.mockReset();
    performanceMock.mockReset();
    costHotspotsMock.mockReset();
    queuePressureMock.mockReset();
    runtimeGovernanceSummaryMock.mockReset();
    runtimeGovernanceAgentsMock.mockReset();
    runtimeGovernanceDrilldownsMock.mockReset();
    lifecycleSummaryMock.mockReset();
    lifecycleAgentsMock.mockReset();
    lifecycleHistoryMock.mockReset();
    autonomyStatusMock.mockReset();
    memoryHealthMock.mockReset();
    pendingActionsListMock.mockReset();

    usersMeMock.mockResolvedValue({ data: { role: 'ADMIN' } });
    dashboardMock.mockResolvedValue({
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
    });
    performanceMock.mockResolvedValue({
      data: {
        successRatePct: 99,
        avgLatencyMs: 100,
        p95LatencyMs: 150,
        byAgent: [],
      },
    });
    costHotspotsMock.mockResolvedValue({
      data: {
        companyId: 'c1',
        tenantCost: { totalCostUsd: 1, byModel: [] },
        topByCost: [],
        topByDuration: [],
      },
    });
    queuePressureMock.mockResolvedValue({
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
    });
    runtimeGovernanceSummaryMock.mockResolvedValue({ data: null });
    runtimeGovernanceAgentsMock.mockResolvedValue({ data: [] });
    runtimeGovernanceDrilldownsMock.mockResolvedValue({ data: null });
    lifecycleSummaryMock.mockResolvedValue({ data: null });
    lifecycleAgentsMock.mockResolvedValue({ data: [] });
    lifecycleHistoryMock.mockResolvedValue({ data: [] });
    autonomyStatusMock.mockResolvedValue({
      data: {
        companyId: 'c1',
        level: 'TOOL_FIRST',
        avgBsScorePct: 10,
        knownTraceCount: 1,
        driver: 'BS_AVG_TOOL_FIRST',
        activeQualityAlert: false,
      },
    });
    memoryHealthMock.mockResolvedValue({
      data: {
        status: 'ok',
        degraded: false,
        layers: { L1_reactive: 'active' },
        recallLatencyMs: 12,
        episodeCount: 3,
        engramCount: 2,
        hotAlertCount: 1,
        consolidationFreshness: 5,
        pruningStatus: 'nominal',
        trustScore: 0.91,
        timestamp: '2026-03-13T00:00:00.000Z',
      },
    });
    pendingActionsListMock.mockResolvedValue({ data: [] });
  });

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
    expect(screen.getByText('Memory Fabric')).toBeInTheDocument();
    expect(memoryHealthMock).toHaveBeenCalled();
  });

  it('скрывает Memory Fabric для непривилегированной роли', async () => {
    usersMeMock.mockResolvedValueOnce({ data: { role: 'MANAGER' } });

    render(<ControlTowerPage />);

    await waitFor(() => {
      expect(screen.getByText('Runtime pressure')).toBeInTheDocument();
    });

    expect(screen.queryByText('Memory Fabric')).not.toBeInTheDocument();
    expect(memoryHealthMock).not.toHaveBeenCalled();
  });
});

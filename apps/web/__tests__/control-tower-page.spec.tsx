import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ControlTowerPage from '../app/(app)/control-tower/page';

const usersMeMock = jest.fn();
const dashboardMock = jest.fn();
const performanceMock = jest.fn();
const costHotspotsMock = jest.fn();
const queuePressureMock = jest.fn();
const routingDivergenceMock = jest.fn();
const captureRoutingCaseMemoryCandidateMock = jest.fn();
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
      routingDivergence: (...args: unknown[]) => routingDivergenceMock(...args),
      captureRoutingCaseMemoryCandidate: (...args: unknown[]) => captureRoutingCaseMemoryCandidateMock(...args),
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
    routingDivergenceMock.mockReset();
    captureRoutingCaseMemoryCandidateMock.mockReset();
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
        branchTrust: {
          knownTraceCount: 1,
          pendingTraceCount: 0,
          verifiedBranchCount: 2,
          partialBranchCount: 1,
          unverifiedBranchCount: 0,
          conflictedBranchCount: 0,
          rejectedBranchCount: 0,
          crossCheckTraceCount: 1,
          withinBudgetTraceCount: 1,
          overBudgetTraceCount: 0,
          withinBudgetRate: 100,
          avgLatencyMs: 240,
          p95LatencyMs: 240,
        },
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
    routingDivergenceMock.mockResolvedValue({
      data: {
        companyId: 'c1',
        windowHours: 24,
        totalEvents: 12,
        mismatchedEvents: 3,
        divergenceRatePct: 25,
        semanticPrimaryCount: 4,
        caseMemoryCandidates: [
          {
            key: 'agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset',
            sliceId: 'agro.techmaps.list-open-create',
            targetRole: 'agronomist',
            decisionType: 'navigate',
            mismatchKinds: ['legacy_write_vs_semantic_read'],
            routerVersion: 'semantic-router-v1',
            promptVersion: 'semantic-router-prompt-v1',
            toolsetVersion: 'toolset',
            traceCount: 3,
            semanticPrimaryCount: 2,
            caseMemoryReadiness: 'ready_for_case_memory',
            firstSeenAt: '2026-03-20T09:00:00.000Z',
            lastSeenAt: '2026-03-20T10:00:00.000Z',
            ttlExpiresAt: '2026-03-27T10:00:00.000Z',
            sampleTraceId: 'tr-1',
            sampleQuery: 'покажи все созданные техкарты',
            captureStatus: 'not_captured',
            capturedAt: null,
            captureAuditLogId: null,
            activatedAt: null,
            activationAuditLogId: null,
          },
        ],
        failureClusters: [
          {
            key: 'agronomist::navigate::legacy_write_vs_semantic_read',
            targetRole: 'agronomist',
            decisionType: 'navigate',
            mismatchKinds: ['legacy_write_vs_semantic_read'],
            count: 3,
            semanticPrimaryCount: 2,
            caseMemoryReadiness: 'ready_for_case_memory',
            lastSeenAt: '2026-03-20T10:00:00.000Z',
            sampleTraceId: 'tr-1',
            sampleQuery: 'покажи все созданные техкарты',
          },
        ],
        agentBreakdown: [
          {
            targetRole: 'agronomist',
            totalEvents: 12,
            mismatchedEvents: 3,
            divergenceRatePct: 25,
            semanticPrimaryCount: 4,
            decisionBreakdown: [{ decisionType: 'navigate', count: 6 }],
            topMismatchKinds: [{ kind: 'legacy_write_vs_semantic_read', count: 3 }],
            sampleTraceId: 'tr-1',
            sampleQuery: 'покажи все созданные техкарты',
          },
        ],
        topClusters: [
          {
            key: 'legacy_write_vs_semantic_read',
            label: 'legacy_write_vs_semantic_read',
            count: 3,
            mismatchKinds: ['legacy_write_vs_semantic_read'],
            sampleTraceId: 'tr-1',
            sampleQuery: 'покажи все созданные техкарты',
          },
        ],
        decisionBreakdown: [{ decisionType: 'navigate', count: 6 }],
        collisionMatrix: [],
        recentMismatches: [
          {
            traceId: 'tr-1',
            createdAt: '2026-03-20T10:00:00.000Z',
            summary: 'legacy_write_vs_semantic_read',
            sampleQuery: 'покажи все созданные техкарты',
            targetRole: 'agronomist',
            decisionType: 'navigate',
            promotedPrimary: true,
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
    captureRoutingCaseMemoryCandidateMock.mockResolvedValue({
      data: {
        status: 'captured',
        candidateKey: 'agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset',
        auditLogId: 'audit-1',
        capturedAt: '2026-03-20T12:00:00.000Z',
      },
    });
  });

  it('показывает live queue/backpressure state в control tower', async () => {
    render(<ControlTowerPage />);

    await waitFor(() => {
      expect(screen.getByText('Давление очередей')).toBeInTheDocument();
    });

    expect(screen.getByText('под нагрузкой')).toBeInTheDocument();
    expect(screen.getByText('Глубина очереди')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Сигнал очередей')).toBeInTheDocument();
    expect(screen.getByText('свежий')).toBeInTheDocument();
    expect(screen.getByText('runtime_active_tool_calls')).toBeInTheDocument();
    expect(screen.getByText(/посл\. 6 \/ пик 7/)).toBeInTheDocument();
    expect(screen.getByText('Текущие расхождения наследованной и семантической маршрутизации')).toBeInTheDocument();
    expect(screen.getByText('Где шумит сильнее всего')).toBeInTheDocument();
    expect(screen.getByText('Повторяющиеся кластеры сбоев')).toBeInTheDocument();
    expect(screen.getByText('Кандидаты в память кейсов')).toBeInTheDocument();
    expect(screen.getAllByText('готово к памяти кейсов').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'зафиксировать' })).toBeInTheDocument();
    expect(screen.getByText(/версия router semantic-router-v1/)).toBeInTheDocument();
    expect(screen.getAllByText('agronomist').length).toBeGreaterThan(0);
    expect(screen.getAllByText('legacy_write_vs_semantic_read').length).toBeGreaterThan(0);
    expect(screen.getByText('Контур памяти')).toBeInTheDocument();
    expect(screen.getByText('Контур доверия веток')).toBeInTheDocument();
    expect(screen.getByText('Соблюдение бюджета')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getByText('P95 шлюза доверия')).toBeInTheDocument();
    expect(screen.getAllByText(/240/).length).toBeGreaterThan(0);
    expect(memoryHealthMock).toHaveBeenCalled();
  });

  it('фиксирует готовый candidate в память кейсов', async () => {
    render(<ControlTowerPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'зафиксировать' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'зафиксировать' }));

    await waitFor(() => {
      expect(captureRoutingCaseMemoryCandidateMock).toHaveBeenCalledWith({
        key: 'agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset',
        windowHours: 24,
        slice: 'agro.techmaps.list-open-create',
        targetRole: 'agronomist',
      });
    });
  });

  it('скрывает Memory Fabric для непривилегированной роли', async () => {
    usersMeMock.mockResolvedValueOnce({ data: { role: 'MANAGER' } });

    render(<ControlTowerPage />);

    await waitFor(() => {
      expect(screen.getByText('Давление очередей')).toBeInTheDocument();
    });

    expect(screen.queryByText('Контур памяти')).not.toBeInTheDocument();
    expect(memoryHealthMock).not.toHaveBeenCalled();
  });
});

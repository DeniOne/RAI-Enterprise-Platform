import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TraceForensicsPage from '../app/(app)/control-tower/trace/[traceId]/page';

const traceForensicsMock = jest.fn();
const traceTopologyMock = jest.fn();
const replayTraceMock = jest.fn();

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ traceId: 'trace-1' }),
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/link', () => {
  return function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/dynamic', () => {
  return () =>
    function ForceGraphStub() {
      return <div data-testid="force-graph-stub" />;
    };
});

jest.mock('@/lib/api', () => ({
  api: {
    explainability: {
      traceForensics: (...args: unknown[]) => traceForensicsMock(...args),
      traceTopology: (...args: unknown[]) => traceTopologyMock(...args),
      replayTrace: (...args: unknown[]) => replayTraceMock(...args),
    },
  },
}));

describe('TraceForensicsPage memory lane rendering', () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    traceForensicsMock.mockReset();
    traceTopologyMock.mockReset();
    replayTraceMock.mockReset();
    pushMock.mockReset();

    traceTopologyMock.mockResolvedValue({
      data: {
        traceId: 'trace-1',
        nodes: [],
        criticalPathNodeIds: [],
        totalDurationMs: 0,
      },
    });
  });

  it('показывает memory lane и контур доверия веток, когда API вернул эти данные', async () => {
    traceForensicsMock.mockResolvedValue({
      data: {
        summary: {
          traceId: 'trace-1',
          companyId: 'c1',
          totalTokens: 20,
          promptTokens: 10,
          completionTokens: 10,
          durationMs: 1200,
          modelId: 'gpt-4.1',
          promptVersion: 'v1',
          toolsVersion: 'v1',
          policyId: 'default',
          bsScorePct: 8,
          evidenceCoveragePct: 92,
          invalidClaimsPct: 0,
          verifiedBranchCount: 1,
          partialBranchCount: 0,
          unverifiedBranchCount: 0,
          conflictedBranchCount: 0,
          rejectedBranchCount: 0,
          trustGateLatencyMs: 140,
          trustLatencyProfile: 'HAPPY_PATH',
          trustLatencyBudgetMs: 300,
          trustLatencyWithinBudget: true,
          createdAt: '2026-03-21T10:00:00.000Z',
        },
        timeline: [{ id: 'node-1', traceId: 'trace-1', companyId: 'c1', toolNames: [], model: 'gpt-4.1', intentMethod: 'semantic', phase: 'tools', durationMs: 100, tokensUsed: 0, createdAt: '2026-03-21T10:00:00.000Z', evidenceRefs: [] }],
        qualityAlerts: [{ id: 'qa-1', alertType: 'BS_DRIFT', severity: 'HIGH', message: 'drift', createdAt: '2026-03-21T10:00:00.000Z' }],
        memoryLane: {
          recalled: [{ kind: 'engram', label: 'Past crop pattern', confidence: 0.8 }],
          used: [{ kind: 'active_alert', label: 'Disease risk', confidence: 0.92 }],
          dropped: [{ kind: 'profile', label: 'User preference', reason: 'not_relevant' }],
          escalationReason: 'runtime_governance_degraded',
        },
        semanticIngressFrame: {
          version: 'v1',
          interactionMode: 'task_request',
          requestShape: 'single_intent',
          domainCandidates: [
            {
              domain: 'crm',
              ownerRole: 'crm_agent',
              score: 0.82,
              source: 'legacy',
              reason: 'responsibility:crm:register_counterparty',
            },
          ],
          goal: 'register_counterparty',
          entities: [
            {
              kind: 'inn',
              value: '2636041493',
              source: 'message',
            },
          ],
          requestedOperation: {
            ownerRole: 'crm_agent',
            intent: 'register_counterparty',
            toolName: 'register_counterparty',
            decisionType: 'execute',
            source: 'fallback_normalization',
          },
          operationAuthority: 'direct_user_command',
          missingSlots: [],
          riskClass: 'write_candidate',
          requiresConfirmation: false,
          confidenceBand: 'high',
          explanation: 'Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН как прямое действие пользователя.',
          proofSliceId: 'crm.register_counterparty',
        },
        branchTrust: {
          branchResults: [
            {
              branch_id: 'agronomist:primary',
              source_agent: 'agronomist',
              domain: 'agro',
              summary: 'Факт подтверждён по детерминированному расчёту.',
              scope: {},
              derived_from: [],
              evidence_refs: [{ claim: 'claim', sourceType: 'TOOL_RESULT', sourceId: 'tool-1', confidenceScore: 0.9 }],
              assumptions: [],
              data_gaps: [],
              freshness: { status: 'FRESH' },
              confidence: 0.93,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: 'agronomist:primary',
              source_agent: 'agronomist',
              verdict: 'VERIFIED',
              score: 0.94,
              reasons: ['evidence confirmed'],
              checks: [],
              requires_cross_check: false,
            },
          ],
          branchCompositions: [
            {
              branch_id: 'agronomist:primary',
              verdict: 'VERIFIED',
              include_in_response: true,
              summary: 'Факт подтверждён по детерминированному расчёту.',
              disclosure: [],
            },
          ],
        },
      },
    });

    render(<TraceForensicsPage />);

    await waitFor(() => {
      expect(screen.getByText('Хронология вызовов агентов')).toBeInTheDocument();
    });

    expect(screen.getByText('Вспомнено')).toBeInTheDocument();
    expect(screen.getByText('Использовано')).toBeInTheDocument();
    expect(screen.getByText('Отброшено')).toBeInTheDocument();
    expect(screen.getByText(/Причина эскалации:/i)).toBeInTheDocument();
    expect(screen.getByText(/runtime_governance_degraded/i)).toBeInTheDocument();
    expect(screen.getByText('Входной семантический кадр')).toBeInTheDocument();
    expect(screen.getByText(/crm\.register_counterparty/i)).toBeInTheDocument();
    expect(screen.getByText(/crm_agent • register_counterparty/i)).toBeInTheDocument();
    expect(screen.getByText(/Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН как прямое действие пользователя/i)).toBeInTheDocument();
    expect(screen.getByText('прямая пользовательская команда')).toBeInTheDocument();
    expect(screen.getByText('Контур доверия веток')).toBeInTheDocument();
    expect(screen.getByText('Подтверждено')).toBeInTheDocument();
    expect(screen.getByText('Вердикт бюджета')).toBeInTheDocument();
    expect(screen.getAllByText(/agronomist/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Факт подтверждён по детерминированному расчёту/i)).toBeInTheDocument();
    expect(screen.getByText('свежее')).toBeInTheDocument();
  });

  it('не показывает memory lane и карточки веток, когда API их не вернул', async () => {
    traceForensicsMock.mockResolvedValue({
      data: {
        summary: {
          traceId: 'trace-1',
          companyId: 'c1',
          totalTokens: 10,
          promptTokens: 5,
          completionTokens: 5,
          durationMs: 800,
          modelId: 'gpt-4.1',
          promptVersion: 'v1',
          toolsVersion: 'v1',
          policyId: 'default',
          bsScorePct: 12,
          evidenceCoveragePct: 88,
          invalidClaimsPct: 0,
          verifiedBranchCount: 1,
          partialBranchCount: 0,
          unverifiedBranchCount: 0,
          conflictedBranchCount: 0,
          rejectedBranchCount: 0,
          trustGateLatencyMs: 180,
          trustLatencyProfile: 'HAPPY_PATH',
          trustLatencyBudgetMs: 300,
          trustLatencyWithinBudget: true,
          createdAt: '2026-03-21T10:00:00.000Z',
        },
        timeline: [{ id: 'node-2', traceId: 'trace-1', companyId: 'c1', toolNames: [], model: 'gpt-4.1', intentMethod: 'semantic', phase: 'router', durationMs: 30, tokensUsed: 0, createdAt: '2026-03-21T10:00:00.000Z', evidenceRefs: [] }],
        qualityAlerts: [],
        memoryLane: null,
        branchTrust: null,
      },
    });

    render(<TraceForensicsPage />);

    await waitFor(() => {
      expect(screen.getByText('Хронология вызовов агентов')).toBeInTheDocument();
    });

    expect(screen.queryByText('Вспомнено')).not.toBeInTheDocument();
    expect(screen.queryByText('Использовано')).not.toBeInTheDocument();
    expect(screen.queryByText('Отброшено')).not.toBeInTheDocument();
    expect(screen.getByText('Артефакты доверия веток для этой трассы не сохранены.')).toBeInTheDocument();
  });
});

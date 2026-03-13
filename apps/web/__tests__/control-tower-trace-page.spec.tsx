import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TraceForensicsPage from '../app/(app)/control-tower/trace/[traceId]/page';

const traceTimelineMock = jest.fn();
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
      traceTimeline: (...args: unknown[]) => traceTimelineMock(...args),
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
    traceTimelineMock.mockReset();
    traceForensicsMock.mockReset();
    traceTopologyMock.mockReset();
    replayTraceMock.mockReset();
    pushMock.mockReset();

    traceTimelineMock.mockResolvedValue({ data: { traceId: 'trace-1' } });
    traceTopologyMock.mockResolvedValue({
      data: {
        traceId: 'trace-1',
        nodes: [],
        criticalPathNodeIds: [],
        totalDurationMs: 0,
      },
    });
  });

  it('renders memory lane section when API returns it', async () => {
    traceForensicsMock.mockResolvedValue({
      data: {
        summary: { traceId: 'trace-1', totalDurationMs: 1200 },
        timeline: [{ phase: 'tools', durationMs: 100, evidenceRefs: [] }],
        qualityAlerts: [],
        memoryLane: {
          recalled: [{ kind: 'engram', label: 'Past crop pattern', confidence: 0.8 }],
          used: [{ kind: 'active_alert', label: 'Disease risk', confidence: 0.92 }],
          dropped: [{ kind: 'profile', label: 'User preference', reason: 'not_relevant' }],
          escalationReason: 'runtime_governance_degraded',
        },
      },
    });

    render(<TraceForensicsPage />);

    await waitFor(() => {
      expect(screen.getByText('Timeline & Evidence')).toBeInTheDocument();
    });

    expect(screen.getByText('Recalled')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Dropped')).toBeInTheDocument();
    expect(screen.getByText(/Escalation reason:/i)).toBeInTheDocument();
    expect(screen.getByText(/runtime_governance_degraded/i)).toBeInTheDocument();
  });

  it('does not render memory lane section when API omits it', async () => {
    traceForensicsMock.mockResolvedValue({
      data: {
        summary: { traceId: 'trace-1', totalDurationMs: 800 },
        timeline: [{ phase: 'router', durationMs: 30, evidenceRefs: [] }],
        qualityAlerts: [],
        memoryLane: null,
      },
    });

    render(<TraceForensicsPage />);

    await waitFor(() => {
      expect(screen.getByText('Timeline & Evidence')).toBeInTheDocument();
    });

    expect(screen.queryByText('Recalled')).not.toBeInTheDocument();
    expect(screen.queryByText('Used')).not.toBeInTheDocument();
    expect(screen.queryByText('Dropped')).not.toBeInTheDocument();
  });
});

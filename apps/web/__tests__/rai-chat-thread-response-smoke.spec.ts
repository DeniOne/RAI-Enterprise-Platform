/**
 * Smoke: цепочка web-чата thread → пользовательское сообщение → ответ API
 * с несколькими workWindows (ветвление UI) и закреплённым threadId.
 * Запуск в CI: pnpm --filter web test -- __tests__/rai-chat-thread-response-smoke.spec.ts
 */
import { act } from '@testing-library/react';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';
import { useGovernanceStore } from '@/shared/store/governance.store';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function resetChatStores() {
    useAiChatStore.persist?.clearStorage?.();
    fetchMock.mockReset();
    useAiChatStore.setState({
        fsmState: 'open',
        panelMode: 'dock',
        widgetsOpen: true,
        chatWidth: 420,
        activeSessionId: 'chat-default',
        sessions: [
            {
                sessionId: 'chat-default',
                title: 'Новый чат',
                updatedAt: '2026-04-04T00:00:00.000Z',
                threadId: null,
                messages: [],
                signals: [],
                workWindows: [],
                activeWindowId: null,
                collapsedWindowIds: [],
                pendingClarification: null,
                plannerMutationResume: null,
            },
        ],
        threadId: null,
        messages: [],
        readSignalIds: [],
        selectedSignalTarget: null,
        signals: [],
        deriveSignalsFromWindows: true,
        legacyWidgetMigrationEnabled: true,
        workWindows: [],
        activeWindowId: null,
        collapsedWindowIds: [],
        pendingClarification: null,
        plannerMutationResume: null,
        resumeInFlight: false,
        isLoading: false,
        abortController: null,
    });
    useWorkspaceContextStore.setState({
        context: { route: '/consulting/dashboard' },
    });
    useGovernanceStore.setState({
        activeEscalation: null,
        isQuorumModalOpen: false,
    });
}

describe('RAI chat web smoke (thread → message → response)', () => {
    beforeEach(() => {
        resetChatStores();
    });

    it('прокидывает threadId и два workWindow после ответа (ветвление UI)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'Сводка: две параллельные панели результата.',
                widgets: [],
                memoryUsed: [],
                threadId: 'thread-smoke-rai',
                executionExplainability: {
                    version: 'v1',
                    branches: [
                        {
                            branchId: 'branch-a',
                            lifecycle: 'COMPLETED',
                            mutationState: 'NOT_REQUIRED',
                            policyDecision: 'execute',
                        },
                        {
                            branchId: 'branch-b',
                            lifecycle: 'RUNNING',
                            mutationState: 'NOT_REQUIRED',
                            policyDecision: 'execute',
                        },
                    ],
                },
                workWindows: [
                    {
                        windowId: 'win-smoke-a',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        category: 'result',
                        priority: 80,
                        mode: 'panel',
                        title: 'Ветка A',
                        status: 'completed',
                        payload: { summary: 'done-a', missingKeys: [] },
                        actions: [],
                        isPinned: false,
                    },
                    {
                        windowId: 'win-smoke-b',
                        originMessageId: null,
                        agentRole: 'economist',
                        type: 'context_acquisition',
                        category: 'result',
                        priority: 75,
                        mode: 'inline',
                        title: 'Ветка B',
                        status: 'completed',
                        payload: { summary: 'done-b', missingKeys: [] },
                        actions: [],
                        isPinned: false,
                    },
                ],
            }),
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('смоук два окна');
        });

        const state = useAiChatStore.getState();
        expect(state.threadId).toBe('thread-smoke-rai');
        expect(state.messages.filter((m) => m.role === 'user')).toHaveLength(1);
        expect(state.messages.filter((m) => m.role === 'assistant')).toHaveLength(1);
        expect(state.messages.some((m) => m.role === 'assistant' && m.content.includes('Сводка'))).toBe(
            true,
        );
        expect(state.workWindows).toHaveLength(2);
        expect(state.workWindows.map((w) => w.windowId).sort()).toEqual(['win-smoke-a', 'win-smoke-b']);

        const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
        const body = requestInit?.body ? JSON.parse(requestInit.body as string) : null;
        expect(body?.message).toBe('смоук два окна');
        expect(body?.threadId).toBeNull();
        expect(body?.workspaceContext?.route).toBe('/consulting/dashboard');
    });
});

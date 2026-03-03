import { act } from '@testing-library/react';
import { RaiChatWidgetType } from '@/lib/ai-chat-widgets';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

const fetchMock = jest.fn();

global.fetch = fetchMock as unknown as typeof fetch;

describe('AiChatStore UX modes', () => {
    beforeEach(() => {
        useAiChatStore.persist?.clearStorage?.();
        fetchMock.mockReset();
        useAiChatStore.setState({
            fsmState: 'closed',
            panelMode: 'dock',
            widgetsOpen: true,
            chatWidth: 420,
            threadId: null,
            messages: [],
            readSignalIds: [],
            selectedSignalTarget: null,
            isLoading: false,
            abortController: null,
        });
        useWorkspaceContextStore.setState({
            context: { route: '/' },
        });
    });

    it('toggles panel mode between dock and focus', () => {
        act(() => {
            useAiChatStore.getState().togglePanelMode();
        });
        expect(useAiChatStore.getState().panelMode).toBe('focus');

        act(() => {
            useAiChatStore.getState().togglePanelMode();
        });
        expect(useAiChatStore.getState().panelMode).toBe('dock');
    });

    it('toggles widgets visibility', () => {
        act(() => {
            useAiChatStore.getState().toggleWidgets();
        });
        expect(useAiChatStore.getState().widgetsOpen).toBe(false);
    });

    it('opens widgets explicitly without toggle side effects', () => {
        act(() => {
            useAiChatStore.getState().setWidgetsOpen(false);
            useAiChatStore.getState().setWidgetsOpen(true);
        });

        expect(useAiChatStore.getState().widgetsOpen).toBe(true);
    });

    it('stores selected signal target for highlight flow', () => {
        act(() => {
            useAiChatStore.getState().setSelectedSignalTarget({
                widgetType: RaiChatWidgetType.DeviationList,
                itemId: 'dev-1',
            });
        });

        expect(useAiChatStore.getState().selectedSignalTarget).toEqual({
            widgetType: RaiChatWidgetType.DeviationList,
            itemId: 'dev-1',
        });
    });

    it('marks signals as read idempotently', () => {
        act(() => {
            useAiChatStore.getState().markSignalRead('signal-1');
            useAiChatStore.getState().markSignalRead('signal-1');
        });

        expect(useAiChatStore.getState().readSignalIds).toEqual(['signal-1']);
    });

    it('preserves panel mode and widgets on route change', () => {
        useAiChatStore.setState({
            fsmState: 'open',
            panelMode: 'focus',
            widgetsOpen: false,
        });

        act(() => {
            useAiChatStore.getState().dispatch('ROUTE_CHANGE');
        });

        expect(useAiChatStore.getState().fsmState).toBe('open');
        expect(useAiChatStore.getState().panelMode).toBe('focus');
        expect(useAiChatStore.getState().widgetsOpen).toBe(false);
    });

    it('sends the current WorkspaceContext with each chat request', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'ok',
                widgets: [],
                memoryUsed: [
                    { kind: 'episode', label: 'deviation PANy 2d ago', confidence: 0.82, source: 'episode' },
                    { kind: 'profile', label: 'prefers dashboard summary', confidence: 0.8, source: 'profile' },
                ],
                threadId: 'thread-1',
            }),
        });

        useAiChatStore.setState({
            fsmState: 'open',
            threadId: 'thread-0',
        });
        useWorkspaceContextStore.setState({
            context: {
                route: '/consulting/yield',
                activeEntityRefs: [{ kind: 'farm', id: 'farm-1' }],
                lastUserAction: 'select-plan:plan-1',
            },
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Покажи контекст');
        });

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/rai/chat',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: 'thread-0',
                    message: 'Покажи контекст',
                    workspaceContext: {
                        route: '/consulting/yield',
                        activeEntityRefs: [{ kind: 'farm', id: 'farm-1' }],
                        lastUserAction: 'select-plan:plan-1',
                    },
                }),
                signal: expect.any(AbortSignal),
            }),
        );
        expect(useAiChatStore.getState().messages.at(-1)?.memoryUsed).toEqual([
            { kind: 'episode', label: 'deviation PANy 2d ago', confidence: 0.82, source: 'episode' },
            { kind: 'profile', label: 'prefers dashboard summary', confidence: 0.8, source: 'profile' },
        ]);
    });
});

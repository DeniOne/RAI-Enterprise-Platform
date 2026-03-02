import { act } from '@testing-library/react';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';

describe('AiChatStore UX modes', () => {
    beforeEach(() => {
        useAiChatStore.persist?.clearStorage?.();
        useAiChatStore.setState({
            fsmState: 'closed',
            panelMode: 'dock',
            widgetsOpen: true,
            threadId: null,
            messages: [],
            isLoading: false,
            abortController: null,
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

    it('resets dock mode and widgets on route change', () => {
        useAiChatStore.setState({
            fsmState: 'open',
            panelMode: 'focus',
            widgetsOpen: false,
        });

        act(() => {
            useAiChatStore.getState().dispatch('ROUTE_CHANGE');
        });

        expect(useAiChatStore.getState().fsmState).toBe('closed');
        expect(useAiChatStore.getState().panelMode).toBe('dock');
        expect(useAiChatStore.getState().widgetsOpen).toBe(true);
    });
});

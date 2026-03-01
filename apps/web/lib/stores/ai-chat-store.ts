import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useWorkspaceContextStore } from './workspace-context-store';

export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    riskLevel?: RiskLevel;
    suggestedActions?: Record<string, any>[];
}

export type FsmState = 'closed' | 'animating_open' | 'open' | 'animating_close';

interface AiChatStore {
    fsmState: FsmState;
    threadId: string | null;
    messages: ChatMessage[];
    isLoading: boolean;
    abortController: AbortController | null;

    dispatch: (event: 'OPEN' | 'ANIMATION_OPEN_DONE' | 'CLOSE' | 'ANIMATION_CLOSE_DONE' | 'ROUTE_CHANGE') => void;
    sendMessage: (text: string) => Promise<void>;
    abortRequest: () => void;
    clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAiChatStore = create<AiChatStore>()(
    persist(
        (set, get) => ({
            fsmState: 'closed',
            threadId: null,
            messages: [],

            isLoading: false,
            abortController: null,

            dispatch: (event) => {
                const current = get().fsmState;

                if (event === 'OPEN' && current === 'closed') {
                    set({ fsmState: 'animating_open' });
                } else if (event === 'ANIMATION_OPEN_DONE' && current === 'animating_open') {
                    set({ fsmState: 'open' });
                } else if (event === 'CLOSE' && (current === 'open' || current === 'animating_open')) {
                    get().abortRequest();
                    set({ fsmState: 'animating_close' });
                } else if (event === 'ANIMATION_CLOSE_DONE' && current === 'animating_close') {
                    set({ fsmState: 'closed' });
                } else if (event === 'ROUTE_CHANGE' && current !== 'closed') {
                    get().abortRequest();
                    set({ fsmState: 'closed' });
                }
            },

            abortRequest: () => {
                const { abortController } = get();
                if (abortController) {
                    abortController.abort();
                    set({ abortController: null, isLoading: false });
                }
            },

            clearHistory: () => set({ messages: [], threadId: null }),

            sendMessage: async (text: string) => {
                const { threadId, fsmState } = get();
                if (fsmState !== 'open') return;

                const userMsg: ChatMessage = {
                    id: generateId(),
                    role: 'user',
                    content: text,
                    timestamp: new Date().toISOString(),
                };

                const ac = new AbortController();
                set((state) => ({
                    messages: [...state.messages, userMsg],
                    isLoading: true,
                    abortController: ac,
                }));

                try {
                    const workspaceContext = useWorkspaceContextStore.getState().context;
                    const response = await fetch('/api/rai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            threadId,
                            message: text,
                            workspaceContext
                        }),
                        signal: ac.signal,
                    });

                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();

                    const aiMsg: ChatMessage = {
                        id: generateId(),
                        role: 'assistant',
                        content: data.text || 'Ответ не получен',
                        timestamp: new Date().toISOString(),
                        riskLevel: data.riskLevel || 'R1', // Default R1 if backend doesn't provide it yet
                        suggestedActions: data.widgets, // Map widgets to suggestedActions for now
                    };

                    set((state) => ({
                        messages: [...state.messages, aiMsg],
                        isLoading: false,
                        abortController: null,
                        threadId: data.threadId || state.threadId,
                    }));

                } catch (error: any) {
                    if (error.name !== 'AbortError') {
                        set((state) => ({
                            isLoading: false,
                            abortController: null,
                            messages: [...state.messages, {
                                id: generateId(),
                                role: 'assistant',
                                content: '⚠️ Произошла ошибка при обращении к агенту.',
                                timestamp: new Date().toISOString(),
                                riskLevel: 'R3',
                            }],
                        }));
                    }
                }
            },
        }),
        {
            name: 'rai-ai-chat-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                messages: state.messages.slice(-50),
                threadId: state.threadId
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.fsmState = 'closed';
                    state.isLoading = false;
                    state.abortController = null;
                }
            }
        }
    )
);

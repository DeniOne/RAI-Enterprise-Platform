import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Типы
export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    riskLevel?: RiskLevel;
    suggestedActions?: Record<string, any>[];
}

export interface ChatContext {
    route: string;
    moduleKey?: string;
    entityId?: string;
}

export type FsmState = 'closed' | 'animating_open' | 'open' | 'animating_close';

interface AiChatStore {
    fsmState: FsmState;
    threadId: string | null;
    messages: ChatMessage[];
    context: ChatContext | null;
    isLoading: boolean;
    abortController: AbortController | null;

    dispatch: (event: 'OPEN' | 'ANIMATION_OPEN_DONE' | 'CLOSE' | 'ANIMATION_CLOSE_DONE' | 'ROUTE_CHANGE') => void;
    updateContext: (context: Partial<ChatContext>) => void;
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
            context: null,
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

            updateContext: (newContext) => {
                set((state) => ({
                    context: { ...state.context, ...newContext } as ChatContext
                }));
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
                const { context, threadId, fsmState } = get();
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
                    const response = await fetch('/api/ai-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ threadId, message: text, context }),
                        signal: ac.signal,
                    });

                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();

                    const aiMsg: ChatMessage = {
                        id: generateId(),
                        role: 'assistant',
                        content: data.assistantMessage || 'Ответ не получен',
                        timestamp: new Date().toISOString(),
                        riskLevel: data.riskLevel,
                        suggestedActions: data.suggestedActions,
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

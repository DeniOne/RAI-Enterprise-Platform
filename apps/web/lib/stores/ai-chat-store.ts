import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useWorkspaceContextStore } from './workspace-context-store';
import { useGovernanceStore } from '@/shared/store/governance.store';
import { RaiChatWidget, RaiChatWidgetType } from '../ai-chat-widgets';
import { submitRaiChatRequest } from '../api';
import type {
    RaiChatClarificationResumeDto,
} from '../api';
import {
    AiSignalItem,
    AiWorkWindow,
    PendingClarificationState,
} from '@/components/ai-chat/ai-work-window-types';
import {
    adaptRaiChatResponseForStore,
    hydratePendingClarificationState,
} from '../rai-chat-response-adapter';
import {
    computeChatSignals,
    pickPreferredWorkWindow,
    resolveRaiChatResponseState,
} from '../rai-chat-response-state';
import type { ChatTrustSummary } from '../rai-chat-response-adapter';

function getChatRuntimeErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
        return 'Произошла ошибка при обращении к агенту.';
    }

    const normalized = error.message.toLowerCase();

    if (normalized.includes('server action')) {
        return 'Клиентский чанк устарел после перезапуска. Обновите страницу Ctrl+Shift+R и повторите команду.';
    }

    if (
        normalized.includes('failed to fetch') ||
        normalized.includes('networkerror') ||
        normalized.includes('load failed')
    ) {
        return 'Сбой сети между UI и API. Обновите страницу Ctrl+Shift+R и повторите команду.';
    }

    return error.message || 'Произошла ошибка при обращении к агенту.';
}

function isOpenTechCouncilCommand(text: string): boolean {
    const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!normalized) return false;

    if (normalized === 'техсовет' || normalized === 'techcouncil' || normalized === 'tech council') {
        return true;
    }

    return /(открой|открыть|покажи|показать|open|show)\s+(техсовет|techcouncil|tech council)/i.test(normalized);
}

export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
export type PanelMode = 'dock' | 'focus';
export type { ChatTrustSummary } from '../rai-chat-response-adapter';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    riskLevel?: RiskLevel;
    widgets?: RaiChatWidget[];
    memoryUsed?: Array<{
        kind: 'episode' | 'profile' | 'engram' | 'active_alert' | 'hot_engram';
        label: string;
        confidence: number;
        source?: string;
    }>;
    memorySummary?: {
        primaryHint: string;
        primaryKind: 'episode' | 'profile' | 'engram' | 'active_alert' | 'hot_engram';
        detailsAvailable: boolean;
    };
    suggestedActions?: Array<{
        kind: 'tool' | 'route' | 'expert_review';
        title: string;
        toolName?: string;
        payload?: Record<string, unknown>;
        href?: string;
        expertRole?: string;
    }>;
    workWindows?: AiWorkWindow[];
    trustSummary?: ChatTrustSummary;
}

export type FsmState = 'closed' | 'animating_open' | 'open' | 'animating_close';

export interface RaiSignalTarget {
    widgetType: RaiChatWidgetType | string;
    itemId?: string;
}

export interface ChatSessionState {
    sessionId: string;
    title: string;
    updatedAt: string;
    threadId: string | null;
    messages: ChatMessage[];
    signals: AiSignalItem[];
    workWindows: AiWorkWindow[];
    activeWindowId: string | null;
    collapsedWindowIds: string[];
    pendingClarification: PendingClarificationState | null;
}

interface AiChatStore {
    fsmState: FsmState;
    panelMode: PanelMode;
    widgetsOpen: boolean;
    chatWidth: number;
    activeSessionId: string | null;
    sessions: ChatSessionState[];
    threadId: string | null;
    messages: ChatMessage[];
    readSignalIds: string[];
    selectedSignalTarget: RaiSignalTarget | null;
    signals: AiSignalItem[];
    deriveSignalsFromWindows: boolean;
    legacyWidgetMigrationEnabled: boolean;
    workWindows: AiWorkWindow[];
    activeWindowId: string | null;
    collapsedWindowIds: string[];
    pendingClarification: PendingClarificationState | null;
    resumeInFlight: boolean;
    isLoading: boolean;
    abortController: AbortController | null;

    dispatch: (event: 'OPEN' | 'ANIMATION_OPEN_DONE' | 'CLOSE' | 'ANIMATION_CLOSE_DONE' | 'ROUTE_CHANGE') => void;
    setPanelMode: (mode: PanelMode) => void;
    setChatWidth: (width: number) => void;
    setWidgetsOpen: (open: boolean) => void;
    setSelectedSignalTarget: (target: RaiSignalTarget | null) => void;
    setActiveWindowId: (windowId: string | null) => void;
    setWorkWindowMode: (windowId: string, mode: AiWorkWindow['mode']) => void;
    togglePinWorkWindow: (windowId: string) => void;
    collapseWorkWindow: (windowId: string) => void;
    restoreWorkWindow: (windowId: string) => void;
    closeWorkWindow: (windowId: string) => void;
    markSignalRead: (signalId: string) => void;
    togglePanelMode: () => void;
    toggleWidgets: () => void;
    startNewChat: () => void;
    openChatSession: (sessionId: string) => void;
    sendMessage: (text: string) => Promise<void>;
    useWorkspaceFieldForClarification: () => Promise<void>;
    refreshClarificationContext: () => Promise<void>;
    submitRequest: (params: {
        message: string;
        threadId: string | null;
        appendAssistantMessage: boolean;
        originMessageId?: string | null;
        signal?: AbortSignal;
        clarificationResume?: {
            windowId: string;
            intentId: 'tech_map_draft' | 'compute_plan_fact';
            agentRole: 'agronomist' | 'economist';
            collectedContext: {
                fieldRef?: string;
                seasonRef?: string;
                seasonId?: string;
                planId?: string;
            };
        };
    }) => Promise<any>;
    applyClarificationContext: (nextContext: {
        fieldRef?: string;
        seasonRef?: string;
        seasonId?: string;
        planId?: string;
    }) => Promise<void>;
    abortRequest: () => void;
    clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

function createEmptySession(sessionId = `chat-${generateId()}`): ChatSessionState {
    const now = new Date().toISOString();
    return {
        sessionId,
        title: 'Новый чат',
        updatedAt: now,
        threadId: null,
        messages: [],
        signals: [],
        workWindows: [],
        activeWindowId: null,
        collapsedWindowIds: [],
        pendingClarification: null,
    };
}

function deriveSessionTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find((message) => message.role === 'user')?.content?.trim();
    if (!firstUserMessage) {
        return 'Новый чат';
    }

    return firstUserMessage.slice(0, 42);
}

function loadSessionIntoLiveState(session: ChatSessionState) {
    return {
        threadId: session.threadId,
        messages: session.messages,
        signals: session.signals,
        workWindows: session.workWindows,
        activeWindowId: session.activeWindowId,
        collapsedWindowIds: session.collapsedWindowIds,
        pendingClarification: session.pendingClarification,
        resumeInFlight: false,
        isLoading: false,
        abortController: null,
    };
}

function syncActiveSessionRecord(
    state: Pick<AiChatStore, 'activeSessionId' | 'sessions' | 'threadId' | 'messages' | 'signals' | 'workWindows' | 'activeWindowId' | 'collapsedWindowIds' | 'pendingClarification'>,
): ChatSessionState[] {
    const sessionId = state.activeSessionId ?? `chat-${generateId()}`;
    const nextSession: ChatSessionState = {
        sessionId,
        title: deriveSessionTitle(state.messages),
        updatedAt: new Date().toISOString(),
        threadId: state.threadId,
        messages: state.messages,
        signals: state.signals,
        workWindows: state.workWindows,
        activeWindowId: state.activeWindowId,
        collapsedWindowIds: state.collapsedWindowIds,
        pendingClarification: state.pendingClarification,
    };

    return [
        nextSession,
        ...state.sessions.filter((session) => session.sessionId !== sessionId),
    ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export const useAiChatStore = create<AiChatStore>()(
    persist(
        (set, get) => ({
            fsmState: 'closed',
            panelMode: 'dock',
            widgetsOpen: true,
            chatWidth: 420,
            activeSessionId: 'chat-default',
            sessions: [createEmptySession('chat-default')],
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
            resumeInFlight: false,

            isLoading: false,
            abortController: null,

            dispatch: (event) => {
                const current = get().fsmState;

                if (event === 'OPEN' && current === 'closed') {
                    set({ fsmState: 'open' });
                } else if (event === 'ANIMATION_OPEN_DONE' && current === 'animating_open') {
                    set({ fsmState: 'open' });
                } else if (event === 'CLOSE' && (current === 'open' || current === 'animating_open')) {
                    get().abortRequest();
                    set({ fsmState: 'closed' });
                } else if (event === 'ANIMATION_CLOSE_DONE' && current === 'animating_close') {
                    set({ fsmState: 'closed' });
                } else if (event === 'ROUTE_CHANGE') {
                    return;
                }
            },

            setPanelMode: (mode) => set({ panelMode: mode }),

            setChatWidth: (width) =>
                set({
                    chatWidth: Math.max(360, Math.min(720, Math.round(width))),
                }),

            setWidgetsOpen: (open) =>
                set({
                    widgetsOpen: open,
                }),

            setSelectedSignalTarget: (target) =>
                set({
                    selectedSignalTarget: target,
                }),

            setActiveWindowId: (windowId) =>
                set({
                    activeWindowId: windowId,
                }),

            setWorkWindowMode: (windowId, mode) =>
                set((state) => ({
                    workWindows: state.workWindows.map((window) => window.windowId === windowId
                        ? {
                            ...window,
                            mode,
                        }
                        : window),
                    activeWindowId: windowId,
                    widgetsOpen: true,
                })),

            togglePinWorkWindow: (windowId) =>
                set((state) => ({
                    workWindows: state.workWindows.map((window) => window.windowId === windowId
                        ? {
                            ...window,
                            isPinned: !window.isPinned,
                        }
                        : window),
                })),

            collapseWorkWindow: (windowId) =>
                set((state) => {
                    const remainingVisible = state.workWindows.filter(
                        (window) => window.windowId !== windowId && !state.collapsedWindowIds.includes(window.windowId),
                    );

                    return {
                        collapsedWindowIds: state.collapsedWindowIds.includes(windowId)
                            ? state.collapsedWindowIds
                            : [...state.collapsedWindowIds, windowId],
                        activeWindowId: state.activeWindowId === windowId
                            ? (remainingVisible[0]?.windowId ?? null)
                            : state.activeWindowId,
                        widgetsOpen: true,
                    };
                }),

            restoreWorkWindow: (windowId) =>
                set((state) => ({
                    collapsedWindowIds: state.collapsedWindowIds.filter((id) => id !== windowId),
                    activeWindowId: windowId,
                    widgetsOpen: true,
                })),

            closeWorkWindow: (windowId) =>
                set((state) => {
                    const windowsToClose = new Set<string>();
                    const collectWindowIds = (currentWindowId: string) => {
                        windowsToClose.add(currentWindowId);
                        state.workWindows.forEach((window) => {
                            if (window.parentWindowId === currentWindowId && !windowsToClose.has(window.windowId)) {
                                collectWindowIds(window.windowId);
                            }
                        });
                    };

                    collectWindowIds(windowId);

                    const nextWorkWindows = state.workWindows.filter((window) => !windowsToClose.has(window.windowId));
                    const nextCollapsedWindowIds = state.collapsedWindowIds.filter((id) => !windowsToClose.has(id));
                    const nextVisibleWindows = nextWorkWindows.filter((window) => !nextCollapsedWindowIds.includes(window.windowId));
                    const nextActiveWindowId = state.activeWindowId && windowsToClose.has(state.activeWindowId)
                        ? pickPreferredWorkWindow(nextVisibleWindows)?.windowId ?? null
                        : state.activeWindowId;

                    const shouldClearPendingClarification = state.pendingClarification
                        ? windowsToClose.has(state.pendingClarification.windowId)
                        : false;

                    return {
                        workWindows: nextWorkWindows,
                        collapsedWindowIds: nextCollapsedWindowIds,
                        activeWindowId: nextActiveWindowId,
                        signals: computeChatSignals(
                            nextWorkWindows,
                            state.messages,
                            state.deriveSignalsFromWindows,
                        ),
                        pendingClarification: shouldClearPendingClarification ? null : state.pendingClarification,
                        resumeInFlight: shouldClearPendingClarification ? false : state.resumeInFlight,
                        sessions: syncActiveSessionRecord({
                            ...state,
                            workWindows: nextWorkWindows,
                            collapsedWindowIds: nextCollapsedWindowIds,
                            activeWindowId: nextActiveWindowId,
                            signals: computeChatSignals(
                                nextWorkWindows,
                                state.messages,
                                state.deriveSignalsFromWindows,
                            ),
                            pendingClarification: shouldClearPendingClarification ? null : state.pendingClarification,
                        }),
                    };
                }),

            markSignalRead: (signalId) =>
                set((state) => ({
                    readSignalIds: state.readSignalIds.includes(signalId)
                        ? state.readSignalIds
                        : [...state.readSignalIds, signalId],
                })),

            togglePanelMode: () =>
                set((state) => ({
                    panelMode: state.panelMode === 'dock' ? 'focus' : 'dock',
                })),

            toggleWidgets: () =>
                set((state) => ({
                    widgetsOpen: !state.widgetsOpen,
                })),

            startNewChat: () =>
                set((state) => {
                    const nextSessions = syncActiveSessionRecord(state);
                    const nextSession = createEmptySession();

                    return {
                        activeSessionId: nextSession.sessionId,
                        sessions: [nextSession, ...nextSessions.filter((session) => session.sessionId !== nextSession.sessionId)],
                        ...loadSessionIntoLiveState(nextSession),
                    };
                }),

            openChatSession: (sessionId) =>
                set((state) => {
                    const nextSessions = syncActiveSessionRecord(state);
                    const targetSession = nextSessions.find((session) => session.sessionId === sessionId);
                    if (!targetSession) {
                        return state;
                    }

                    return {
                        activeSessionId: targetSession.sessionId,
                        sessions: nextSessions,
                        ...loadSessionIntoLiveState(targetSession),
                    };
                }),

            abortRequest: () => {
                const { abortController } = get();
                if (abortController) {
                    abortController.abort();
                    set({ abortController: null, isLoading: false, resumeInFlight: false });
                }
            },

            clearHistory: () => set((state) => {
                const nextSession = createEmptySession(state.activeSessionId ?? 'chat-default');
                const nextSessions = [
                    nextSession,
                    ...state.sessions.filter((session) => session.sessionId !== nextSession.sessionId),
                ];

                return {
                    sessions: nextSessions,
                    ...loadSessionIntoLiveState(nextSession),
                };
            }),

            sendMessage: async (text: string) => {
                const { threadId, fsmState } = get();
                if (fsmState !== 'open') return;
                const trimmedText = text.trim();
                if (!trimmedText) return;

                const userMsg: ChatMessage = {
                    id: generateId(),
                    role: 'user',
                    content: trimmedText,
                    timestamp: new Date().toISOString(),
                };

                set((state) => {
                    const nextState = {
                        ...state,
                        messages: [...state.messages, userMsg],
                    };

                    return {
                        messages: nextState.messages,
                        isLoading: false,
                        abortController: null,
                        sessions: syncActiveSessionRecord(nextState),
                    };
                });

                if (isOpenTechCouncilCommand(trimmedText)) {
                    const { activeEscalation, setQuorumModalOpen } = useGovernanceStore.getState();
                    const assistantMsg: ChatMessage = {
                        id: generateId(),
                        role: 'assistant',
                        content: activeEscalation
                            ? 'Открываю Техсовет по активной эскалации.'
                            : 'Активной эскалации нет. Техсовет откроется после события R3/R4.',
                        timestamp: new Date().toISOString(),
                        riskLevel: activeEscalation ? 'R2' : 'R1',
                    };

                    if (activeEscalation) {
                        setQuorumModalOpen(true);
                    }

                    set((state) => ({
                        messages: [...state.messages, assistantMsg],
                        isLoading: false,
                        abortController: null,
                        sessions: syncActiveSessionRecord({
                            ...state,
                            messages: [...state.messages, assistantMsg],
                        }),
                    }));
                    return;
                }

                const ac = new AbortController();
                set({ isLoading: true, abortController: ac });

                try {
                    await get().submitRequest({
                        message: trimmedText,
                        threadId,
                        appendAssistantMessage: true,
                        originMessageId: userMsg.id,
                        signal: ac.signal,
                    });

                } catch (error: unknown) {
                    const isAbortError = error instanceof Error && error.name === 'AbortError';
                    if (!isAbortError) {
                        const uiError = getChatRuntimeErrorMessage(error);
                        const errorMessage: ChatMessage = {
                            id: generateId(),
                            role: 'assistant',
                            content: `⚠️ ${uiError}`,
                            timestamp: new Date().toISOString(),
                            riskLevel: 'R3',
                        };
                        set((state) => ({
                            isLoading: false,
                            abortController: null,
                            messages: [...state.messages, errorMessage],
                            sessions: syncActiveSessionRecord({
                                ...state,
                                messages: [...state.messages, errorMessage],
                            }),
                        }));
                    }
                }
            },

            useWorkspaceFieldForClarification: async () => {
                const workspaceContext = useWorkspaceContextStore.getState().context;
                const fieldRef = workspaceContext.activeEntityRefs?.find((item) => item.kind === 'field')?.id;
                if (!fieldRef) return;

                await get().applyClarificationContext({ fieldRef });
            },

            refreshClarificationContext: async () => {
                const workspaceContext = useWorkspaceContextStore.getState().context;
                const fieldRef = workspaceContext.activeEntityRefs?.find((item) => item.kind === 'field')?.id;
                const seasonRef = typeof workspaceContext.filters?.seasonId === 'string'
                    ? workspaceContext.filters.seasonId
                    : undefined;
                const seasonId = typeof workspaceContext.filters?.seasonId === 'string'
                    ? workspaceContext.filters.seasonId
                    : undefined;
                const planId = typeof workspaceContext.filters?.planId === 'string'
                    ? workspaceContext.filters.planId
                    : undefined;

                await get().applyClarificationContext({
                    ...(fieldRef ? { fieldRef } : {}),
                    ...(seasonRef ? { seasonRef } : {}),
                    ...(seasonId ? { seasonId } : {}),
                    ...(planId ? { planId } : {}),
                });
            },

            submitRequest: async ({
                message,
                threadId,
                appendAssistantMessage,
                originMessageId,
                signal,
                clarificationResume,
            }) => {
                const workspaceContext = useWorkspaceContextStore.getState().context;
                const data = await submitRaiChatRequest({
                    threadId,
                    message,
                    workspaceContext,
                    originMessageId,
                    clarificationResume: clarificationResume as RaiChatClarificationResumeDto | undefined,
                    signal,
                });
                const fallbackOriginMessageId = clarificationResume
                    ? get().workWindows.find((currentWindow) => currentWindow.windowId === clarificationResume.windowId)?.originMessageId ?? null
                    : null;
                const adaptedResponse = adaptRaiChatResponseForStore({
                    data,
                    requestedThreadId: threadId,
                    originMessageId: originMessageId ?? null,
                    fallbackOriginMessageId,
                    legacyWidgetMigrationEnabled: get().legacyWidgetMigrationEnabled,
                });

                const aiMsg: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: adaptedResponse.content,
                    timestamp: new Date().toISOString(),
                    riskLevel: adaptedResponse.riskLevel,
                    widgets: adaptedResponse.widgets,
                    memoryUsed: adaptedResponse.memoryUsed,
                    memorySummary: adaptedResponse.memorySummary,
                    suggestedActions: adaptedResponse.suggestedActions,
                    workWindows: adaptedResponse.nextWorkWindows ?? [],
                    trustSummary: adaptedResponse.trustSummary,
                };

                set((state) => {
                    const nextMessages = [...state.messages, aiMsg];
                    const resolvedResponseState = resolveRaiChatResponseState({
                        currentWindows: state.workWindows,
                        incomingWindows: adaptedResponse.nextWorkWindows,
                        requestedActiveWindowId: adaptedResponse.nextActiveWindowId,
                        currentActiveWindowId: state.activeWindowId,
                        currentCollapsedWindowIds: state.collapsedWindowIds,
                        messages: nextMessages,
                        deriveSignalsFromWindows: state.deriveSignalsFromWindows,
                    });
                    const nextPendingClarification = hydratePendingClarificationState({
                        data,
                        fallbackOriginalUserMessage: appendAssistantMessage
                            ? message
                            : state.pendingClarification?.originalUserMessage ?? message,
                        workWindows: resolvedResponseState.workWindows,
                    });

                    return {
                        messages: nextMessages,
                        isLoading: false,
                        abortController: null,
                        threadId: data.threadId || state.threadId,
                        workWindows: resolvedResponseState.workWindows,
                        activeWindowId: resolvedResponseState.activeWindowId,
                        collapsedWindowIds: resolvedResponseState.collapsedWindowIds,
                        signals: resolvedResponseState.signals,
                        pendingClarification: nextPendingClarification,
                        resumeInFlight: false,
                        sessions: syncActiveSessionRecord({
                            ...state,
                            messages: nextMessages,
                            threadId: data.threadId || state.threadId,
                            workWindows: resolvedResponseState.workWindows,
                            activeWindowId: resolvedResponseState.activeWindowId,
                            collapsedWindowIds: resolvedResponseState.collapsedWindowIds,
                            signals: resolvedResponseState.signals,
                            pendingClarification: nextPendingClarification,
                        }),
                    };
                });

                if (adaptedResponse.nextWorkWindows?.length) {
                    set({ widgetsOpen: true });
                }

                return data;
            },

            applyClarificationContext: async (nextContext) => {
                const state = get();
                const pending = state.pendingClarification;
                if (!pending) return;

                const collectedContext = {
                    ...pending.collectedContext,
                    ...nextContext,
                };
                const missingKeys = pending.items
                    .map((item) => item.key)
                    .filter((key) => !collectedContext[key]);
                const updatedItems = pending.items.map((item) => {
                    const value = collectedContext[item.key];
                    return {
                        ...item,
                        status: value ? 'resolved' as const : 'missing' as const,
                        resolvedFrom: value ? 'workspace' as const : item.resolvedFrom,
                        value,
                    };
                });

                set((current) => ({
                    pendingClarification: current.pendingClarification ? {
                        ...current.pendingClarification,
                        collectedContext,
                        missingKeys,
                        items: updatedItems,
                    } : current.pendingClarification,
                    workWindows: current.workWindows.map((window) => window.windowId === pending.windowId ? {
                        ...window,
                        status: missingKeys.length === 0 ? 'resolved' : 'needs_user_input',
                        payload: {
                            ...window.payload,
                            fieldRef: collectedContext.fieldRef,
                            seasonRef: collectedContext.seasonRef,
                            seasonId: collectedContext.seasonId,
                            planId: collectedContext.planId,
                            missingKeys,
                        },
                    } : window),
                    collapsedWindowIds: current.collapsedWindowIds.filter((id) => id !== pending.windowId),
                    activeWindowId: pending.windowId,
                    sessions: syncActiveSessionRecord({
                        ...current,
                        pendingClarification: current.pendingClarification ? {
                            ...current.pendingClarification,
                            collectedContext,
                            missingKeys,
                            items: updatedItems,
                        } : current.pendingClarification,
                        workWindows: current.workWindows.map((window) => window.windowId === pending.windowId ? {
                            ...window,
                            status: missingKeys.length === 0 ? 'resolved' : 'needs_user_input',
                            payload: {
                                ...window.payload,
                                fieldRef: collectedContext.fieldRef,
                                seasonRef: collectedContext.seasonRef,
                                seasonId: collectedContext.seasonId,
                                planId: collectedContext.planId,
                                missingKeys,
                            },
                        } : window),
                        collapsedWindowIds: current.collapsedWindowIds.filter((id) => id !== pending.windowId),
                        activeWindowId: pending.windowId,
                    }),
                }));

                if (missingKeys.length === 0 && !get().resumeInFlight) {
                    set({ resumeInFlight: true, isLoading: true });
                    try {
                        await get().submitRequest({
                            message: pending.originalUserMessage,
                            threadId: get().threadId,
                            appendAssistantMessage: false,
                            originMessageId: get().workWindows.find((window) => window.windowId === pending.windowId)?.originMessageId ?? null,
                            clarificationResume: {
                                windowId: pending.windowId,
                                intentId: pending.intentId,
                                agentRole: pending.agentRole,
                                collectedContext,
                            },
                        });
                    } catch {
                        set((current) => ({
                            isLoading: false,
                            resumeInFlight: false,
                            pendingClarification: current.pendingClarification ? {
                                ...current.pendingClarification,
                                collectedContext,
                                missingKeys: current.pendingClarification.items
                                    .map((item) => item.key)
                                    .filter((key) => !collectedContext[key]),
                            } : current.pendingClarification,
                            workWindows: current.workWindows.map((window) => window.windowId === pending.windowId ? {
                                ...window,
                                status: 'needs_user_input',
                            } : window),
                            messages: [...current.messages, {
                                id: generateId(),
                                role: 'assistant',
                                content: 'Не удалось продолжить подготовку техкарты. Попробуйте обновить контекст ещё раз.',
                                timestamp: new Date().toISOString(),
                                riskLevel: 'R2',
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
                activeSessionId: state.activeSessionId,
                sessions: state.sessions,
                messages: state.messages.slice(-50),
                threadId: state.threadId,
                panelMode: state.panelMode,
                widgetsOpen: state.widgetsOpen,
                chatWidth: state.chatWidth,
                readSignalIds: state.readSignalIds,
                signals: state.signals,
                deriveSignalsFromWindows: state.deriveSignalsFromWindows,
                legacyWidgetMigrationEnabled: state.legacyWidgetMigrationEnabled,
                workWindows: state.workWindows,
                activeWindowId: state.activeWindowId,
                collapsedWindowIds: state.collapsedWindowIds,
                pendingClarification: state.pendingClarification,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (!Array.isArray(state.sessions) || state.sessions.length === 0) {
                        state.sessions = [createEmptySession('chat-default')];
                        state.activeSessionId = 'chat-default';
                    }
                    state.fsmState = 'closed';
                    state.isLoading = false;
                    state.abortController = null;
                }
            }
        }
    )
);

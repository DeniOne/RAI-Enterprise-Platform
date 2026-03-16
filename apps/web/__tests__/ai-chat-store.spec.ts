import { act } from '@testing-library/react';
import { RaiChatWidgetType } from '@/lib/ai-chat-widgets';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';
import { useGovernanceStore } from '@/shared/store/governance.store';

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
            activeSessionId: 'chat-default',
            sessions: [
                {
                    sessionId: 'chat-default',
                    title: 'Новый чат',
                    updatedAt: '2026-03-07T00:00:00.000Z',
                    threadId: null,
                    messages: [],
                    signals: [],
                    workWindows: [],
                    activeWindowId: null,
                    collapsedWindowIds: [],
                    pendingClarification: null,
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
            resumeInFlight: false,
            isLoading: false,
            abortController: null,
        });
        useWorkspaceContextStore.setState({
            context: { route: '/' },
        });
        useGovernanceStore.setState({
            activeEscalation: null,
            isQuorumModalOpen: false,
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
                memorySummary: {
                    primaryHint: 'Учтён похожий кейс прошлого сезона',
                    primaryKind: 'episode',
                    detailsAvailable: true,
                },
                suggestedActions: [
                    {
                        kind: 'tool',
                        title: 'Повторить сообщение',
                        toolName: 'echo_message',
                        payload: { message: 'Покажи контекст' },
                    },
                ],
                workWindows: [],
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

        const userMessageId = useAiChatStore.getState().messages.find((message) => message.role === 'user')?.id;
        const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
        const idempotencyKey =
            requestInit && requestInit.headers && !Array.isArray(requestInit.headers)
                ? (requestInit.headers as Record<string, string>)['Idempotency-Key']
                : undefined;

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/rai/chat',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Idempotency-Key': expect.stringContaining('rai-chat-submit:'),
                }),
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
        expect(userMessageId).toBeTruthy();
        expect(idempotencyKey).toContain(userMessageId as string);
        expect(useAiChatStore.getState().messages.at(-1)?.memoryUsed).toEqual([
            { kind: 'episode', label: 'deviation PANy 2d ago', confidence: 0.82, source: 'episode' },
            { kind: 'profile', label: 'prefers dashboard summary', confidence: 0.8, source: 'profile' },
        ]);
        expect(useAiChatStore.getState().messages.at(-1)?.memorySummary).toEqual({
            primaryHint: 'Учтён похожий кейс прошлого сезона',
            primaryKind: 'episode',
            detailsAvailable: true,
        });
        expect(useAiChatStore.getState().messages.at(-1)?.suggestedActions).toEqual([
            {
                kind: 'tool',
                title: 'Повторить сообщение',
                toolName: 'echo_message',
                payload: { message: 'Покажи контекст' },
            },
        ]);
        expect(useAiChatStore.getState().sessions[0].threadId).toBe('thread-1');
    });

    it('opens TechCouncil modal locally for the "открой техсовет" command without API call', async () => {
        useAiChatStore.setState({
            fsmState: 'open',
            threadId: 'thread-techcouncil',
        });
        useGovernanceStore.setState({
            activeEscalation: {
                traceId: 'TRC-123',
                level: 'R3',
                description: 'Требуется решение Техсовета для: AGRO_EXECUTION',
                status: 'COLLECTING',
                threshold: 0.6,
                members: [],
            },
            isQuorumModalOpen: false,
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('открой техсовет');
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(useGovernanceStore.getState().isQuorumModalOpen).toBe(true);
        expect(useAiChatStore.getState().messages.at(-1)).toEqual(
            expect.objectContaining({
                role: 'assistant',
                content: 'Открываю Техсовет по активной эскалации.',
            }),
        );
    });

    it('creates a new local chat session and switches active session', () => {
        useAiChatStore.setState({
            messages: [
                {
                    id: 'msg-1',
                    role: 'user',
                    content: 'Покажи KPI',
                    timestamp: '2026-03-07T10:00:00.000Z',
                },
            ],
            threadId: 'thread-1',
        });

        act(() => {
            useAiChatStore.getState().startNewChat();
        });

        expect(useAiChatStore.getState().messages).toEqual([]);
        expect(useAiChatStore.getState().threadId).toBeNull();
        expect(useAiChatStore.getState().sessions.length).toBeGreaterThan(1);
        expect(useAiChatStore.getState().sessions.some((session) => session.title === 'Покажи KPI')).toBe(true);
    });

    it('opens a previous chat session and restores its thread state', () => {
        useAiChatStore.setState({
            activeSessionId: 'chat-2',
            sessions: [
                {
                    sessionId: 'chat-2',
                    title: 'Новый чат',
                    updatedAt: '2026-03-07T11:00:00.000Z',
                    threadId: null,
                    messages: [],
                    signals: [],
                    workWindows: [],
                    activeWindowId: null,
                    collapsedWindowIds: [],
                    pendingClarification: null,
                },
                {
                    sessionId: 'chat-1',
                    title: 'Покажи KPI',
                    updatedAt: '2026-03-07T10:00:00.000Z',
                    threadId: 'thread-1',
                    messages: [
                        {
                            id: 'msg-1',
                            role: 'user',
                            content: 'Покажи KPI',
                            timestamp: '2026-03-07T10:00:00.000Z',
                        },
                    ],
                    signals: [],
                    workWindows: [],
                    activeWindowId: null,
                    collapsedWindowIds: [],
                    pendingClarification: null,
                },
            ],
        });

        act(() => {
            useAiChatStore.getState().openChatSession('chat-1');
        });

        expect(useAiChatStore.getState().activeSessionId).toBe('chat-1');
        expect(useAiChatStore.getState().threadId).toBe('thread-1');
        expect(useAiChatStore.getState().messages).toEqual([
            expect.objectContaining({
                content: 'Покажи KPI',
            }),
        ]);
    });

    it('stores pending clarification and work window from assistant response', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'Чтобы подготовить техкарту, мне нужны поле и сезон. Я открыл справа панель добора контекста.',
                widgets: [],
                memoryUsed: [],
                threadId: 'thread-clarify',
                activeWindowId: 'win-1',
                pendingClarification: {
                    kind: 'missing_context',
                    agentRole: 'agronomist',
                    intentId: 'tech_map_draft',
                    summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                    autoResume: true,
                    items: [
                        { key: 'fieldRef', label: 'Поле', required: true, reason: 'field', sourcePriority: ['workspace'], status: 'missing' },
                        { key: 'seasonRef', label: 'Сезон', required: true, reason: 'season', sourcePriority: ['workspace'], status: 'missing' },
                    ],
                },
                workWindows: [
                    {
                        windowId: 'win-1',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        category: 'clarification',
                        priority: 85,
                        mode: 'panel',
                        title: 'Добор контекста для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                            missingKeys: ['fieldRef', 'seasonRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                    {
                        windowId: 'win-1-hint',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_hint',
                        category: 'analysis',
                        priority: 40,
                        mode: 'panel',
                        title: 'Что ещё нужно для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Проверьте поле и сезон в рабочем контексте или откройте карточку поля.',
                            missingKeys: ['fieldRef', 'seasonRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                ],
            }),
        });

        useAiChatStore.setState({ fsmState: 'open' });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Составь техкарту');
        });

        expect(useAiChatStore.getState().pendingClarification).toEqual(
            expect.objectContaining({
                active: true,
                windowId: 'win-1',
                intentId: 'tech_map_draft',
                missingKeys: ['fieldRef', 'seasonRef'],
            }),
        );
        expect(useAiChatStore.getState().workWindows[0]).toEqual(
            expect.objectContaining({
                windowId: 'win-1',
                type: 'context_acquisition',
                originMessageId: expect.any(String),
            }),
        );
        expect(useAiChatStore.getState().collapsedWindowIds).toEqual(['win-1-hint']);
    });

    it('migrates legacy widgets into work windows and derives signals from them', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'Есть структурный вывод',
                widgets: [
                    {
                        schemaVersion: '1.0',
                        type: RaiChatWidgetType.DeviationList,
                        version: 1,
                        payload: {
                            title: 'Отклонения по маршруту',
                            items: [
                                {
                                    id: 'dev-1',
                                    title: 'Проверить отклонение',
                                    severity: 'high',
                                    fieldLabel: 'Поле 42',
                                    status: 'open',
                                },
                            ],
                        },
                    },
                ],
                memoryUsed: [],
                threadId: 'thread-legacy',
            }),
        });

        useAiChatStore.setState({ fsmState: 'open' });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Покажи структурный вывод');
        });

        expect(useAiChatStore.getState().workWindows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'related_signals',
                    title: 'Отклонения по маршруту',
                }),
            ]),
        );
        expect(useAiChatStore.getState().signals).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    text: expect.stringContaining('Проверить отклонение'),
                }),
            ]),
        );
    });

    it('clears stale unpinned work windows when a new response has no structured windows', async () => {
        useAiChatStore.setState({
            fsmState: 'open',
            workWindows: [
                {
                    windowId: 'legacy-route-window',
                    originMessageId: null,
                    agentRole: 'knowledge',
                    type: 'related_signals',
                    category: 'analysis',
                    priority: 40,
                    mode: 'panel',
                    title: 'Отклонения по маршруту consulting / execution',
                    status: 'completed',
                    payload: {
                        summary: 'Старый route-based сигнал',
                        signalItems: [
                            {
                                id: 'legacy-signal-1',
                                tone: 'warning',
                                text: 'Проверить старое отклонение',
                            },
                        ],
                    },
                    actions: [],
                    isPinned: false,
                },
            ],
            activeWindowId: 'legacy-route-window',
            signals: [
                {
                    id: 'legacy-signal-1',
                    tone: 'warning',
                    text: 'Проверить старое отклонение',
                },
            ],
        });

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'Карточка контрагента открыта.',
                widgets: [],
                memoryUsed: [],
                threadId: 'thread-fresh',
            }),
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Открой карточку контрагента');
        });

        expect(useAiChatStore.getState().workWindows).toEqual([]);
        expect(useAiChatStore.getState().activeWindowId).toBeNull();
        expect(useAiChatStore.getState().signals).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    text: expect.stringContaining('Карточка контрагента открыта'),
                }),
            ]),
        );
        expect(useAiChatStore.getState().signals).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    text: expect.stringContaining('старое отклонение'),
                }),
            ]),
        );
    });

    it('collapses and restores work windows without losing them', () => {
        useAiChatStore.setState({
            workWindows: [
                {
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Нужно собрать контекст.',
                        missingKeys: ['fieldRef', 'seasonRef'],
                    },
                    actions: [],
                    isPinned: false,
                },
                {
                    windowId: 'win-2',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'result',
                    priority: 70,
                    mode: 'panel',
                    title: 'Ещё одно окно',
                    status: 'resolved',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Контекст почти готов.',
                        missingKeys: [],
                    },
                    actions: [],
                    isPinned: false,
                },
            ],
            activeWindowId: 'win-1',
        });

        act(() => {
            useAiChatStore.getState().collapseWorkWindow('win-1');
        });

        expect(useAiChatStore.getState().collapsedWindowIds).toEqual(['win-1']);
        expect(useAiChatStore.getState().activeWindowId).toBe('win-2');

        act(() => {
            useAiChatStore.getState().restoreWorkWindow('win-1');
        });

        expect(useAiChatStore.getState().collapsedWindowIds).toEqual([]);
        expect(useAiChatStore.getState().activeWindowId).toBe('win-1');
    });

    it('changes work window mode locally in store', () => {
        useAiChatStore.setState({
            workWindows: [
                {
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Нужно собрать контекст.',
                        missingKeys: ['fieldRef'],
                    },
                    actions: [],
                    isPinned: false,
                },
            ],
        });

        act(() => {
            useAiChatStore.getState().setWorkWindowMode('win-1', 'takeover');
        });

        expect(useAiChatStore.getState().workWindows[0].mode).toBe('takeover');
        expect(useAiChatStore.getState().activeWindowId).toBe('win-1');
    });

    it('restores primary work window from a hint window target', () => {
        useAiChatStore.setState({
            workWindows: [
                {
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Нужно собрать контекст.',
                        missingKeys: ['fieldRef'],
                    },
                    actions: [],
                    isPinned: false,
                },
                {
                    windowId: 'win-1-hint',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_hint',
                    category: 'analysis',
                    priority: 40,
                    mode: 'inline',
                    title: 'Что ещё нужно для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Остался один параметр.',
                        missingKeys: ['fieldRef'],
                    },
                    actions: [
                        {
                            id: 'focus_context_acquisition',
                            kind: 'focus_window',
                            label: 'Открыть панель добора',
                            enabled: true,
                            targetWindowId: 'win-1',
                        },
                    ],
                    isPinned: false,
                },
            ],
            activeWindowId: 'win-1-hint',
            collapsedWindowIds: ['win-1'],
        });

        act(() => {
            useAiChatStore.getState().restoreWorkWindow('win-1');
        });

        expect(useAiChatStore.getState().activeWindowId).toBe('win-1');
        expect(useAiChatStore.getState().collapsedWindowIds).toEqual([]);
    });

    it('closes a parent work window together with its child hint windows', () => {
        useAiChatStore.setState({
            pendingClarification: {
                active: true,
                windowId: 'win-1',
                agentRole: 'agronomist',
                intentId: 'tech_map_draft',
                originalUserMessage: 'Составь техкарту',
                collectedContext: {},
                missingKeys: ['fieldRef', 'seasonRef'],
                autoResume: true,
                items: [],
            },
            workWindows: [
                {
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    parentWindowId: null,
                    relatedWindowIds: ['win-1-hint'],
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Нужно собрать контекст.',
                        missingKeys: ['fieldRef', 'seasonRef'],
                    },
                    actions: [],
                    isPinned: false,
                },
                {
                    windowId: 'win-1-hint',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_hint',
                    parentWindowId: 'win-1',
                    relatedWindowIds: ['win-1'],
                    category: 'analysis',
                    priority: 40,
                    mode: 'inline',
                    title: 'Что ещё нужно для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Остался один параметр.',
                        missingKeys: ['fieldRef'],
                    },
                    actions: [],
                    isPinned: false,
                },
            ],
            activeWindowId: 'win-1',
            collapsedWindowIds: ['win-1-hint'],
        });

        act(() => {
            useAiChatStore.getState().closeWorkWindow('win-1');
        });

        expect(useAiChatStore.getState().workWindows).toEqual([]);
        expect(useAiChatStore.getState().collapsedWindowIds).toEqual([]);
        expect(useAiChatStore.getState().activeWindowId).toBeNull();
        expect(useAiChatStore.getState().pendingClarification).toBeNull();
    });

    it('auto-resumes once both fieldRef and seasonRef are collected', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Чтобы подготовить техкарту, мне нужны поле и сезон. Я открыл справа панель добора контекста.',
                    widgets: [],
                    memoryUsed: [],
                    threadId: 'thread-clarify',
                    activeWindowId: 'win-1',
                    pendingClarification: {
                        kind: 'missing_context',
                        agentRole: 'agronomist',
                        intentId: 'tech_map_draft',
                        summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                        autoResume: true,
                        items: [
                            { key: 'fieldRef', label: 'Поле', required: true, reason: 'field', sourcePriority: ['workspace'], status: 'missing' },
                            { key: 'seasonRef', label: 'Сезон', required: true, reason: 'season', sourcePriority: ['workspace'], status: 'missing' },
                        ],
                    },
                    workWindows: [
                        {
                            windowId: 'win-1',
                            originMessageId: null,
                            agentRole: 'agronomist',
                            type: 'context_acquisition',
                            category: 'clarification',
                            priority: 85,
                            mode: 'panel',
                            title: 'Добор контекста для техкарты',
                            status: 'needs_user_input',
                            payload: {
                                intentId: 'tech_map_draft',
                                summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                                missingKeys: ['fieldRef', 'seasonRef'],
                            },
                            actions: [],
                            isPinned: false,
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Техкарта подготовлена.',
                    widgets: [],
                    memoryUsed: [],
                    threadId: 'thread-clarify',
                    activeWindowId: 'win-1',
                    pendingClarification: null,
                    workWindows: [
                        {
                            windowId: 'win-1',
                            originMessageId: null,
                            agentRole: 'agronomist',
                            type: 'context_acquisition',
                            parentWindowId: null,
                            relatedWindowIds: ['win-1-result-hint'],
                            category: 'result',
                            priority: 70,
                            mode: 'panel',
                            title: 'Добор контекста для техкарты',
                            status: 'completed',
                            payload: {
                                intentId: 'tech_map_draft',
                                summary: 'Техкарта подготовлена.',
                                fieldRef: 'field-42',
                                seasonRef: 'season-42',
                                missingKeys: [],
                                resultText: 'Техкарта подготовлена.',
                            },
                            actions: [],
                            isPinned: false,
                        },
                        {
                            windowId: 'win-1-result-hint',
                            originMessageId: null,
                            agentRole: 'agronomist',
                            type: 'context_hint',
                            parentWindowId: 'win-1',
                            relatedWindowIds: ['win-1'],
                            category: 'result',
                            priority: 30,
                            mode: 'inline',
                            title: 'Что делать дальше',
                            status: 'completed',
                            payload: {
                                intentId: 'tech_map_draft',
                                summary: 'Техкарта готова. Можно открыть основное окно с результатом и продолжить работу по полю.',
                                fieldRef: 'field-42',
                                seasonRef: 'season-42',
                                missingKeys: [],
                                resultText: 'Техкарта подготовлена.',
                            },
                            actions: [
                                {
                                    id: 'focus_result_window',
                                    kind: 'focus_window',
                                    label: 'Открыть результат',
                                    enabled: true,
                                    targetWindowId: 'win-1',
                                },
                            ],
                            isPinned: false,
                        },
                    ],
                }),
            });

        useAiChatStore.setState({ fsmState: 'open' });
        useWorkspaceContextStore.setState({
            context: {
                route: '/consulting/techmaps',
                activeEntityRefs: [{ kind: 'field', id: 'field-42' }],
                filters: { seasonId: 'season-42' },
            },
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Составь техкарту');
        });

        await act(async () => {
            await useAiChatStore.getState().refreshClarificationContext();
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(
            expect.objectContaining({
                message: 'Составь техкарту',
                threadId: 'thread-clarify',
                clarificationResume: {
                    windowId: 'win-1',
                    intentId: 'tech_map_draft',
                    agentRole: 'agronomist',
                    collectedContext: {
                        fieldRef: 'field-42',
                        seasonRef: 'season-42',
                        seasonId: 'season-42',
                    },
                },
            }),
        );
        expect(useAiChatStore.getState().pendingClarification).toBeNull();
        expect(useAiChatStore.getState().workWindows[0]).toEqual(
            expect.objectContaining({
                status: 'completed',
            }),
        );
        expect(useAiChatStore.getState().collapsedWindowIds).toEqual(['win-1-result-hint']);
    });

    it('selects the highest-priority work window when backend omits activeWindowId', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                text: 'Окна готовы.',
                widgets: [],
                memoryUsed: [],
                threadId: 'thread-priority',
                workWindows: [
                    {
                        windowId: 'win-low',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        category: 'result',
                        priority: 60,
                        mode: 'panel',
                        title: 'Низкий приоритет',
                        status: 'completed',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'low',
                            missingKeys: [],
                        },
                        actions: [],
                        isPinned: false,
                    },
                    {
                        windowId: 'win-high',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        category: 'clarification',
                        priority: 95,
                        mode: 'inline',
                        title: 'Высокий приоритет',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'high',
                            missingKeys: ['fieldRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                ],
            }),
        });

        useAiChatStore.setState({ fsmState: 'open' });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Покажи окна');
        });

        expect(useAiChatStore.getState().activeWindowId).toBe('win-high');
    });

    it('auto-resumes economist clarification once seasonId is collected from workspace context', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Чтобы показать план-факт, мне нужен сезон. Я открыл справа панель добора контекста.',
                    widgets: [],
                    memoryUsed: [],
                    threadId: 'thread-planfact',
                    activeWindowId: 'win-planfact-1',
                    pendingClarification: {
                        kind: 'missing_context',
                        agentRole: 'economist',
                        intentId: 'compute_plan_fact',
                        summary: 'Чтобы показать план-факт, нужен хотя бы сезон.',
                        autoResume: true,
                        items: [
                            { key: 'seasonId', label: 'Сезон', required: true, reason: 'season', sourcePriority: ['workspace'], status: 'missing' },
                        ],
                    },
                    workWindows: [
                        {
                            windowId: 'win-planfact-1',
                            originMessageId: null,
                            agentRole: 'economist',
                            type: 'context_acquisition',
                            category: 'clarification',
                            priority: 80,
                            mode: 'panel',
                            title: 'Добор контекста для план-факта',
                            status: 'needs_user_input',
                            payload: {
                                intentId: 'compute_plan_fact',
                                summary: 'Чтобы показать план-факт, нужен хотя бы сезон.',
                                missingKeys: ['seasonId'],
                            },
                            actions: [],
                            isPinned: false,
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'План-факт готов.',
                    widgets: [],
                    memoryUsed: [],
                    threadId: 'thread-planfact',
                    activeWindowId: 'win-planfact-1',
                    pendingClarification: null,
                    workWindows: [
                        {
                            windowId: 'win-planfact-1',
                            originMessageId: null,
                            agentRole: 'economist',
                            type: 'context_acquisition',
                            parentWindowId: null,
                            relatedWindowIds: ['win-planfact-1-result-hint'],
                            category: 'result',
                            priority: 65,
                            mode: 'takeover',
                            title: 'План-факт готов',
                            status: 'completed',
                            payload: {
                                intentId: 'compute_plan_fact',
                                summary: 'План-факт рассчитан.',
                                seasonId: 'season-2026',
                                missingKeys: [],
                                resultText: 'План-факт готов.',
                            },
                            actions: [],
                            isPinned: false,
                        },
                        {
                            windowId: 'win-planfact-1-result-hint',
                            originMessageId: null,
                            agentRole: 'economist',
                            type: 'context_hint',
                            parentWindowId: 'win-planfact-1',
                            relatedWindowIds: ['win-planfact-1'],
                            category: 'result',
                            priority: 25,
                            mode: 'inline',
                            title: 'Что делать дальше',
                            status: 'completed',
                            payload: {
                                intentId: 'compute_plan_fact',
                                summary: 'План-факт готов. Можно открыть результат или перейти в финансовый экран.',
                                seasonId: 'season-2026',
                                missingKeys: [],
                                resultText: 'План-факт готов.',
                            },
                            actions: [
                                {
                                    id: 'focus_planfact_result',
                                    kind: 'focus_window',
                                    label: 'Открыть результат',
                                    enabled: true,
                                    targetWindowId: 'win-planfact-1',
                                },
                                {
                                    id: 'open_finance_route_result',
                                    kind: 'open_route',
                                    label: 'Перейти к финансам',
                                    enabled: true,
                                    targetRoute: '/consulting/yield',
                                },
                            ],
                            isPinned: false,
                        },
                    ],
                }),
            });

        useAiChatStore.setState({ fsmState: 'open' });
        useWorkspaceContextStore.setState({
            context: {
                route: '/consulting/yield',
                filters: { seasonId: 'season-2026' },
            },
        });

        await act(async () => {
            await useAiChatStore.getState().sendMessage('Покажи план-факт');
        });

        await act(async () => {
            await useAiChatStore.getState().refreshClarificationContext();
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(
            expect.objectContaining({
                message: 'Покажи план-факт',
                threadId: 'thread-planfact',
                clarificationResume: expect.objectContaining({
                    windowId: 'win-planfact-1',
                    intentId: 'compute_plan_fact',
                    agentRole: 'economist',
                    collectedContext: expect.objectContaining({
                        seasonId: 'season-2026',
                    }),
                }),
            }),
        );
        expect(useAiChatStore.getState().pendingClarification).toBeNull();
        expect(useAiChatStore.getState().workWindows[0]).toEqual(
            expect.objectContaining({
                windowId: 'win-planfact-1',
                agentRole: 'economist',
                status: 'completed',
                mode: 'takeover',
                payload: expect.objectContaining({
                    seasonId: 'season-2026',
                    missingKeys: [],
                }),
            }),
        );
        expect(useAiChatStore.getState().collapsedWindowIds).toEqual(['win-planfact-1-result-hint']);
    });
});

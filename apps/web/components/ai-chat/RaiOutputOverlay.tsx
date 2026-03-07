'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

import { AiWindowStack } from './AiWindowStack';
import { AiWorkWindow, AiWorkWindowAction } from './ai-work-window-types';
import { ComparisonWindow } from './ComparisonWindow';
import { ContextAcquisitionWindow } from './ContextAcquisitionWindow';
import { ContextHintWindow } from './ContextHintWindow';
import { RelatedSignalsWindow } from './RelatedSignalsWindow';
import { StructuredResultWindow } from './StructuredResultWindow';

export function RaiOutputOverlay() {
    const router = useRouter();
    const {
        widgetsOpen,
        workWindows,
        activeWindowId,
        collapsedWindowIds,
        pendingClarification,
        messages,
        useWorkspaceFieldForClarification,
        refreshClarificationContext,
        setWorkWindowMode,
        togglePinWorkWindow,
        collapseWorkWindow,
        restoreWorkWindow,
        closeWorkWindow,
    } = useAiChatStore();
    const workspaceContext = useWorkspaceContextStore((state) => state.context);

    const visibleWorkWindows = workWindows.filter((window) => !collapsedWindowIds.includes(window.windowId));
    const collapsedWorkWindows = workWindows.filter((window) => collapsedWindowIds.includes(window.windowId));
    const activeWindow = visibleWorkWindows.find((window) => window.windowId === activeWindowId) ?? visibleWorkWindows[0] ?? null;
    const workWindowTitleById = new Map(workWindows.map((window) => [window.windowId, window.title]));
    const messageById = new Map(messages.map((message) => [message.id, message]));
    const activeWindowSourceMessage = activeWindow?.originMessageId
        ? messageById.get(activeWindow.originMessageId)?.content ?? null
        : null;

    useEffect(() => {
        if (!pendingClarification?.active) return;
        void refreshClarificationContext();
    }, [
        pendingClarification?.active,
        workspaceContext.route,
        JSON.stringify(workspaceContext.activeEntityRefs ?? []),
        JSON.stringify(workspaceContext.filters ?? {}),
        refreshClarificationContext,
    ]);

    if (!widgetsOpen || (!activeWindow && collapsedWorkWindows.length === 0)) {
        return null;
    }

    const activeWindowLayoutClass = activeWindow
        ? ({
            inline: 'ml-auto mr-5 mt-4 max-w-[420px]',
            panel: 'mx-1',
            takeover: 'mx-1 min-h-[calc(100vh-2rem)]',
        } satisfies Record<AiWorkWindow['mode'], string>)[activeWindow.mode]
        : '';

    const handleWorkWindowAction = (window: AiWorkWindow, action: AiWorkWindowAction) => {
        if (!action.enabled) {
            return;
        }

        switch (action.kind) {
            case 'use_workspace_field':
                void useWorkspaceFieldForClarification();
                return;
            case 'refresh_context':
                void refreshClarificationContext();
                return;
            case 'open_field_card': {
                const fieldRef = window.payload.fieldRef;
                if (!fieldRef) return;
                router.push(`/registry/fields/${fieldRef}`);
                return;
            }
            case 'focus_window':
                if (action.targetWindowId) {
                    restoreWorkWindow(action.targetWindowId);
                }
                return;
            case 'go_to_techmap':
            case 'open_route':
                if (action.targetRoute) {
                    router.push(action.targetRoute);
                }
                return;
            case 'open_entity':
                if (action.entityType === 'field' && action.entityId) {
                    router.push(`/registry/fields/${action.entityId}`);
                }
                return;
            case 'open_season_picker':
                void refreshClarificationContext();
                return;
        }
    };

    return (
        <div className="absolute inset-x-0 top-0 z-30">
            {activeWindow ? (
                <div className={activeWindowLayoutClass}>
                    {activeWindow.type === 'context_acquisition' ? (
                        <ContextAcquisitionWindow
                            window={activeWindow}
                            pendingClarification={pendingClarification}
                            sourceMessage={activeWindowSourceMessage}
                            onAction={(action) => {
                                handleWorkWindowAction(activeWindow, action);
                            }}
                            onCollapse={() => {
                                collapseWorkWindow(activeWindow.windowId);
                            }}
                            onClose={() => {
                                closeWorkWindow(activeWindow.windowId);
                            }}
                            onTogglePin={() => {
                                togglePinWorkWindow(activeWindow.windowId);
                            }}
                            onSetMode={(mode) => {
                                setWorkWindowMode(activeWindow.windowId, mode);
                            }}
                        />
                    ) : null}

                    {activeWindow.type === 'context_hint' ? (
                        <ContextHintWindow
                            window={activeWindow}
                            primaryWindowTitle={activeWindow.parentWindowId ? workWindowTitleById.get(activeWindow.parentWindowId) ?? null : null}
                            sourceMessage={activeWindowSourceMessage}
                            onAction={(action) => {
                                handleWorkWindowAction(activeWindow, action);
                            }}
                            onCollapse={() => {
                                collapseWorkWindow(activeWindow.windowId);
                            }}
                            onClose={() => {
                                closeWorkWindow(activeWindow.windowId);
                            }}
                            onTogglePin={() => {
                                togglePinWorkWindow(activeWindow.windowId);
                            }}
                        />
                    ) : null}

                    {activeWindow.type === 'structured_result' ? (
                        <StructuredResultWindow
                            window={activeWindow}
                            sourceMessage={activeWindowSourceMessage}
                            onAction={(action) => {
                                handleWorkWindowAction(activeWindow, action);
                            }}
                            onCollapse={() => {
                                collapseWorkWindow(activeWindow.windowId);
                            }}
                            onClose={() => {
                                closeWorkWindow(activeWindow.windowId);
                            }}
                            onTogglePin={() => {
                                togglePinWorkWindow(activeWindow.windowId);
                            }}
                            onSetMode={(mode) => {
                                setWorkWindowMode(activeWindow.windowId, mode);
                            }}
                        />
                    ) : null}

                    {activeWindow.type === 'related_signals' ? (
                        <RelatedSignalsWindow
                            window={activeWindow}
                            onAction={(action) => {
                                handleWorkWindowAction(activeWindow, action);
                            }}
                            onCollapse={() => {
                                collapseWorkWindow(activeWindow.windowId);
                            }}
                            onClose={() => {
                                closeWorkWindow(activeWindow.windowId);
                            }}
                            onTogglePin={() => {
                                togglePinWorkWindow(activeWindow.windowId);
                            }}
                        />
                    ) : null}

                    {activeWindow.type === 'comparison' ? (
                        <ComparisonWindow
                            window={activeWindow}
                            onAction={(action) => {
                                handleWorkWindowAction(activeWindow, action);
                            }}
                            onCollapse={() => {
                                collapseWorkWindow(activeWindow.windowId);
                            }}
                            onClose={() => {
                                closeWorkWindow(activeWindow.windowId);
                            }}
                            onTogglePin={() => {
                                togglePinWorkWindow(activeWindow.windowId);
                            }}
                        />
                    ) : null}
                </div>
            ) : null}
            <AiWindowStack
                windows={collapsedWorkWindows.slice(0, 4)}
                onRestore={(windowId) => {
                    restoreWorkWindow(windowId);
                }}
                onClose={(windowId) => {
                    closeWorkWindow(windowId);
                }}
            />
        </div>
    );
}

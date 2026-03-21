import type { AiSignalItem, AiWorkWindow } from '@/components/ai-chat/ai-work-window-types';

export type ChatSignalMessageLike = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    riskLevel?: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
};

export interface ResolveRaiChatResponseStateParams {
    currentWindows: AiWorkWindow[];
    incomingWindows: AiWorkWindow[] | null;
    requestedActiveWindowId: string | null;
    currentActiveWindowId: string | null;
    currentCollapsedWindowIds: string[];
    messages: ChatSignalMessageLike[];
    deriveSignalsFromWindows: boolean;
}

export interface ResolvedRaiChatResponseState {
    workWindows: AiWorkWindow[];
    activeWindowId: string | null;
    collapsedWindowIds: string[];
    signals: AiSignalItem[];
}

export function pickPreferredWorkWindow(windows: AiWorkWindow[]): AiWorkWindow | null {
    if (windows.length === 0) {
        return null;
    }

    return [...windows].sort((left, right) => {
        if (right.priority !== left.priority) {
            return right.priority - left.priority;
        }

        const modeWeight = { takeover: 3, panel: 2, inline: 1 };
        if (modeWeight[right.mode] !== modeWeight[left.mode]) {
            return modeWeight[right.mode] - modeWeight[left.mode];
        }

        const categoryWeight = { clarification: 4, analysis: 3, result: 2, signals: 1 };
        return categoryWeight[right.category] - categoryWeight[left.category];
    })[0] ?? null;
}

function deriveCollapsedWindowIds(
    windows: AiWorkWindow[],
    activeWindowId: string | null,
): string[] {
    if (windows.length === 0) {
        return [];
    }

    return windows
        .map((window) => window.windowId)
        .filter((id) => id !== activeWindowId);
}

function deriveSignalsFromWorkWindows(windows: AiWorkWindow[]): AiSignalItem[] {
    const signalWindows = windows.filter((window) => window.type === 'related_signals');
    if (signalWindows.length > 0) {
        return signalWindows
            .flatMap((window) => (window.payload.signalItems ?? []).map((item) => ({
                ...item,
                targetWindowId: item.targetWindowId ?? window.parentWindowId ?? window.windowId,
            })))
            .slice(0, 3);
    }

    const hintWindows = windows.filter((window) => window.type === 'context_hint');
    if (hintWindows.length > 0) {
        return hintWindows.slice(0, 3).map((window) => ({
            id: `${window.windowId}-signal`,
            tone: window.category === 'result' ? 'info' : 'warning',
            text: window.payload.summary,
            targetWindowId: window.parentWindowId ?? window.windowId,
            targetRoute: window.actions.find((action) => action.kind === 'open_route' || action.kind === 'go_to_techmap')?.targetRoute,
        }));
    }

    return [];
}

function deriveSignalsFromMessages(messages: ChatSignalMessageLike[]): AiSignalItem[] {
    return [...messages]
        .reverse()
        .filter((message) => message.role === 'assistant')
        .slice(0, 3)
        .map((message) => ({
            id: message.id,
            tone:
                message.riskLevel === 'R3' || message.riskLevel === 'R4'
                    ? 'critical'
                    : message.riskLevel === 'R2'
                        ? 'warning'
                        : 'info',
            text: message.content.replace(/\s+/g, ' ').trim().slice(0, 88),
        }));
}

export function computeChatSignals(
    windows: AiWorkWindow[],
    messages: ChatSignalMessageLike[],
    deriveSignalsFromWindows: boolean,
): AiSignalItem[] {
    if (deriveSignalsFromWindows) {
        const derivedFromWindows = deriveSignalsFromWorkWindows(windows);
        if (derivedFromWindows.length > 0) {
            return derivedFromWindows;
        }
    }

    return deriveSignalsFromMessages(messages);
}

function resolveResponseWorkWindows(
    currentWindows: AiWorkWindow[],
    incomingWindows: AiWorkWindow[] | null,
): AiWorkWindow[] {
    if (incomingWindows) {
        return incomingWindows;
    }

    return currentWindows.filter(
        (window) =>
            window.isPinned &&
            window.type !== 'context_acquisition' &&
            window.type !== 'context_hint',
    );
}

function resolveResponseActiveWindowId(
    nextWindows: AiWorkWindow[],
    requestedActiveWindowId: string | null,
    currentActiveWindowId: string | null,
): string | null {
    if (requestedActiveWindowId && nextWindows.some((window) => window.windowId === requestedActiveWindowId)) {
        return requestedActiveWindowId;
    }

    if (currentActiveWindowId && nextWindows.some((window) => window.windowId === currentActiveWindowId)) {
        return currentActiveWindowId;
    }

    return pickPreferredWorkWindow(nextWindows)?.windowId ?? null;
}

function resolveResponseCollapsedWindowIds(
    nextWindows: AiWorkWindow[],
    nextActiveWindowId: string | null,
    currentCollapsedWindowIds: string[],
    incomingWindows: AiWorkWindow[] | null,
): string[] {
    if (incomingWindows) {
        return deriveCollapsedWindowIds(nextWindows, nextActiveWindowId);
    }

    const nextWindowIds = new Set(nextWindows.map((window) => window.windowId));
    return currentCollapsedWindowIds.filter((id) => nextWindowIds.has(id));
}

export function resolveRaiChatResponseState(
    params: ResolveRaiChatResponseStateParams,
): ResolvedRaiChatResponseState {
    const workWindows = resolveResponseWorkWindows(
        params.currentWindows,
        params.incomingWindows,
    );
    const activeWindowId = resolveResponseActiveWindowId(
        workWindows,
        params.requestedActiveWindowId,
        params.currentActiveWindowId,
    );
    const collapsedWindowIds = resolveResponseCollapsedWindowIds(
        workWindows,
        activeWindowId,
        params.currentCollapsedWindowIds,
        params.incomingWindows,
    );
    const signals = computeChatSignals(
        workWindows,
        params.messages,
        params.deriveSignalsFromWindows,
    );

    return {
        workWindows,
        activeWindowId,
        collapsedWindowIds,
        signals,
    };
}

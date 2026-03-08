export type PendingClarificationKey =
    | 'fieldRef'
    | 'seasonRef'
    | 'seasonId'
    | 'planId';

export interface PendingClarificationItem {
    key: PendingClarificationKey;
    label: string;
    required: true;
    reason: string;
    sourcePriority: Array<'workspace' | 'record' | 'user'>;
    status: 'missing' | 'resolved';
    resolvedFrom?: 'workspace' | 'record' | 'user';
    value?: string;
}

export interface PendingClarificationState {
    active: boolean;
    windowId: string;
    agentRole: 'agronomist' | 'economist';
    intentId: 'tech_map_draft' | 'compute_plan_fact';
    originalUserMessage: string;
    collectedContext: {
        fieldRef?: string;
        seasonRef?: string;
        seasonId?: string;
        planId?: string;
    };
    missingKeys: PendingClarificationKey[];
    autoResume: true;
    items: PendingClarificationItem[];
}

export interface AiWorkWindowSectionItem {
    label: string;
    value: string;
    tone?: 'neutral' | 'positive' | 'warning' | 'critical';
}

export interface AiWorkWindowSection {
    id: string;
    title: string;
    items: AiWorkWindowSectionItem[];
}

export interface AiSignalItem {
    id: string;
    tone: 'critical' | 'warning' | 'info';
    text: string;
    targetWindowId?: string;
    targetRoute?: string;
}

export interface AiComparisonRow {
    id: string;
    label: string;
    values: string[];
    emphasis?: 'neutral' | 'best' | 'risk';
}

export interface AiWorkWindowAction {
    id: string;
    kind:
        | 'use_workspace_field'
        | 'open_field_card'
        | 'open_season_picker'
        | 'refresh_context'
        | 'focus_window'
        | 'go_to_techmap'
        | 'open_route'
        | 'open_entity';
    label: string;
    enabled: boolean;
    targetWindowId?: string;
    targetRoute?: string;
    entityType?: string;
    entityId?: string;
}

export interface AiWorkWindowPayload {
    intentId: 'tech_map_draft' | 'compute_plan_fact' | 'query_knowledge' | 'emit_alerts';
    summary: string;
    fieldRef?: string;
    seasonRef?: string;
    seasonId?: string;
    planId?: string;
    missingKeys: PendingClarificationKey[];
    resultText?: string;
    sections?: AiWorkWindowSection[];
    signalItems?: AiSignalItem[];
    columns?: string[];
    rows?: AiComparisonRow[];
}

export interface AiWorkWindow {
    windowId: string;
    originMessageId: string | null;
    agentRole: string;
    type:
        | 'context_acquisition'
        | 'context_hint'
        | 'structured_result'
        | 'related_signals'
        | 'comparison';
    parentWindowId?: string | null;
    relatedWindowIds?: string[];
    category: 'clarification' | 'result' | 'analysis' | 'signals';
    priority: number;
    mode: 'inline' | 'panel' | 'takeover';
    title: string;
    status: 'needs_user_input' | 'resolved' | 'completed' | 'informational';
    payload: AiWorkWindowPayload;
    actions: AiWorkWindowAction[];
    isPinned: boolean;
}

export function getWindowStatusLabel(status: AiWorkWindow['status']): string {
    switch (status) {
        case 'needs_user_input':
            return 'Нужно действие';
        case 'resolved':
            return 'Готово к продолжению';
        case 'completed':
            return 'Готово';
        case 'informational':
            return 'Информация';
    }
}

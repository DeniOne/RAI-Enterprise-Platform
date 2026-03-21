import type {
    AiSignalItem,
    AiWorkWindow,
    PendingClarificationItem,
    PendingClarificationKey,
    PendingClarificationState,
} from '@/components/ai-chat/ai-work-window-types';
import { mapLegacyWidgetsToWorkWindows } from '@/components/ai-chat/legacy-widget-window-mapper';

import { buildIdempotencyKey } from './api';
import type {
    BranchVerdict,
    RaiChatPendingClarificationDto,
    RaiChatPendingClarificationItemDto,
    RaiChatResponseDto,
    TraceForensicsBranchCompositionDto,
    TraceForensicsBranchResultDto,
    TraceForensicsBranchTrustAssessmentDto,
    UserFacingTrustSummaryBranchDto,
    UserFacingTrustSummaryDto,
} from './api';
import type { RaiChatWidget } from './ai-chat-widgets';

type ChatBranchResult = TraceForensicsBranchResultDto;
type ChatBranchTrustAssessment = TraceForensicsBranchTrustAssessmentDto;
type ChatBranchComposition = TraceForensicsBranchCompositionDto;
type PendingClarificationResponse = RaiChatPendingClarificationDto;

interface PendingClarificationResponseItem {
    key?: RaiChatPendingClarificationItemDto['key'];
    label?: RaiChatPendingClarificationItemDto['label'];
    required?: RaiChatPendingClarificationItemDto['required'];
    reason?: RaiChatPendingClarificationItemDto['reason'];
    sourcePriority?: RaiChatPendingClarificationItemDto['sourcePriority'];
    status?: RaiChatPendingClarificationItemDto['status'];
    resolvedFrom?: RaiChatPendingClarificationItemDto['resolvedFrom'];
    value?: RaiChatPendingClarificationItemDto['value'];
}

interface BranchTrustEntry {
    assessment: ChatBranchTrustAssessment;
    result?: ChatBranchResult;
    composition?: ChatBranchComposition;
    summary: string | null;
    disclosure: string[];
}

interface TrustWindowDerivation {
    trustSummary: ChatTrustSummary | null;
    workWindows: AiWorkWindow[];
}

export type ChatTrustBranch = UserFacingTrustSummaryBranchDto;
export type ChatTrustSummary = UserFacingTrustSummaryDto;

export interface AdaptRaiChatResponseParams {
    data: RaiChatResponseDto;
    requestedThreadId: string | null;
    originMessageId: string | null;
    fallbackOriginMessageId?: string | null;
    legacyWidgetMigrationEnabled: boolean;
}

export interface AdaptedRaiChatResponse {
    content: string;
    riskLevel: NonNullable<RaiChatResponseDto['riskLevel']> | 'R1';
    widgets: RaiChatWidget[];
    memoryUsed: NonNullable<RaiChatResponseDto['memoryUsed']>;
    memorySummary?: RaiChatResponseDto['memorySummary'];
    suggestedActions: NonNullable<RaiChatResponseDto['suggestedActions']>;
    trustSummary?: ChatTrustSummary;
    nextWorkWindows: AiWorkWindow[] | null;
    nextActiveWindowId: string | null;
}

const branchVerdictLabel: Record<BranchVerdict, string> = {
    VERIFIED: 'Подтверждено',
    PARTIAL: 'Частично подтверждено',
    UNVERIFIED: 'Неподтверждено',
    CONFLICTED: 'Есть конфликт',
    REJECTED: 'Отклонено',
};

const branchVerdictTone: Record<BranchVerdict, AiSignalItem['tone']> = {
    VERIFIED: 'info',
    PARTIAL: 'warning',
    UNVERIFIED: 'warning',
    CONFLICTED: 'critical',
    REJECTED: 'critical',
};

const branchVerdictSeverity: Record<BranchVerdict, number> = {
    CONFLICTED: 5,
    REJECTED: 4,
    UNVERIFIED: 3,
    PARTIAL: 2,
    VERIFIED: 1,
};

function isPendingClarificationKey(value: unknown): value is PendingClarificationKey {
    return value === 'fieldRef' || value === 'seasonRef' || value === 'seasonId' || value === 'planId';
}

function isSupportedClarificationIntentId(
    value: unknown,
): value is PendingClarificationState['intentId'] {
    return value === 'tech_map_draft' || value === 'compute_plan_fact';
}

function isSupportedClarificationAgentRole(
    value: unknown,
): value is PendingClarificationState['agentRole'] {
    return value === 'agronomist' || value === 'economist';
}

function isBranchVerdict(value: unknown): value is BranchVerdict {
    return value === 'VERIFIED'
        || value === 'PARTIAL'
        || value === 'UNVERIFIED'
        || value === 'CONFLICTED'
        || value === 'REJECTED';
}

function isTrustTone(value: unknown): value is UserFacingTrustSummaryDto['tone'] {
    return value === 'critical' || value === 'warning' || value === 'info';
}

function uniqueStrings(values: unknown[]): string[] {
    return [...new Set(
        values
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean),
    )];
}

function formatBranchCount(value: number): string {
    if (value === 1) {
        return '1 ветка';
    }
    if (value > 1 && value < 5) {
        return `${value} ветки`;
    }
    return `${value} веток`;
}

function buildTrustWindowId(prefix: string, parts: Array<string | null | undefined>): string {
    return buildIdempotencyKey(prefix, parts).replace(/[:]+/g, '-');
}

function hasCanonicalTrustWorkWindows(windows: AiWorkWindow[]): boolean {
    return windows.some((window) => window.payload.intentId === 'branch_trust_summary');
}

function pickPreferredWorkWindow(windows: AiWorkWindow[]): AiWorkWindow | null {
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

function normalizePendingClarificationItems(items: unknown): PendingClarificationItem[] {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item): PendingClarificationItem | null => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const candidate = item as PendingClarificationResponseItem;
            if (!isPendingClarificationKey(candidate.key)) {
                return null;
            }

            const normalizedSourcePriority = Array.isArray(candidate.sourcePriority)
                ? candidate.sourcePriority.filter(
                    (value): value is PendingClarificationItem['sourcePriority'][number] =>
                        value === 'workspace' || value === 'record' || value === 'user',
                )
                : [];

            return {
                key: candidate.key,
                label:
                    typeof candidate.label === 'string' && candidate.label.trim().length > 0
                        ? candidate.label.trim()
                        : candidate.key,
                required: true,
                reason:
                    typeof candidate.reason === 'string' && candidate.reason.trim().length > 0
                        ? candidate.reason.trim()
                        : candidate.key,
                sourcePriority: normalizedSourcePriority.length > 0 ? normalizedSourcePriority : ['workspace'],
                status: candidate.status === 'resolved' ? 'resolved' : 'missing',
                resolvedFrom:
                    candidate.resolvedFrom === 'workspace'
                    || candidate.resolvedFrom === 'record'
                    || candidate.resolvedFrom === 'user'
                        ? candidate.resolvedFrom
                        : undefined,
                value:
                    typeof candidate.value === 'string' && candidate.value.trim().length > 0
                        ? candidate.value.trim()
                        : undefined,
            };
        })
        .filter((item): item is PendingClarificationItem => item !== null);
}

function extractCollectedContext(
    items: PendingClarificationItem[],
): PendingClarificationState['collectedContext'] {
    return {
        fieldRef: items.find((item) => item.key === 'fieldRef')?.value,
        seasonRef: items.find((item) => item.key === 'seasonRef')?.value,
        seasonId: items.find((item) => item.key === 'seasonId')?.value,
        planId: items.find((item) => item.key === 'planId')?.value,
    };
}

function normalizeBranchResults(value: unknown): ChatBranchResult[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is ChatBranchResult => {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const candidate = item as Partial<ChatBranchResult>;
        return typeof candidate.branch_id === 'string'
            && typeof candidate.source_agent === 'string'
            && typeof candidate.domain === 'string';
    });
}

function normalizeBranchTrustAssessments(value: unknown): ChatBranchTrustAssessment[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is ChatBranchTrustAssessment => {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const candidate = item as Partial<ChatBranchTrustAssessment>;
        return typeof candidate.branch_id === 'string'
            && typeof candidate.source_agent === 'string'
            && isBranchVerdict(candidate.verdict);
    });
}

function normalizeBranchCompositions(value: unknown): ChatBranchComposition[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is ChatBranchComposition => {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const candidate = item as Partial<ChatBranchComposition>;
        return typeof candidate.branch_id === 'string' && isBranchVerdict(candidate.verdict);
    });
}

function buildBranchTrustEntries(data: RaiChatResponseDto): BranchTrustEntry[] {
    const resultsById = new Map(
        normalizeBranchResults(data.branchResults).map((result) => [result.branch_id, result]),
    );
    const compositionsById = new Map(
        normalizeBranchCompositions(data.branchCompositions).map((composition) => [composition.branch_id, composition]),
    );

    return normalizeBranchTrustAssessments(data.branchTrustAssessments).map((assessment) => {
        const result = resultsById.get(assessment.branch_id);
        const composition = compositionsById.get(assessment.branch_id);
        const summary = typeof composition?.summary === 'string' && composition.summary.trim().length > 0
            ? composition.summary.trim()
            : typeof result?.summary === 'string' && result.summary.trim().length > 0
                ? result.summary.trim()
                : null;

        return {
            assessment,
            result,
            composition,
            summary,
            disclosure: uniqueStrings([
                ...(Array.isArray(composition?.disclosure) ? composition.disclosure : []),
                ...(Array.isArray(assessment.reasons) ? assessment.reasons : []),
            ]),
        };
    });
}

function resolveOverallTrustVerdict(entries: BranchTrustEntry[]): BranchVerdict {
    const counts = entries.reduce((acc, entry) => {
        acc[entry.assessment.verdict] += 1;
        return acc;
    }, {
        VERIFIED: 0,
        PARTIAL: 0,
        UNVERIFIED: 0,
        CONFLICTED: 0,
        REJECTED: 0,
    } satisfies Record<BranchVerdict, number>);

    const hasVerified = counts.VERIFIED > 0;
    const hasMixedCoverage = counts.PARTIAL + counts.UNVERIFIED + counts.REJECTED > 0;

    if (counts.CONFLICTED > 0) {
        return 'CONFLICTED';
    }
    if (hasVerified && hasMixedCoverage) {
        return 'PARTIAL';
    }
    if (counts.PARTIAL > 0) {
        return 'PARTIAL';
    }
    if (counts.REJECTED > 0 && counts.VERIFIED === 0) {
        return 'REJECTED';
    }
    if (counts.UNVERIFIED > 0) {
        return 'UNVERIFIED';
    }
    return 'VERIFIED';
}

function buildTrustSummary(entries: BranchTrustEntry[]): ChatTrustSummary | null {
    if (entries.length === 0) {
        return null;
    }

    const verdict = resolveOverallTrustVerdict(entries);
    const verifiedCount = entries.filter((entry) => entry.assessment.verdict === 'VERIFIED').length;
    const partialCount = entries.filter((entry) => entry.assessment.verdict === 'PARTIAL').length;
    const unverifiedCount = entries.filter((entry) => entry.assessment.verdict === 'UNVERIFIED').length;
    const conflictedCount = entries.filter((entry) => entry.assessment.verdict === 'CONFLICTED').length;
    const rejectedCount = entries.filter((entry) => entry.assessment.verdict === 'REJECTED').length;
    const crossCheckCount = entries.filter((entry) => entry.assessment.requires_cross_check).length;
    const disclosure = uniqueStrings(entries.flatMap((entry) => entry.disclosure)).slice(0, 4);
    const branchCount = entries.length;

    let summary = `Проверено ${formatBranchCount(branchCount)}.`;
    switch (verdict) {
        case 'VERIFIED':
            summary = `Ответ подтверждён по ${formatBranchCount(verifiedCount)} без неподтверждённых веток.`;
            break;
        case 'PARTIAL':
            summary = 'Подтверждённые ветки есть, но часть ответа требует явного указания ограничений.';
            break;
        case 'UNVERIFIED':
            summary = 'Недостаточно подтверждённых веток, чтобы считать ответ установленным фактом.';
            break;
        case 'CONFLICTED':
            summary = 'Между ветками найдено расхождение, поэтому ответ должен оставаться с честным раскрытием конфликта.';
            break;
        case 'REJECTED':
            summary = 'Ветки ответа отклонены проверкой и не должны выдаваться как подтверждённый факт.';
            break;
    }

    return {
        verdict,
        label: branchVerdictLabel[verdict],
        tone: branchVerdictTone[verdict],
        summary,
        disclosure,
        branchCount,
        verifiedCount,
        partialCount,
        unverifiedCount,
        conflictedCount,
        rejectedCount,
        crossCheckCount,
        branches: [...entries]
            .sort((left, right) => {
                const verdictDiff =
                    branchVerdictSeverity[right.assessment.verdict]
                    - branchVerdictSeverity[left.assessment.verdict];
                if (verdictDiff !== 0) {
                    return verdictDiff;
                }
                return right.assessment.score - left.assessment.score;
            })
            .slice(0, 4)
            .map((entry) => ({
                branchId: entry.assessment.branch_id,
                sourceAgent: entry.assessment.source_agent,
                verdict: entry.assessment.verdict,
                label: branchVerdictLabel[entry.assessment.verdict],
                summary: entry.summary ?? undefined,
                disclosure: entry.disclosure,
            })),
    };
}

function buildTrustWindows(params: {
    data: RaiChatResponseDto;
    originMessageId: string | null;
    existingWorkWindows: AiWorkWindow[];
    trustSummary?: ChatTrustSummary | null;
}): TrustWindowDerivation {
    const trustEntries = buildBranchTrustEntries(params.data);
    const trustSummary = params.trustSummary ?? buildTrustSummary(trustEntries);
    if (!trustSummary) {
        return {
            trustSummary: null,
            workWindows: params.existingWorkWindows,
        };
    }

    if (hasCanonicalTrustWorkWindows(params.existingWorkWindows)) {
        return {
            trustSummary,
            workWindows: params.existingWorkWindows,
        };
    }

    if (trustEntries.length === 0) {
        return {
            trustSummary,
            workWindows: params.existingWorkWindows,
        };
    }

    const baseWindowId = buildTrustWindowId('branch-trust', [
        params.originMessageId ?? null,
        params.data.threadId ?? null,
        String(trustSummary.branchCount),
    ]);
    const trustWindowId = `${baseWindowId}-summary`;
    const signalsWindowId = `${baseWindowId}-signals`;
    const supportedCount = trustSummary.verifiedCount + trustSummary.partialCount;
    const unresolvedCount = trustSummary.unverifiedCount + trustSummary.conflictedCount + trustSummary.rejectedCount;
    const trustSignalItems: AiSignalItem[] = trustSummary.branches
        .filter((branch) => branch.verdict !== 'VERIFIED')
        .slice(0, 3)
        .map((branch) => ({
            id: `${signalsWindowId}-${branch.branchId}`,
            tone: branchVerdictTone[branch.verdict],
            text: `${branch.sourceAgent}: ${branch.summary ?? branch.label}${branch.disclosure[0] ? ` Ограничение: ${branch.disclosure[0]}.` : ''}`,
            targetWindowId: trustWindowId,
        }));

    if (trustSignalItems.length === 0) {
        trustSignalItems.push({
            id: `${signalsWindowId}-verified`,
            tone: 'info',
            text: `Ответ подтверждён по ${formatBranchCount(trustSummary.verifiedCount)}.`,
            targetWindowId: trustWindowId,
        });
    }

    const trustWindow: AiWorkWindow = {
        windowId: trustWindowId,
        originMessageId: params.originMessageId,
        agentRole: 'supervisor',
        type: 'structured_result',
        parentWindowId: null,
        relatedWindowIds: [signalsWindowId],
        category: 'analysis',
        priority:
            trustSummary.verdict === 'CONFLICTED' || trustSummary.verdict === 'REJECTED'
                ? 74
                : trustSummary.verdict === 'UNVERIFIED'
                    ? 68
                    : trustSummary.verdict === 'PARTIAL'
                        ? 52
                        : 26,
        mode:
            trustSummary.verdict === 'CONFLICTED' || trustSummary.verdict === 'UNVERIFIED' || trustSummary.verdict === 'REJECTED'
                ? 'panel'
                : 'inline',
        title: 'Статус подтверждения ответа',
        status: 'informational',
        payload: {
            intentId: 'branch_trust_summary',
            summary: trustSummary.summary,
            missingKeys: [],
            sections: [
                {
                    id: 'trust-overview',
                    title: 'Итог проверки',
                    items: [
                        { label: 'Вердикт', value: trustSummary.label },
                        { label: 'Подтверждено', value: `${supportedCount} из ${trustSummary.branchCount}` },
                        { label: 'Селективная перепроверка', value: trustSummary.crossCheckCount > 0 ? `${trustSummary.crossCheckCount}` : 'не потребовалась' },
                    ],
                },
                {
                    id: 'trust-coverage',
                    title: 'Покрытие веток',
                    items: [
                        { label: 'Подтверждено', value: `${trustSummary.verifiedCount}` },
                        { label: 'Частично', value: `${trustSummary.partialCount}` },
                        { label: 'Неподтверждено или отклонено', value: `${unresolvedCount}` },
                    ],
                },
                ...(trustSummary.disclosure.length > 0
                    ? [{
                        id: 'trust-limitations',
                        title: 'Ограничения',
                        items: trustSummary.disclosure.map((item, index) => ({
                            label: `Ограничение ${index + 1}`,
                            value: item,
                        })),
                    }]
                    : []),
                {
                    id: 'trust-branches',
                    title: 'По веткам',
                    items: trustSummary.branches.map((branch) => ({
                        label: `${branch.sourceAgent} · ${branch.label}`,
                        value: branch.summary
                            ? `${branch.summary}${branch.disclosure[0] ? ` Ограничение: ${branch.disclosure[0]}.` : ''}`
                            : branch.disclosure[0] ?? 'Сводка ветки недоступна.',
                    })),
                },
            ],
        },
        actions: [],
        isPinned: false,
    };

    const trustSignalsWindow: AiWorkWindow = {
        windowId: signalsWindowId,
        originMessageId: params.originMessageId,
        agentRole: 'supervisor',
        type: 'related_signals',
        parentWindowId: trustWindowId,
        relatedWindowIds: [trustWindowId],
        category: 'signals',
        priority: Math.max(18, trustWindow.priority - 8),
        mode: 'inline',
        title: 'Сигналы подтверждения',
        status: 'informational',
        payload: {
            intentId: 'branch_trust_summary',
            summary: 'Что контур доверия зафиксировал в этом ответе.',
            missingKeys: [],
            signalItems: trustSignalItems,
        },
        actions: [
            {
                id: `${signalsWindowId}-focus-summary`,
                kind: 'focus_window',
                label: 'Открыть статус подтверждения',
                enabled: true,
                targetWindowId: trustWindowId,
            },
        ],
        isPinned: false,
    };

    return {
        trustSummary,
        workWindows: [...params.existingWorkWindows, trustWindow, trustSignalsWindow],
    };
}

function normalizeTrustSummaryBranch(
    value: UserFacingTrustSummaryBranchDto | null | undefined,
): ChatTrustBranch | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as Partial<UserFacingTrustSummaryBranchDto>;
    if (
        typeof candidate.branchId !== 'string'
        || typeof candidate.sourceAgent !== 'string'
        || !isBranchVerdict(candidate.verdict)
        || typeof candidate.label !== 'string'
        || !Array.isArray(candidate.disclosure)
    ) {
        return null;
    }

    return {
        branchId: candidate.branchId,
        sourceAgent: candidate.sourceAgent,
        verdict: candidate.verdict,
        label: candidate.label,
        summary:
            typeof candidate.summary === 'string' && candidate.summary.trim().length > 0
                ? candidate.summary.trim()
                : undefined,
        disclosure: uniqueStrings(candidate.disclosure),
    };
}

function normalizeTrustSummary(
    value: RaiChatResponseDto['trustSummary'],
): ChatTrustSummary | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as Partial<UserFacingTrustSummaryDto>;
    if (
        !isBranchVerdict(candidate.verdict)
        || typeof candidate.label !== 'string'
        || !isTrustTone(candidate.tone)
        || typeof candidate.summary !== 'string'
        || !Array.isArray(candidate.disclosure)
        || typeof candidate.branchCount !== 'number'
        || typeof candidate.verifiedCount !== 'number'
        || typeof candidate.partialCount !== 'number'
        || typeof candidate.unverifiedCount !== 'number'
        || typeof candidate.conflictedCount !== 'number'
        || typeof candidate.rejectedCount !== 'number'
        || typeof candidate.crossCheckCount !== 'number'
        || !Array.isArray(candidate.branches)
    ) {
        return null;
    }

    return {
        verdict: candidate.verdict,
        label: candidate.label,
        tone: candidate.tone,
        summary: candidate.summary.trim(),
        disclosure: uniqueStrings(candidate.disclosure),
        branchCount: candidate.branchCount,
        verifiedCount: candidate.verifiedCount,
        partialCount: candidate.partialCount,
        unverifiedCount: candidate.unverifiedCount,
        conflictedCount: candidate.conflictedCount,
        rejectedCount: candidate.rejectedCount,
        crossCheckCount: candidate.crossCheckCount,
        branches: candidate.branches
            .map((branch) => normalizeTrustSummaryBranch(branch))
            .filter((branch): branch is ChatTrustBranch => branch !== null),
    };
}

export function adaptRaiChatResponseForStore(
    params: AdaptRaiChatResponseParams,
): AdaptedRaiChatResponse {
    const resolvedOriginMessageId = params.originMessageId ?? params.fallbackOriginMessageId ?? null;
    const rawWorkWindows = Array.isArray(params.data.workWindows)
        ? params.data.workWindows
        : null;
    const migratedWorkWindows =
        !rawWorkWindows?.length &&
        params.legacyWidgetMigrationEnabled &&
        Array.isArray(params.data.widgets) &&
        params.data.widgets.length > 0
            ? mapLegacyWidgetsToWorkWindows({
                widgets: params.data.widgets,
                baseWindowId: `win-legacy-${params.data.threadId ?? params.requestedThreadId ?? 'new'}`,
                originMessageId: resolvedOriginMessageId,
                agentRole: params.data.agentRole ?? 'knowledge',
                summary: params.data.text,
            })
            : null;
    const baseWorkWindows = (rawWorkWindows ?? migratedWorkWindows)?.map((window) => ({
        ...window,
        originMessageId:
            window.originMessageId ??
            resolvedOriginMessageId ??
            null,
    })) ?? [];
    const normalizedTrustSummary = normalizeTrustSummary(params.data.trustSummary);
    const { trustSummary, workWindows: trustAwareWorkWindows } = buildTrustWindows({
        data: params.data,
        originMessageId: resolvedOriginMessageId,
        existingWorkWindows: baseWorkWindows,
        trustSummary: normalizedTrustSummary,
    });
    const nextWorkWindows = trustAwareWorkWindows.length > 0
        ? trustAwareWorkWindows
        : null;
    const nextPreferredWindow = nextWorkWindows ? pickPreferredWorkWindow(nextWorkWindows) : null;

    return {
        content: params.data.text || 'Ответ не получен',
        riskLevel: params.data.riskLevel || 'R1',
        widgets: Array.isArray(params.data.widgets) ? params.data.widgets : [],
        memoryUsed: Array.isArray(params.data.memoryUsed) ? params.data.memoryUsed : [],
        memorySummary:
            params.data.memorySummary && typeof params.data.memorySummary === 'object'
                ? params.data.memorySummary
                : undefined,
        suggestedActions: Array.isArray(params.data.suggestedActions)
            ? params.data.suggestedActions.slice(0, 3)
            : [],
        trustSummary: trustSummary ?? undefined,
        nextWorkWindows,
        nextActiveWindowId: params.data.activeWindowId ?? nextPreferredWindow?.windowId ?? null,
    };
}

export function hydratePendingClarificationState(params: {
    data: RaiChatResponseDto;
    fallbackOriginalUserMessage: string;
    workWindows: AiWorkWindow[];
}): PendingClarificationState | null {
    const pending = params.data.pendingClarification as PendingClarificationResponse | null | undefined;
    if (!pending) {
        return null;
    }
    if (!isSupportedClarificationAgentRole(pending.agentRole) || !isSupportedClarificationIntentId(pending.intentId)) {
        return null;
    }

    const items = normalizePendingClarificationItems(pending.items);
    const collectedContext = extractCollectedContext(items);
    const primaryWindow = params.workWindows.find((window) => window.type === 'context_acquisition')
        ?? params.workWindows[0]
        ?? null;
    const missingKeysFromWindow = Array.isArray(primaryWindow?.payload?.missingKeys)
        ? primaryWindow.payload.missingKeys.filter(isPendingClarificationKey)
        : [];
    const missingKeys = missingKeysFromWindow.length > 0
        ? missingKeysFromWindow
        : items
            .filter((item) => item.status !== 'resolved' || !collectedContext[item.key])
            .map((item) => item.key);

    return {
        active: true,
        windowId: params.data.activeWindowId ?? primaryWindow?.windowId ?? 'clarification-window',
        agentRole: pending.agentRole,
        intentId: pending.intentId,
        originalUserMessage: params.fallbackOriginalUserMessage,
        collectedContext,
        missingKeys,
        autoResume: true,
        items,
    };
}

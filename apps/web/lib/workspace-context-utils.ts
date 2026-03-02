import type { SelectedRowSummary, WorkspaceEntityRef } from '@/shared/contracts/workspace-context';

function clamp(value: string | undefined, limit: number): string | undefined {
    if (!value) return undefined;
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (!normalized) return undefined;
    return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

export function buildWorkspaceSummary(input: {
    kind: string;
    id: string;
    title: string;
    subtitle?: string;
    status?: string;
}): SelectedRowSummary {
    return {
        kind: clamp(input.kind, 64) ?? 'unknown',
        id: clamp(input.id, 128) ?? 'unknown',
        title: clamp(input.title, 160) ?? 'Без названия',
        subtitle: clamp(input.subtitle, 240),
        status: clamp(input.status, 64),
    };
}

export function buildWorkspaceRef(kind: WorkspaceEntityRef['kind'], id: string): WorkspaceEntityRef {
    return {
        kind,
        id: clamp(id, 128) ?? 'unknown',
    };
}

import { create } from 'zustand';
import {
    SelectedRowSummary,
    SelectedRowSummarySchema,
    WorkspaceContext,
    WorkspaceEntityRef,
    WorkspaceContextSchema,
    WorkspaceEntityRefSchema,
} from '@/shared/contracts/workspace-context';

interface WorkspaceContextStore {
    context: WorkspaceContext;

    // Actions
    setRoute: (route: string) => void;
    setRouteAndReset: (route: string) => void;
    setActiveEntityRefs: (refs: WorkspaceEntityRef[]) => void;
    setFilters: (filters: Record<string, string | number | boolean | null>) => void;
    setSelectedRowSummary: (summary: SelectedRowSummary | undefined) => void;
    setLastUserAction: (action: string) => void;

    /**
     * Сброс всех полей, кроме роута.
     * Вызывается при навигации, чтобы "страничные" данные не висели на новой странице.
     */
    resetPageContext: () => void;
}

const INITIAL_CONTEXT: WorkspaceContext = {
    route: '/',
};

const DEV_WARN_PREFIX = '[workspace-context-load-rule]';

function warnValidation(message: string, details?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(DEV_WARN_PREFIX, message, details);
    }
}

function truncateText(value: string, limit: number): string {
    return value.length <= limit ? value : value.slice(0, limit);
}

function sanitizeActiveEntityRefs(refs: WorkspaceEntityRef[]): WorkspaceEntityRef[] | null {
    const truncatedRefs = refs.slice(0, 10);
    const parsed = WorkspaceEntityRefSchema.array().max(10).safeParse(truncatedRefs);

    if (!parsed.success) {
        warnValidation('activeEntityRefs rejected', parsed.error.flatten());
        return null;
    }

    return parsed.data;
}

function isFlatFilterValue(value: unknown): value is string | number | boolean | null {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    );
}

function sanitizeFilters(
    filters: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> | undefined | null {
    const entries = Object.entries(filters as Record<string, unknown>);
    const nextFilters: Record<string, string | number | boolean | null> = {};

    for (const [key, value] of entries) {
        if (!isFlatFilterValue(value)) {
            warnValidation('filters rejected: nested values are forbidden', { key, value });
            return null;
        }

        nextFilters[key] = value;
    }

    const parsed = WorkspaceContextSchema.shape.filters.safeParse(nextFilters);
    if (!parsed.success) {
        warnValidation('filters rejected', parsed.error.flatten());
        return null;
    }

    return parsed.data;
}

function sanitizeSelectedRowSummary(
    summary: SelectedRowSummary | undefined,
): SelectedRowSummary | undefined | null {
    if (!summary) {
        return undefined;
    }

    const candidate = {
        ...summary,
        title: truncateText(summary.title, 160),
        subtitle: summary.subtitle ? truncateText(summary.subtitle, 240) : undefined,
    };

    const parsed = SelectedRowSummarySchema.safeParse(candidate);
    if (!parsed.success) {
        warnValidation('selectedRowSummary rejected', parsed.error.flatten());
        return null;
    }

    return parsed.data;
}

function sanitizeLastUserAction(action: string): string | undefined | null {
    const parsed = WorkspaceContextSchema.shape.lastUserAction.safeParse(
        truncateText(action, 200),
    );

    if (!parsed.success) {
        warnValidation('lastUserAction rejected', parsed.error.flatten());
        return null;
    }

    return parsed.data;
}

export const useWorkspaceContextStore = create<WorkspaceContextStore>((set) => ({
    context: INITIAL_CONTEXT,

    setRoute: (route) => set((state) => ({
        context: { ...state.context, route }
    })),

    setRouteAndReset: (route) => set(() => ({
        context: { route }
    })),

    setActiveEntityRefs: (refs) => set((state) => {
        const sanitizedRefs = sanitizeActiveEntityRefs(refs);
        if (sanitizedRefs === null) {
            return state;
        }

        return {
            context: { ...state.context, activeEntityRefs: sanitizedRefs }
        };
    }),

    setFilters: (filters) => set((state) => {
        const sanitizedFilters = sanitizeFilters(filters);
        if (sanitizedFilters === null) {
            return state;
        }

        return {
            context: { ...state.context, filters: sanitizedFilters }
        };
    }),

    setSelectedRowSummary: (summary) => set((state) => {
        const sanitizedSummary = sanitizeSelectedRowSummary(summary);
        if (sanitizedSummary === null) {
            return state;
        }

        return {
            context: { ...state.context, selectedRowSummary: sanitizedSummary }
        };
    }),

    setLastUserAction: (action) => set((state) => {
        const sanitizedAction = sanitizeLastUserAction(action);
        if (sanitizedAction === null) {
            return state;
        }

        return {
            context: { ...state.context, lastUserAction: sanitizedAction }
        };
    }),

    resetPageContext: () => set((state) => ({
        context: { route: state.context.route }
    })),
}));

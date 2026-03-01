import { z } from 'zod';

export const WorkspaceEntityRefSchema = z.object({
    kind: z.enum(['farm', 'field', 'party', 'techmap', 'task']),
    id: z.string().max(128),
});

export const SelectedRowSummarySchema = z.object({
    kind: z.string().max(64),
    id: z.string().max(128),
    title: z.string().max(160),
    subtitle: z.string().max(240).optional(),
    status: z.string().max(64).optional(),
});

export const WorkspaceContextSchema = z.object({
    route: z.string().max(256),
    activeEntityRefs: z.array(WorkspaceEntityRefSchema).max(10).optional(),
    filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    selectedRowSummary: SelectedRowSummarySchema.optional(),
    lastUserAction: z.string().max(200).optional(),
});

export type WorkspaceEntityRef = z.infer<typeof WorkspaceEntityRefSchema>;
export type SelectedRowSummary = z.infer<typeof SelectedRowSummarySchema>;
export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;

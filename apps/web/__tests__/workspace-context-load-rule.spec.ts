import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

describe('workspace-context load rule', () => {
    beforeEach(() => {
        useWorkspaceContextStore.setState({
            context: { route: '/consulting/yield' },
        });
    });

    it('обрезает title до 160 символов', () => {
        const longTitle = 'T'.repeat(500);

        useWorkspaceContextStore.getState().setSelectedRowSummary({
            kind: 'techmap',
            id: 'tm-1',
            title: longTitle,
            subtitle: 'subtitle',
            status: 'active',
        });

        expect(useWorkspaceContextStore.getState().context.selectedRowSummary).toEqual(
            expect.objectContaining({
                title: 'T'.repeat(160),
            }),
        );
    });

    it('не принимает вложенный объект в filters', () => {
        useWorkspaceContextStore.getState().setFilters({ severity: 'warning' });

        useWorkspaceContextStore.getState().setFilters({
            severity: 'critical',
            nested: { heavy: true } as unknown as never,
        });

        expect(useWorkspaceContextStore.getState().context.filters).toEqual({
            severity: 'warning',
        });
    });

    it('усекает activeEntityRefs до первых 10', () => {
        const refs = Array.from({ length: 12 }, (_, index) => ({
            kind: 'field' as const,
            id: `field-${index + 1}`,
        }));

        useWorkspaceContextStore.getState().setActiveEntityRefs(refs);

        expect(useWorkspaceContextStore.getState().context.activeEntityRefs).toHaveLength(10);
        expect(useWorkspaceContextStore.getState().context.activeEntityRefs).toEqual(refs.slice(0, 10));
    });
});

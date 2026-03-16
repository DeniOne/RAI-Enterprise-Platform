import { pushRouteWithHardFallback } from '@/components/ai-chat/navigation-fallback';

describe('pushRouteWithHardFallback', () => {
    it('calls router.push for a non-empty route', () => {
        const push = jest.fn();
        pushRouteWithHardFallback({ push }, '/consulting/crm');
        expect(push).toHaveBeenCalledWith('/consulting/crm');
    });

    it('ignores empty route values', () => {
        const push = jest.fn();
        pushRouteWithHardFallback({ push }, '   ');
        pushRouteWithHardFallback({ push }, undefined);
        expect(push).not.toHaveBeenCalled();
    });

    it('does not force hard navigation in test environment', () => {
        const push = jest.fn();
        const timeoutSpy = jest.spyOn(window, 'setTimeout');

        pushRouteWithHardFallback({ push }, '/consulting/crm');

        expect(push).toHaveBeenCalledWith('/consulting/crm');
        expect(timeoutSpy).not.toHaveBeenCalled();
        timeoutSpy.mockRestore();
    });
});

import { getVisibleNavigation } from '@/lib/consulting/navigation-policy';

describe('Commerce navigation contract', () => {
    it('places Commerce between Crop and Strategy with canonical subroutes', () => {
        const nav = getVisibleNavigation('CEO');
        const ids = nav.map((item) => item.id);

        const cropIndex = ids.indexOf('crop_dashboard');
        const commerceIndex = ids.indexOf('commerce');
        const strategyIndex = ids.indexOf('strategy');

        expect(cropIndex).toBeGreaterThanOrEqual(0);
        expect(commerceIndex).toBeGreaterThan(cropIndex);
        expect(strategyIndex).toBeGreaterThan(commerceIndex);

        const commerce = nav.find((item) => item.id === 'commerce');
        expect(commerce?.subItems?.map((item) => item.path)).toEqual([
            '/commerce/contracts',
            '/commerce/fulfillment',
            '/commerce/invoices',
            '/commerce/payments',
        ]);
    });
});


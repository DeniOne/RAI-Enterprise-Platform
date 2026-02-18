import { Test, TestingModule } from '@nestjs/testing';
import { ConstraintPropagator } from './constraint-propagator';

describe('ConstraintPropagator', () => {
    let propagator: ConstraintPropagator;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConstraintPropagator],
        }).compile();

        propagator = module.get<ConstraintPropagator>(ConstraintPropagator);
    });

    it('должен прокидывать ограничения в черновик (I21)', () => {
        const draft: any = { propagatedConstraints: [] };
        const constraints: any[] = [
            { type: 'TIMING', field: 'start', operator: 'GT', value: 10, message: 'Too early' }
        ];

        const result = propagator.propagate(draft, constraints);

        expect(result.propagatedConstraints).toHaveLength(1);
        expect(result.propagatedConstraints[0].type).toBe('TIMING');
    });

    it('должен возвращать новый объект (или модифицированный по ссылке, но мы проверяем результат)', () => {
        const draft: any = { propagatedConstraints: [] };
        const result = propagator.propagate(draft, []);
        expect(result).not.toBe(draft); // Возвращается НОВАЯ копия (immutability)
        expect(result.propagatedConstraints).toEqual([]);
    });
});

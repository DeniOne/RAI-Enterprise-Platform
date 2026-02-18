import { Test, TestingModule } from '@nestjs/testing';
import { SeedManager, SeedDerivationError } from './seed-manager';

/**
 * SeedManager Unit Tests
 * 
 * Test Coverage:
 * - SEED-01: Deterministic derivation from canonical params
 * - SEED-02: No random fallback (throws on empty input)
 * - SEED-03: Explicit seed validation (range and format)
 * - SEED-04: Resolve policy (explicit vs computed)
 * - SEED-05: PRNG sequence determinism (mulberry32)
 */
describe('SeedManager', () => {
    let manager: SeedManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SeedManager],
        }).compile();

        manager = module.get<SeedManager>(SeedManager);
    });

    describe('SEED-01: Deterministic Derivation', () => {
        it('одинаковый input → одинаковый seed string', () => {
            const input = '{"a":1,"b":2}';
            const seed1 = manager.computeSeed(input);
            const seed2 = manager.computeSeed(input);

            expect(seed1).toBe(seed2);
            expect(typeof seed1).toBe('string');
        });

        it('результат должен быть валидным uint32 в строковом виде', () => {
            const input = 'random-payload-for-testing';
            const seed = manager.computeSeed(input);
            const numeric = parseInt(seed, 10);

            expect(numeric).toBeGreaterThanOrEqual(0);
            expect(numeric).toBeLessThanOrEqual(0xFFFFFFFF);
        });

        it('разный input → чаще всего разный seed (SHA-256)', () => {
            const seed1 = manager.computeSeed('input1');
            const seed2 = manager.computeSeed('input2');

            expect(seed1).not.toBe(seed2);
        });
    });

    describe('SEED-02: No Random Fallback', () => {
        it('пустая строка → throw SeedDerivationError', () => {
            expect(() => manager.computeSeed('')).toThrow(SeedDerivationError);
            expect(() => manager.computeSeed('  ')).toThrow(/не может быть пустым/);
        });

        it('null/undefined в resolveSeed без explicitSeed → throw', () => {
            expect(() => manager.resolveSeed('')).toThrow(SeedDerivationError);
        });
    });

    describe('SEED-03: Explicit Seed Validation', () => {
        it('валидный uint32 string → возвращает как есть', () => {
            expect(manager.acceptExplicitSeed('12345')).toBe('12345');
            expect(manager.acceptExplicitSeed('0')).toBe('0');
            expect(manager.acceptExplicitSeed('4294967295')).toBe('4294967295');
        });

        it('не-числовая строка → throw SeedDerivationError', () => {
            expect(() => manager.acceptExplicitSeed('abc')).toThrow(SeedDerivationError);
        });

        it('отрицательное число → throw SeedDerivationError', () => {
            expect(() => manager.acceptExplicitSeed('-1')).toThrow(SeedDerivationError);
        });

        it('число > 2^32-1 → throw SeedDerivationError', () => {
            expect(() => manager.acceptExplicitSeed('4294967296')).toThrow(SeedDerivationError);
        });

        it('пустая строка → throw SeedDerivationError', () => {
            expect(() => manager.acceptExplicitSeed('')).toThrow(SeedDerivationError);
        });
    });

    describe('SEED-04: Resolve Policy', () => {
        it('если есть explicitSeed → использует его', () => {
            const canonical = '{"test":true}';
            const explicit = 999;
            const seed = manager.resolveSeed(canonical, explicit);

            expect(seed).toBe('999');
        });

        it('если нет explicitSeed → вычисляет из каноникализации', () => {
            const canonical = '{"test":true}';
            const computed = manager.computeSeed(canonical);
            const resolved = manager.resolveSeed(canonical);

            expect(resolved).toBe(computed);
        });
    });

    describe('SEED-05: PRNG Sequence Determinism', () => {
        it('одинаковый seed → одинаковая последовательность [0, 1)', () => {
            const seed = '123456789';
            const seq1 = manager.generateSequence(seed, 5);
            const seq2 = manager.generateSequence(seed, 5);

            expect(seq1).toEqual(seq2);
            expect(seq1.length).toBe(5);
            seq1.forEach(n => {
                expect(n).toBeGreaterThanOrEqual(0);
                expect(n).toBeLessThan(1);
            });
        });

        it('разный seed → разная последовательность', () => {
            const seq1 = manager.generateSequence('1', 5);
            const seq2 = manager.generateSequence('2', 5);

            expect(seq1).not.toEqual(seq2);
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CanonicalSorter, CanonicalSortError } from './canonical-sorter';

/**
 * CanonicalSorter Unit Tests
 * 
 * Test Coverage:
 * - CANON-01: Idempotency (canonical(canonical(x)) === canonical(x))
 * - CANON-02: Order independence (ключи в любом порядке → одинаковый результат)
 * - CANON-03: Deep recursion (вложенные объекты и массивы)
 * - CANON-04: Edge cases (null, undefined, Date, Infinity, NaN)
 * - CANON-05: String normalization (NFC)
 * - CANON-06: Float precision (toFixed(6))
 */
describe('CanonicalSorter', () => {
    let sorter: CanonicalSorter;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CanonicalSorter],
        }).compile();

        sorter = module.get<CanonicalSorter>(CanonicalSorter);
    });

    describe('CANON-01: Idempotency', () => {
        it('должен быть idempotent для простого объекта', () => {
            const obj = { b: 2, a: 1, c: 3 };
            const canonical1 = sorter.canonicalize(obj);
            const parsed = JSON.parse(canonical1);
            const canonical2 = sorter.canonicalize(parsed);

            expect(canonical2).toBe(canonical1);
        });

        it('должен быть idempotent для вложенного объекта', () => {
            const obj = {
                z: { y: 2, x: 1 },
                a: { c: 3, b: 2 },
            };
            const canonical1 = sorter.canonicalize(obj);
            const parsed = JSON.parse(canonical1);
            const canonical2 = sorter.canonicalize(parsed);

            expect(canonical2).toBe(canonical1);
        });

        it('assertIdempotent должен пройти для валидного canonical', () => {
            const obj = { b: 2, a: 1 };
            const canonical = sorter.canonicalize(obj);

            expect(() => sorter.assertIdempotent(canonical)).not.toThrow();
        });

        it('assertIdempotent должен throw для невалидного JSON', () => {
            const invalid = '{ invalid json }';

            expect(() => sorter.assertIdempotent(invalid)).toThrow(CanonicalSortError);
        });
    });

    describe('CANON-02: Order Independence', () => {
        it('ключи в разном порядке → одинаковый canonical', () => {
            const obj1 = { z: 3, a: 1, m: 2 };
            const obj2 = { a: 1, m: 2, z: 3 };

            const canonical1 = sorter.canonicalize(obj1);
            const canonical2 = sorter.canonicalize(obj2);

            expect(canonical1).toBe(canonical2);
            expect(canonical1).toBe('{"a":1,"m":2,"z":3}');
        });

        it('вложенные объекты с разным порядком ключей → одинаковый canonical', () => {
            const obj1 = {
                outer: { z: 3, a: 1 },
                inner: { b: 2, c: 3 },
            };
            const obj2 = {
                inner: { c: 3, b: 2 },
                outer: { a: 1, z: 3 },
            };

            const canonical1 = sorter.canonicalize(obj1);
            const canonical2 = sorter.canonicalize(obj2);

            expect(canonical1).toBe(canonical2);
        });
    });

    describe('CANON-03: Deep Recursion', () => {
        it('массивы НЕ пересортировываются (domain order)', () => {
            const obj = { arr: [3, 1, 2] };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"arr":[3,1,2]}');
        });

        it('вложенные массивы объектов — объекты сортируются, массивы нет', () => {
            const obj = {
                items: [
                    { z: 3, a: 1 },
                    { b: 2, c: 3 },
                ],
            };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"items":[{"a":1,"z":3},{"b":2,"c":3}]}');
        });

        it('глубоко вложенные структуры', () => {
            const obj = {
                level1: {
                    level2: {
                        level3: {
                            z: 3,
                            a: 1,
                        },
                    },
                },
            };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toContain('"a":1');
            expect(canonical).toContain('"z":3');
        });
    });

    describe('CANON-04: Edge Cases', () => {
        it('null в объекте → пропускается', () => {
            const obj = { a: 1, b: null, c: 3 };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"a":1,"c":3}');
        });

        it('null в массиве → пропускается', () => {
            const obj = { arr: [1, null, 3] };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"arr":[1,3]}');
        });

        it('undefined → throw', () => {
            const obj = { a: 1, b: undefined };

            expect(() => sorter.canonicalize(obj)).toThrow(CanonicalSortError);
            expect(() => sorter.canonicalize(obj)).toThrow(/undefined запрещён/);
        });

        it('Date → ISO 8601 string', () => {
            const date = new Date('2026-02-18T00:00:00.000Z');
            const obj = { timestamp: date };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"timestamp":"2026-02-18T00:00:00.000Z"}');
        });

        it('Infinity → throw', () => {
            const obj = { value: Infinity };

            expect(() => sorter.canonicalize(obj)).toThrow(CanonicalSortError);
            expect(() => sorter.canonicalize(obj)).toThrow(/Infinity\/NaN запрещены/);
        });

        it('NaN → throw', () => {
            const obj = { value: NaN };

            expect(() => sorter.canonicalize(obj)).toThrow(CanonicalSortError);
        });
    });

    describe('CANON-05: String Normalization', () => {
        it('NFC normalization для строк', () => {
            // Composed vs decomposed Unicode
            const obj1 = { text: '\u00E9' }; // é (composed)
            const obj2 = { text: 'e\u0301' }; // é (decomposed)

            const canonical1 = sorter.canonicalize(obj1);
            const canonical2 = sorter.canonicalize(obj2);

            // После NFC normalization должны быть одинаковыми
            expect(canonical1).toBe(canonical2);
        });
    });

    describe('CANON-06: Float Precision', () => {
        it('float → toFixed(6)', () => {
            const obj = { value: 3.14159265359 };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"value":3.141593}');
        });

        it('integer остаётся integer', () => {
            const obj = { value: 42 };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"value":42}');
        });

        it('float с trailing zeros → toFixed(6)', () => {
            const obj = { value: 1.1 };
            const canonical = sorter.canonicalize(obj);

            expect(canonical).toBe('{"value":1.1}');
        });
    });

    describe('CANON-07: Unsupported Types', () => {
        it('function → throw', () => {
            const obj = { fn: () => { } };

            expect(() => sorter.canonicalize(obj)).toThrow(CanonicalSortError);
        });

        it('symbol → throw', () => {
            const obj = { sym: Symbol('test') };

            expect(() => sorter.canonicalize(obj)).toThrow(CanonicalSortError);
        });
    });

    describe('CANON-08: Real-world GenerationParams', () => {
        it('GenerationParams каноникализируется детерминированно', () => {
            const params1 = {
                strategyId: 'strat-123',
                cropId: 'wheat',
                companyId: 'comp-456',
                seasonId: 'season-789',
                fieldId: 'field-001',
            };

            const params2 = {
                fieldId: 'field-001',
                companyId: 'comp-456',
                seasonId: 'season-789',
                cropId: 'wheat',
                strategyId: 'strat-123',
            };

            const canonical1 = sorter.canonicalize(params1);
            const canonical2 = sorter.canonicalize(params2);

            expect(canonical1).toBe(canonical2);
        });
    });
});

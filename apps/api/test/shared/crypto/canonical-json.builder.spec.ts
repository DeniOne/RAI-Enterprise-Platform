import { CanonicalJsonBuilder } from '../../src/shared/crypto/canonical-json.builder';

describe('CanonicalJsonBuilder', () => {
    it('should stringify identical objects with different key order to the same string', () => {
        const obj1 = {
            b: 2,
            a: 1,
            c: { y: 'test', x: 10 }
        };

        const obj2 = {
            c: { x: 10, y: 'test' },
            a: 1,
            b: 2
        };

        const canonical1 = CanonicalJsonBuilder.stringify(obj1);
        const canonical2 = CanonicalJsonBuilder.stringify(obj2);

        expect(canonical1).toEqual(canonical2);
        expect(canonical1).toEqual('{"a":1,"b":2,"c":{"x":10,"y":"test"}}');
    });

    it('should handle arrays correctly without sorting array items', () => {
        const obj = {
            arr: [{ b: 2, a: 1 }, 3, "test"],
            z: 10
        };

        const canonical = CanonicalJsonBuilder.stringify(obj);
        expect(canonical).toEqual('{"arr":[{"a":1,"b":2},3,"test"],"z":10}');
    });

    it('should ignore undefined properties', () => {
        const obj = {
            a: 1,
            b: undefined,
            c: 3
        };

        const canonical = CanonicalJsonBuilder.stringify(obj);
        expect(canonical).toEqual('{"a":1,"c":3}');
    });

    it('should stringify null correctly', () => {
        expect(CanonicalJsonBuilder.stringify({ a: null })).toEqual('{"a":null}');
        expect(CanonicalJsonBuilder.stringify(null)).toEqual('null');
    });

    it('should generate identical hashes for identical payloads regardless of key order', () => {
        const obj1 = { role: 'admin', companyId: '123', permissions: ['read', 'write'] };
        const obj2 = { permissions: ['read', 'write'], companyId: '123', role: 'admin' };

        const hash1 = CanonicalJsonBuilder.hash(obj1);
        const hash2 = CanonicalJsonBuilder.hash(obj2);

        expect(hash1).toEqual(hash2);
        expect(hash1.length).toEqual(64); // SHA-256 is 64 hex chars
    });
});

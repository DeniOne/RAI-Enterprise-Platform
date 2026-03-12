import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PgVectorStore } from './pg-vector-store';
import { PrismaClient } from '@prisma/client';
import { EMBEDDING_DIM } from './types';

describe('PgVectorStore', () => {
    let store: PgVectorStore;
    let mockPrisma: any;
    const sqlText = (query: unknown): string => {
        if (query && typeof query === 'object' && 'strings' in (query as any)) {
            return ((query as any).strings as readonly string[]).join('?');
        }
        return String(query);
    };

    beforeEach(() => {
        mockPrisma = {
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
        };
        store = new PgVectorStore(mockPrisma as unknown as PrismaClient);
    });

    it('should throw if embedding dimension is wrong', async () => {
        await expect(store.add({
            content: 'test',
            embedding: [1, 2, 3],
            companyId: 'company1',
            memoryType: 'KNOWLEDGE',
            source: 'system'
        })).rejects.toThrow(`Invalid embedding dimension. Expected ${EMBEDDING_DIM}, got 3`);
    });

    it('should add embedding successfully', async () => {
        const embedding = new Array(EMBEDDING_DIM).fill(0.1);
        mockPrisma.$queryRaw.mockResolvedValue([{ id: 'mock-id' }]);

        const id = await store.add({
            content: 'test',
            embedding,
            companyId: 'company1',
            memoryType: 'KNOWLEDGE',
            source: 'system'
        });

        expect(id).toBe('mock-id');
        expect(sqlText(mockPrisma.$queryRaw.mock.calls[0][0])).toContain('INSERT INTO memory_entries');
    });

    it('should query successfully', async () => {
        const embedding = new Array(EMBEDDING_DIM).fill(0.1);
        mockPrisma.$queryRaw.mockResolvedValue([
            { id: 'mock-id', content: 'test', metadata: {}, similarity: 0.95 }
        ]);

        const results = await store.query({
            embedding,
            companyId: 'company1'
        });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('mock-id');
        expect(results[0].similarity).toBe(0.95);
        expect(sqlText(mockPrisma.$queryRaw.mock.calls[0][0])).toContain('FROM memory_entries');
    });

    it('should delete successfully', async () => {
        await store.delete('mock-id');
        expect(sqlText(mockPrisma.$executeRaw.mock.calls[0][0])).toContain(
            'DELETE FROM memory_entries WHERE id =',
        );
    });
});

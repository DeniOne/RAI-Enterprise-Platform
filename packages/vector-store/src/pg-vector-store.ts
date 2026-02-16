import { PrismaClient } from '@prisma/client';
import { IVectorStore, IVectorStoreAddOptions, IVectorStoreQueryOptions, IVectorStoreResult, EMBEDDING_DIM } from './types.js';

export class PgVectorStore implements IVectorStore {
    constructor(private readonly prisma: PrismaClient) { }

    private validateEmbedding(embedding: number[]) {
        if (embedding.length !== EMBEDDING_DIM) {
            throw new Error(`Invalid embedding dimension. Expected ${EMBEDDING_DIM}, got ${embedding.length}`);
        }
    }

    async add(options: IVectorStoreAddOptions): Promise<string> {
        this.validateEmbedding(options.embedding);

        const vectorStr = `[${options.embedding.join(',')}]`;

        // We use $executeRaw for the initial insert because Prisma doesn't support vector type natively
        // Once MemoryEntry is created, we can attempt to use Prisma for standard fields, 
        // but for safety with pgvector, we use raw SQL for the whole insert when embedding is present.

        const result = await this.prisma.$queryRawUnsafe(
            `INSERT INTO memory_entries (id, content, embedding, metadata, "companyId", "memoryType", source, "expiresAt", "createdAt")
             VALUES ($1, $2, $3::vector, $4::jsonb, $5, $6, $7, $8, NOW())
             RETURNING id`,
            options.id || `mem_${Math.random().toString(36).substr(2, 9)}`,
            options.content,
            vectorStr,
            JSON.stringify(options.metadata || {}),
            options.companyId,
            options.memoryType,
            options.source,
            options.expiresAt || null
        ) as { id: string }[];

        return result[0].id;
    }

    async query(options: IVectorStoreQueryOptions): Promise<IVectorStoreResult[]> {
        this.validateEmbedding(options.embedding);

        const vectorStr = `[${options.embedding.join(',')}]`;
        const limit = options.limit || 5;
        const minSimilarity = options.minSimilarity || 0.7;

        // Cosine similarity in pgvector: 1 - (embedding <=> $1)
        const entries = await this.prisma.$queryRawUnsafe(
            `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
             FROM memory_entries
             WHERE "companyId" = $2
             ${options.memoryType ? 'AND "memoryType" = $3' : ''}
             AND 1 - (embedding <=> $1::vector) >= $4
             ORDER BY similarity DESC
             LIMIT $5`,
            vectorStr,
            options.companyId,
            options.memoryType,
            minSimilarity,
            limit
        ) as any[];

        return entries.map(e => ({
            id: e.id,
            content: e.content,
            metadata: e.metadata,
            similarity: Number(e.similarity)
        }));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.$executeRawUnsafe(
            `DELETE FROM memory_entries WHERE id = $1`,
            id
        );
    }
}

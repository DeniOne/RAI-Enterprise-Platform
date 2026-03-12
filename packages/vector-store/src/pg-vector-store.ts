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

        const result = await this.prisma.$queryRaw`
            INSERT INTO memory_entries (
                id,
                content,
                embedding,
                metadata,
                "companyId",
                "memoryType",
                source,
                "expiresAt",
                "createdAt"
            )
            VALUES (
                ${options.id || `mem_${Math.random().toString(36).slice(2, 11)}`},
                ${options.content},
                ${vectorStr}::vector,
                ${JSON.stringify(options.metadata || {})}::jsonb,
                ${options.companyId},
                ${options.memoryType},
                ${options.source},
                ${options.expiresAt || null},
                NOW()
            )
            RETURNING id
        ` as { id: string }[];

        return result[0].id;
    }

    async query(options: IVectorStoreQueryOptions): Promise<IVectorStoreResult[]> {
        this.validateEmbedding(options.embedding);

        const vectorStr = `[${options.embedding.join(',')}]`;
        const limit = options.limit || 5;
        const minSimilarity = options.minSimilarity || 0.7;

        // Cosine similarity in pgvector: 1 - (embedding <=> $1)
        const entries = options.memoryType
            ? await this.prisma.$queryRaw`
                SELECT id, content, metadata, 1 - (embedding <=> ${vectorStr}::vector) as similarity
                FROM memory_entries
                WHERE "companyId" = ${options.companyId}
                AND "memoryType" = ${options.memoryType}
                AND 1 - (embedding <=> ${vectorStr}::vector) >= ${minSimilarity}
                ORDER BY similarity DESC
                LIMIT ${limit}
            `
            : await this.prisma.$queryRaw`
                SELECT id, content, metadata, 1 - (embedding <=> ${vectorStr}::vector) as similarity
                FROM memory_entries
                WHERE "companyId" = ${options.companyId}
                AND 1 - (embedding <=> ${vectorStr}::vector) >= ${minSimilarity}
                ORDER BY similarity DESC
                LIMIT ${limit}
            `;

        return (entries as Array<{ id: string; content: string; metadata: unknown; similarity: number | string }>).map((e) => ({
            id: e.id,
            content: e.content,
            metadata: e.metadata,
            similarity: Number(e.similarity)
        }));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.$executeRaw`DELETE FROM memory_entries WHERE id = ${id}`;
    }
}

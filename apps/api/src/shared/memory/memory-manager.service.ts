import { Injectable, Logger } from '@nestjs/common';
import { ContextService } from '../cache/context.service.js';
import { IVectorStore, PgVectorStore } from '@rai/vector-store';
import { IMemoryPolicy, DefaultMemoryPolicy } from './memory-policy.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MemoryManager {
    private readonly logger = new Logger(MemoryManager.name);
    private vectorStore: IVectorStore;

    constructor(
        private readonly contextService: ContextService,
        private readonly prisma: PrismaService,
    ) {
        this.vectorStore = new PgVectorStore(this.prisma as any);
    }

    /**
     * Core method to process and store information based on policy.
     */
    async store(
        content: string,
        embedding: number[],
        context: any,
        policy: IMemoryPolicy = DefaultMemoryPolicy
    ): Promise<void> {
        const importance = policy.calculateImportance(content, context);

        // 1. Always store in short-term context if it's active session
        if (context.sessionId) {
            const ttl = policy.calculateTTL('CONTEXT');
            await this.contextService.setContext(`session:${context.sessionId}:latest`, {
                content,
                timestamp: new Date(),
                importance
            }, ttl);
            this.logger.debug(`Stored context for session ${context.sessionId}`);
        }

        // 2. Persist to long-term memory if policy triggers
        if (policy.shouldPersist({ ...context, importance })) {
            await this.vectorStore.add({
                content,
                embedding,
                companyId: context.companyId,
                memoryType: context.memoryType || 'CONTEXT',
                source: context.source || 'system',
                metadata: context.metadata,
                expiresAt: context.expiresAt
            });
            this.logger.log(`Persisted long-term memory for company ${context.companyId}`);
        }
    }

    /**
     * Core method to retrieve information based on policy and similarity.
     */
    async recall(
        embedding: number[],
        context: any,
        policy: IMemoryPolicy = DefaultMemoryPolicy
    ): Promise<any[]> {
        if (!policy.shouldRetrieve(context)) {
            return [];
        }

        return this.vectorStore.query({
            embedding,
            companyId: context.companyId,
            memoryType: context.memoryType,
            limit: context.limit || 5,
            minSimilarity: context.minSimilarity || 0.7
        });
    }
}

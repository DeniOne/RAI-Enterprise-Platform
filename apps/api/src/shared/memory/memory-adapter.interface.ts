import { EpisodicRetrievalResponse } from "./episodic-retrieval.service";

export interface MemoryContext {
    companyId: string;
    traceId: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}

export interface MemoryInteraction {
    userMessage: string;
    agentResponse: string;
    embedding: number[];
    toolCalls?: any[];
}

export interface MemoryRetrieveOptions {
    limit: number;
    minSimilarity: number;
}

export interface MemoryAdapter {
    appendInteraction(
        ctx: MemoryContext,
        interaction: MemoryInteraction,
    ): Promise<void>;

    retrieve(
        ctx: MemoryContext,
        embedding: number[],
        options: MemoryRetrieveOptions,
    ): Promise<EpisodicRetrievalResponse>;

    /**
     * Stub for future user profile integration
     */
    getProfile(ctx: MemoryContext): Promise<Record<string, unknown>>;

    /**
     * Stub for future user profile integration
     */
    updateProfile(
        ctx: MemoryContext,
        patch: Record<string, unknown>,
    ): Promise<void>;
}

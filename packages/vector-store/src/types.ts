export const EMBEDDING_DIM = 1536;

export interface IVectorStoreAddOptions {
    id?: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
    companyId: string;
    memoryType: 'CONTEXT' | 'KNOWLEDGE' | 'STRATEGY' | 'PROCESS';
    source: 'system' | 'user' | 'import' | 'llm';
    expiresAt?: Date;
}

export interface IVectorStoreQueryOptions {
    embedding: number[];
    companyId: string;
    memoryType?: string;
    limit?: number;
    minSimilarity?: number;
}

export interface IVectorStoreResult {
    id: string;
    content: string;
    metadata: any;
    similarity: number;
}

export interface IVectorStore {
    add(options: IVectorStoreAddOptions): Promise<string>;
    query(options: IVectorStoreQueryOptions): Promise<IVectorStoreResult[]>;
    delete(id: string): Promise<void>;
}

export interface IMemoryPolicy {
    readonly id: string;
    readonly name: string;

    /**
     * Should this event trigger a memory save to long-term storage?
     */
    shouldPersist(context: any): boolean;

    /**
     * Should this event trigger a lookup in long-term storage?
     */
    shouldRetrieve(context: any): boolean;

    /**
     * Determine importance score of the information (0-1).
     */
    calculateImportance(content: string, context: any): number;

    /**
     * Determine TTL for the context memory.
     */
    calculateTTL(memoryType: string): number;
}

export const DefaultMemoryPolicy: IMemoryPolicy = {
    id: 'default',
    name: 'Default RAI Policy',
    shouldPersist: (ctx) => ctx.isBoundary === true || ctx.importance > 0.7,
    shouldRetrieve: (ctx) => ctx.needsKnowledge === true,
    calculateImportance: (content) => (content.length > 100 ? 0.8 : 0.5),
    calculateTTL: (type) => (type === 'CONTEXT' ? 3600 : 86400 * 7),
};

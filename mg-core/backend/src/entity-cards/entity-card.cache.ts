/**
 * Entity Card Cache
 * 
 * In-memory immutable cache for EntityCards.
 * Built once at startup, never modified at runtime.
 */

import { EntityCard } from './entity-card.types';
import { EntityCardBuilder, entityCardBuilder } from './entity-card.builder';
import { logger } from '../config/logger';

// =============================================================================
// ENTITY CARD CACHE
// =============================================================================

export class EntityCardCache {
    private readonly cache: Map<string, EntityCard> = new Map();
    private readonly urnToType: Map<string, string> = new Map();
    private initialized = false;
    private buildTimestamp: Date | null = null;

    constructor(private readonly builder: EntityCardBuilder = entityCardBuilder) { }

    /**
     * Initialize cache by building all cards.
     * Must be called once at startup.
     */
    initialize(): void {
        if (this.initialized) {
            logger.warn('[EntityCardCache] Already initialized, skipping');
            return;
        }

        logger.info('[EntityCardCache] Initializing cache...');
        const startTime = Date.now();

        try {
            const cards = this.builder.buildAll();

            for (const card of cards) {
                this.cache.set(card.entityType, card);
                this.urnToType.set(card.urn, card.entityType);
            }

            this.initialized = true;
            this.buildTimestamp = new Date();

            const elapsed = Date.now() - startTime;
            logger.info(`[EntityCardCache] Initialized: ${cards.length} cards in ${elapsed}ms`);

        } catch (error) {
            logger.error('[EntityCardCache] Initialization failed', { error });
            throw error;
        }
    }

    /**
     * Get EntityCard by entity type or URN.
     * @throws Error if not initialized or card not found
     */
    get(entityTypeOrUrn: string): EntityCard {
        this.ensureInitialized();

        // Try direct lookup
        let card = this.cache.get(entityTypeOrUrn);

        if (!card) {
            // Try URN lookup
            const type = this.urnToType.get(entityTypeOrUrn);
            if (type) {
                card = this.cache.get(type);
            }
        }

        if (!card) {
            // Try short name resolution
            const shortName = this.extractShortName(entityTypeOrUrn);
            card = this.cache.get(shortName);
        }

        if (!card) {
            throw new Error(`[EntityCardCache] Card not found: ${entityTypeOrUrn}`);
        }

        return card;
    }

    /**
     * Check if card exists
     */
    has(entityTypeOrUrn: string): boolean {
        this.ensureInitialized();

        if (this.cache.has(entityTypeOrUrn)) return true;
        if (this.urnToType.has(entityTypeOrUrn)) return true;

        const shortName = this.extractShortName(entityTypeOrUrn);
        return this.cache.has(shortName);
    }

    /**
     * Get all cached cards
     */
    getAll(): EntityCard[] {
        this.ensureInitialized();
        return Array.from(this.cache.values());
    }

    /**
     * Get cards by domain
     */
    getByDomain(domain: string): EntityCard[] {
        this.ensureInitialized();
        return this.getAll().filter(c => c.metadata.domain === domain);
    }

    /**
     * Get cache stats
     */
    getStats(): {
        cardCount: number;
        initialized: boolean;
        buildTimestamp: Date | null;
    } {
        return {
            cardCount: this.cache.size,
            initialized: this.initialized,
            buildTimestamp: this.buildTimestamp
        };
    }

    // =========================================================================
    // PRIVATE
    // =========================================================================

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('[EntityCardCache] Cache not initialized. Call initialize() first.');
        }
    }

    private extractShortName(input: string): string {
        if (input.startsWith('urn:mg:type:')) {
            return input.replace('urn:mg:type:', '');
        }
        return input;
    }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const entityCardCache = new EntityCardCache();

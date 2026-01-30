"use strict";
/**
 * Entity Card Cache
 *
 * In-memory immutable cache for EntityCards.
 * Built once at startup, never modified at runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityCardCache = exports.EntityCardCache = void 0;
const entity_card_builder_1 = require("./entity-card.builder");
const logger_1 = require("../config/logger");
// =============================================================================
// ENTITY CARD CACHE
// =============================================================================
class EntityCardCache {
    builder;
    cache = new Map();
    urnToType = new Map();
    initialized = false;
    buildTimestamp = null;
    constructor(builder = entity_card_builder_1.entityCardBuilder) {
        this.builder = builder;
    }
    /**
     * Initialize cache by building all cards.
     * Must be called once at startup.
     */
    initialize() {
        if (this.initialized) {
            logger_1.logger.warn('[EntityCardCache] Already initialized, skipping');
            return;
        }
        logger_1.logger.info('[EntityCardCache] Initializing cache...');
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
            logger_1.logger.info(`[EntityCardCache] Initialized: ${cards.length} cards in ${elapsed}ms`);
        }
        catch (error) {
            logger_1.logger.error('[EntityCardCache] Initialization failed', { error });
            throw error;
        }
    }
    /**
     * Get EntityCard by entity type or URN.
     * @throws Error if not initialized or card not found
     */
    get(entityTypeOrUrn) {
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
    has(entityTypeOrUrn) {
        this.ensureInitialized();
        if (this.cache.has(entityTypeOrUrn))
            return true;
        if (this.urnToType.has(entityTypeOrUrn))
            return true;
        const shortName = this.extractShortName(entityTypeOrUrn);
        return this.cache.has(shortName);
    }
    /**
     * Get all cached cards
     */
    getAll() {
        this.ensureInitialized();
        return Array.from(this.cache.values());
    }
    /**
     * Get cards by domain
     */
    getByDomain(domain) {
        this.ensureInitialized();
        return this.getAll().filter(c => c.metadata.domain === domain);
    }
    /**
     * Get cache stats
     */
    getStats() {
        return {
            cardCount: this.cache.size,
            initialized: this.initialized,
            buildTimestamp: this.buildTimestamp
        };
    }
    // =========================================================================
    // PRIVATE
    // =========================================================================
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('[EntityCardCache] Cache not initialized. Call initialize() first.');
        }
    }
    extractShortName(input) {
        if (input.startsWith('urn:mg:type:')) {
            return input.replace('urn:mg:type:', '');
        }
        return input;
    }
}
exports.EntityCardCache = EntityCardCache;
// =============================================================================
// SINGLETON
// =============================================================================
exports.entityCardCache = new EntityCardCache();

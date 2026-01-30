"use strict";
/**
 * Entity Card Service
 *
 * Main facade for Entity Card operations.
 * Used by Controllers, Services, and AI Core.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityCardService = exports.EntityCardService = void 0;
const entity_card_cache_1 = require("./entity-card.cache");
const entity_card_guard_1 = require("./entity-card.guard");
const logger_1 = require("../config/logger");
// =============================================================================
// ENTITY CARD SERVICE
// =============================================================================
class EntityCardService {
    cache;
    guard;
    constructor(cache = entity_card_cache_1.entityCardCache, guard = entity_card_guard_1.entityCardGuard) {
        this.cache = cache;
        this.guard = guard;
    }
    /**
     * Initialize the service (builds cache).
     * Must be called after Registry bootstrap.
     */
    initialize() {
        logger_1.logger.info('[EntityCardService] Initializing...');
        this.cache.initialize();
        const stats = this.cache.getStats();
        logger_1.logger.info(`[EntityCardService] Initialized with ${stats.cardCount} cards`);
    }
    // =========================================================================
    // READ OPERATIONS
    // =========================================================================
    /**
     * Get EntityCard by type or URN
     */
    getCard(entityType) {
        const card = this.cache.get(entityType);
        return {
            entityType: card.entityType,
            card
        };
    }
    /**
     * Get all EntityCards
     */
    getAllCards() {
        const cards = this.cache.getAll();
        return {
            cards,
            total: cards.length
        };
    }
    /**
     * Get EntityCards by domain
     */
    getCardsByDomain(domain) {
        const cards = this.cache.getByDomain(domain);
        return {
            cards,
            total: cards.length
        };
    }
    /**
     * Check if entity type exists
     */
    hasCard(entityType) {
        return this.cache.has(entityType);
    }
    // =========================================================================
    // VALIDATION OPERATIONS
    // =========================================================================
    /**
     * Validate data against EntityCard
     */
    validate(entityType, data, operation, existingData) {
        return this.guard.validate(entityType, data, operation, existingData);
    }
    /**
     * Validate and throw on error
     */
    validateOrThrow(entityType, data, operation, existingData) {
        this.guard.validateOrThrow(entityType, data, operation, existingData);
    }
    /**
     * Validate payload strictly against a View Definition (Step 9)
     */
    validateWithView(entityType, data, viewName) {
        return this.guard.validateWithView(entityType, data, viewName);
    }
    // =========================================================================
    // STATS & METADATA
    // =========================================================================
    /**
     * Get service stats
     */
    getStats() {
        const cacheStats = this.cache.getStats();
        const cards = this.cache.getAll();
        const domains = [...new Set(cards.map(c => c.metadata.domain))];
        return {
            cardCount: cacheStats.cardCount,
            domains,
            initialized: cacheStats.initialized
        };
    }
    /**
     * Get attribute schema for a field
     */
    getAttributeSchema(entityType, fieldName) {
        const card = this.cache.get(entityType);
        return card.attributes.find(a => a.name === fieldName);
    }
    /**
     * Get relation schema
     */
    getRelationSchema(entityType, relationName) {
        const card = this.cache.get(entityType);
        return card.relations.find(r => r.name === relationName);
    }
    /**
     * Get all required fields for create
     */
    getRequiredFields(entityType) {
        const card = this.cache.get(entityType);
        const requiredAttrs = card.attributes.filter(a => a.required).map(a => a.name);
        const requiredRels = card.relations.filter(r => r.required).map(r => r.name);
        return [...requiredAttrs, ...requiredRels];
    }
}
exports.EntityCardService = EntityCardService;
// =============================================================================
// SINGLETON
// =============================================================================
exports.entityCardService = new EntityCardService();

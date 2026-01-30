/**
 * Entity Card Service
 * 
 * Main facade for Entity Card operations.
 * Used by Controllers, Services, and AI Core.
 */

import {
    EntityCard,
    EntityCardResponse,
    EntityCardListResponse,
    EntityCardValidationResult
} from './entity-card.types';
import { entityCardCache, EntityCardCache } from './entity-card.cache';
import { entityCardGuard, EntityCardGuard, ValidationOperation } from './entity-card.guard';
import { logger } from '../config/logger';

// =============================================================================
// ENTITY CARD SERVICE
// =============================================================================

export class EntityCardService {
    constructor(
        private readonly cache: EntityCardCache = entityCardCache,
        private readonly guard: EntityCardGuard = entityCardGuard
    ) { }

    /**
     * Initialize the service (builds cache).
     * Must be called after Registry bootstrap.
     */
    initialize(): void {
        logger.info('[EntityCardService] Initializing...');
        this.cache.initialize();

        const stats = this.cache.getStats();
        logger.info(`[EntityCardService] Initialized with ${stats.cardCount} cards`);
    }

    // =========================================================================
    // READ OPERATIONS
    // =========================================================================

    /**
     * Get EntityCard by type or URN
     */
    getCard(entityType: string): EntityCardResponse {
        const card = this.cache.get(entityType);
        return {
            entityType: card.entityType,
            card
        };
    }

    /**
     * Get all EntityCards
     */
    getAllCards(): EntityCardListResponse {
        const cards = this.cache.getAll();
        return {
            cards,
            total: cards.length
        };
    }

    /**
     * Get EntityCards by domain
     */
    getCardsByDomain(domain: string): EntityCardListResponse {
        const cards = this.cache.getByDomain(domain);
        return {
            cards,
            total: cards.length
        };
    }

    /**
     * Check if entity type exists
     */
    hasCard(entityType: string): boolean {
        return this.cache.has(entityType);
    }

    // =========================================================================
    // VALIDATION OPERATIONS
    // =========================================================================

    /**
     * Validate data against EntityCard
     */
    validate(
        entityType: string,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData?: Record<string, any>
    ): EntityCardValidationResult {
        return this.guard.validate(entityType, data, operation, existingData);
    }

    /**
     * Validate and throw on error
     */
    validateOrThrow(
        entityType: string,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData?: Record<string, any>
    ): void {
        this.guard.validateOrThrow(entityType, data, operation, existingData);
    }

    /**
     * Validate payload strictly against a View Definition (Step 9)
     */
    validateWithView(
        entityType: string,
        data: Record<string, any>,
        viewName: string
    ): EntityCardValidationResult {
        return this.guard.validateWithView(entityType, data, viewName);
    }

    // =========================================================================
    // STATS & METADATA
    // =========================================================================

    /**
     * Get service stats
     */
    getStats(): {
        cardCount: number;
        domains: string[];
        initialized: boolean;
    } {
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
    getAttributeSchema(entityType: string, fieldName: string) {
        const card = this.cache.get(entityType);
        return card.attributes.find(a => a.name === fieldName);
    }

    /**
     * Get relation schema
     */
    getRelationSchema(entityType: string, relationName: string) {
        const card = this.cache.get(entityType);
        return card.relations.find(r => r.name === relationName);
    }

    /**
     * Get all required fields for create
     */
    getRequiredFields(entityType: string): string[] {
        const card = this.cache.get(entityType);
        const requiredAttrs = card.attributes.filter(a => a.required).map(a => a.name);
        const requiredRels = card.relations.filter(r => r.required).map(r => r.name);
        return [...requiredAttrs, ...requiredRels];
    }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const entityCardService = new EntityCardService();

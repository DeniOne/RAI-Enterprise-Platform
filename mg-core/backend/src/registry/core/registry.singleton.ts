/**
 * Registry Singleton
 * 
 * Single point of access to the Registry.
 * - Loaded once at startup
 * - Read-only access
 * - Fail-fast on invalid registry
 */

import { IRegistry, RegistryMetadata, EntityTypeDefinition, RelationshipDefinition, RegistryEntityClass } from './registry.types';
import { RegistryLoader, registryLoader } from './registry.loader';
import { RegistryValidator, registryValidator } from './registry.validator';
import { RegistryGraph } from './registry.graph';
import { logger } from '../../config/logger';

// =============================================================================
// REGISTRY STATE
// =============================================================================

let _registry: IRegistry | null = null;
let _initialized = false;

// =============================================================================
// BOOTSTRAP FUNCTION
// =============================================================================

/**
 * Bootstrap the Registry.
 * Must be called ONCE before server starts.
 * 
 * @throws Error if registry is invalid or already initialized
 */
export async function bootstrapRegistry(
    loader: RegistryLoader = registryLoader,
    validator: RegistryValidator = registryValidator
): Promise<IRegistry> {
    if (_initialized) {
        throw new Error('Registry already initialized. Cannot bootstrap twice.');
    }

    logger.info('[RegistryBootstrap] === STARTING REGISTRY BOOTSTRAP ===');

    try {
        // 1. Load all entity definitions
        const loadResult = await loader.load();
        logger.info(`[RegistryBootstrap] Loaded ${loadResult.entities.length} entities`);

        // 2. Validate all entities
        const validationResult = validator.validate(loadResult.entities);

        if (!validationResult.valid) {
            const errorMessages = validationResult.errors
                .map(e => `  [${e.entity_urn || 'unknown'}] ${e.message}`)
                .join('\n');

            throw new Error(`Registry validation failed:\n${errorMessages}`);
        }

        if (validationResult.warnings.length > 0) {
            logger.warn(`[RegistryBootstrap] ${validationResult.warnings.length} warning(s) during validation`);
            for (const warning of validationResult.warnings) {
                logger.warn(`  [${warning.entity_urn || 'unknown'}] ${warning.message}`);
            }
        }

        // 3. Build the graph
        const graph = new RegistryGraph(loadResult.entities, loadResult.checksum);

        // 4. Set singleton
        _registry = graph;
        _initialized = true;

        // 5. Build stats with enum count
        const stats = graph.getStats();

        // Count ENUMs in all entities
        let enumCount = 0;
        for (const entity of loadResult.entities) {
            for (const attr of entity.schema.attributes) {
                if (attr.type === 'ENUM') enumCount++;
            }
        }

        // CRITICAL LOG: This MUST show "51" for entities
        logger.info('============================================================');
        logger.info('[REGISTRY] Bootstrap summary');
        logger.info(`[REGISTRY]   entities=${stats.entities}`);
        logger.info(`[REGISTRY]   relations=${stats.relations}`);
        logger.info(`[REGISTRY]   enums=${enumCount}`);
        logger.info(`[REGISTRY]   checksum=${graph.metadata.checksum}`);
        logger.info(`[REGISTRY]   domains=${Object.keys(stats.byDomain).join(', ')}`);
        logger.info(`[REGISTRY]   byClass=${JSON.stringify(stats.byClass)}`);
        logger.info('============================================================');

        return _registry;

    } catch (error) {
        logger.error('[RegistryBootstrap] === REGISTRY BOOTSTRAP FAILED ===');
        logger.error(`[RegistryBootstrap] ${error instanceof Error ? error.message : String(error)}`);

        // Fail the process - registry is critical
        throw error;
    }
}

// =============================================================================
// REGISTRY ACCESS
// =============================================================================

/**
 * Get the Registry singleton (read-only).
 * @throws Error if registry not initialized
 */
export function getRegistry(): IRegistry {
    if (!_registry) {
        throw new Error('Registry not initialized. Call bootstrapRegistry() first.');
    }
    return _registry;
}

/**
 * Check if registry is initialized
 */
export function isRegistryInitialized(): boolean {
    return _initialized;
}

// =============================================================================
// CONVENIENCE EXPORTS (READ-ONLY FACADE)
// =============================================================================

/**
 * Registry facade with convenient methods.
 * All methods are read-only and safe for use in services.
 */
export const Registry = {
    /**
     * Get registry metadata
     */
    get metadata(): RegistryMetadata {
        return getRegistry().metadata;
    },

    /**
     * Get entity by URN
     */
    getEntity(urn: string): EntityTypeDefinition | undefined {
        return getRegistry().getEntity(urn);
    },

    /**
     * Get all entities
     */
    getAllEntities(): EntityTypeDefinition[] {
        return getRegistry().getAllEntities();
    },

    /**
     * Get entities by domain
     */
    getEntitiesByDomain(domain: string): EntityTypeDefinition[] {
        return getRegistry().getEntitiesByDomain(domain);
    },

    /**
     * Get entities by class
     */
    getEntitiesByClass(entityClass: RegistryEntityClass): EntityTypeDefinition[] {
        return getRegistry().getEntitiesByClass(entityClass);
    },

    /**
     * Get outgoing relationships for an entity
     */
    getOutgoingRelationships(urn: string): RelationshipDefinition[] {
        return getRegistry().getOutgoingRelationships(urn);
    },

    /**
     * Get incoming relationships for an entity
     */
    getIncomingRelationships(urn: string): RelationshipDefinition[] {
        return getRegistry().getIncomingRelationships(urn);
    },

    /**
     * Get entities this entity depends on
     */
    getDependencies(urn: string): string[] {
        return getRegistry().getDependencies(urn);
    },

    /**
     * Get entities that depend on this entity
     */
    getDependents(urn: string): string[] {
        return getRegistry().getDependents(urn);
    },

    /**
     * Check if entity exists
     */
    hasEntity(urn: string): boolean {
        return getRegistry().hasEntity(urn);
    }
};

// =============================================================================
// RESET (for testing only)
// =============================================================================

/**
 * Reset registry state.
 * FOR TESTING ONLY - do not use in production.
 */
export function __resetRegistryForTesting(): void {
    _registry = null;
    _initialized = false;
}

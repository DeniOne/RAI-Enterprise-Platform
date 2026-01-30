"use strict";
/**
 * Registry Singleton
 *
 * Single point of access to the Registry.
 * - Loaded once at startup
 * - Read-only access
 * - Fail-fast on invalid registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
exports.bootstrapRegistry = bootstrapRegistry;
exports.getRegistry = getRegistry;
exports.isRegistryInitialized = isRegistryInitialized;
exports.__resetRegistryForTesting = __resetRegistryForTesting;
const registry_loader_1 = require("./registry.loader");
const registry_validator_1 = require("./registry.validator");
const registry_graph_1 = require("./registry.graph");
const logger_1 = require("../../config/logger");
// =============================================================================
// REGISTRY STATE
// =============================================================================
let _registry = null;
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
async function bootstrapRegistry(loader = registry_loader_1.registryLoader, validator = registry_validator_1.registryValidator) {
    if (_initialized) {
        throw new Error('Registry already initialized. Cannot bootstrap twice.');
    }
    logger_1.logger.info('[RegistryBootstrap] === STARTING REGISTRY BOOTSTRAP ===');
    try {
        // 1. Load all entity definitions
        const loadResult = await loader.load();
        logger_1.logger.info(`[RegistryBootstrap] Loaded ${loadResult.entities.length} entities`);
        // 2. Validate all entities
        const validationResult = validator.validate(loadResult.entities);
        if (!validationResult.valid) {
            const errorMessages = validationResult.errors
                .map(e => `  [${e.entity_urn || 'unknown'}] ${e.message}`)
                .join('\n');
            throw new Error(`Registry validation failed:\n${errorMessages}`);
        }
        if (validationResult.warnings.length > 0) {
            logger_1.logger.warn(`[RegistryBootstrap] ${validationResult.warnings.length} warning(s) during validation`);
            for (const warning of validationResult.warnings) {
                logger_1.logger.warn(`  [${warning.entity_urn || 'unknown'}] ${warning.message}`);
            }
        }
        // 3. Build the graph
        const graph = new registry_graph_1.RegistryGraph(loadResult.entities, loadResult.checksum);
        // 4. Set singleton
        _registry = graph;
        _initialized = true;
        // 5. Build stats with enum count
        const stats = graph.getStats();
        // Count ENUMs in all entities
        let enumCount = 0;
        for (const entity of loadResult.entities) {
            for (const attr of entity.schema.attributes) {
                if (attr.type === 'ENUM')
                    enumCount++;
            }
        }
        // CRITICAL LOG: This MUST show "51" for entities
        logger_1.logger.info('============================================================');
        logger_1.logger.info('[REGISTRY] Bootstrap summary');
        logger_1.logger.info(`[REGISTRY]   entities=${stats.entities}`);
        logger_1.logger.info(`[REGISTRY]   relations=${stats.relations}`);
        logger_1.logger.info(`[REGISTRY]   enums=${enumCount}`);
        logger_1.logger.info(`[REGISTRY]   checksum=${graph.metadata.checksum}`);
        logger_1.logger.info(`[REGISTRY]   domains=${Object.keys(stats.byDomain).join(', ')}`);
        logger_1.logger.info(`[REGISTRY]   byClass=${JSON.stringify(stats.byClass)}`);
        logger_1.logger.info('============================================================');
        return _registry;
    }
    catch (error) {
        logger_1.logger.error('[RegistryBootstrap] === REGISTRY BOOTSTRAP FAILED ===');
        logger_1.logger.error(`[RegistryBootstrap] ${error instanceof Error ? error.message : String(error)}`);
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
function getRegistry() {
    if (!_registry) {
        throw new Error('Registry not initialized. Call bootstrapRegistry() first.');
    }
    return _registry;
}
/**
 * Check if registry is initialized
 */
function isRegistryInitialized() {
    return _initialized;
}
// =============================================================================
// CONVENIENCE EXPORTS (READ-ONLY FACADE)
// =============================================================================
/**
 * Registry facade with convenient methods.
 * All methods are read-only and safe for use in services.
 */
exports.Registry = {
    /**
     * Get registry metadata
     */
    get metadata() {
        return getRegistry().metadata;
    },
    /**
     * Get entity by URN
     */
    getEntity(urn) {
        return getRegistry().getEntity(urn);
    },
    /**
     * Get all entities
     */
    getAllEntities() {
        return getRegistry().getAllEntities();
    },
    /**
     * Get entities by domain
     */
    getEntitiesByDomain(domain) {
        return getRegistry().getEntitiesByDomain(domain);
    },
    /**
     * Get entities by class
     */
    getEntitiesByClass(entityClass) {
        return getRegistry().getEntitiesByClass(entityClass);
    },
    /**
     * Get outgoing relationships for an entity
     */
    getOutgoingRelationships(urn) {
        return getRegistry().getOutgoingRelationships(urn);
    },
    /**
     * Get incoming relationships for an entity
     */
    getIncomingRelationships(urn) {
        return getRegistry().getIncomingRelationships(urn);
    },
    /**
     * Get entities this entity depends on
     */
    getDependencies(urn) {
        return getRegistry().getDependencies(urn);
    },
    /**
     * Get entities that depend on this entity
     */
    getDependents(urn) {
        return getRegistry().getDependents(urn);
    },
    /**
     * Check if entity exists
     */
    hasEntity(urn) {
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
function __resetRegistryForTesting() {
    _registry = null;
    _initialized = false;
}

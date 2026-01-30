/**
 * Registry Core Module Index
 * 
 * Public exports for Registry-Driven Architecture.
 */

// Types
export * from './registry.types';

// Loader
export { RegistryLoader, registryLoader, LoaderResult, LoaderError } from './registry.loader';

// Validator
export { RegistryValidator, registryValidator } from './registry.validator';

// Graph
export { RegistryGraph } from './registry.graph';

// Singleton
export {
    bootstrapRegistry,
    getRegistry,
    isRegistryInitialized,
    Registry,
    __resetRegistryForTesting
} from './registry.singleton';

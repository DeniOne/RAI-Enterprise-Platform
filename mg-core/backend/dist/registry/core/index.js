"use strict";
/**
 * Registry Core Module Index
 *
 * Public exports for Registry-Driven Architecture.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__resetRegistryForTesting = exports.Registry = exports.isRegistryInitialized = exports.getRegistry = exports.bootstrapRegistry = exports.RegistryGraph = exports.registryValidator = exports.RegistryValidator = exports.registryLoader = exports.RegistryLoader = void 0;
// Types
__exportStar(require("./registry.types"), exports);
// Loader
var registry_loader_1 = require("./registry.loader");
Object.defineProperty(exports, "RegistryLoader", { enumerable: true, get: function () { return registry_loader_1.RegistryLoader; } });
Object.defineProperty(exports, "registryLoader", { enumerable: true, get: function () { return registry_loader_1.registryLoader; } });
// Validator
var registry_validator_1 = require("./registry.validator");
Object.defineProperty(exports, "RegistryValidator", { enumerable: true, get: function () { return registry_validator_1.RegistryValidator; } });
Object.defineProperty(exports, "registryValidator", { enumerable: true, get: function () { return registry_validator_1.registryValidator; } });
// Graph
var registry_graph_1 = require("./registry.graph");
Object.defineProperty(exports, "RegistryGraph", { enumerable: true, get: function () { return registry_graph_1.RegistryGraph; } });
// Singleton
var registry_singleton_1 = require("./registry.singleton");
Object.defineProperty(exports, "bootstrapRegistry", { enumerable: true, get: function () { return registry_singleton_1.bootstrapRegistry; } });
Object.defineProperty(exports, "getRegistry", { enumerable: true, get: function () { return registry_singleton_1.getRegistry; } });
Object.defineProperty(exports, "isRegistryInitialized", { enumerable: true, get: function () { return registry_singleton_1.isRegistryInitialized; } });
Object.defineProperty(exports, "Registry", { enumerable: true, get: function () { return registry_singleton_1.Registry; } });
Object.defineProperty(exports, "__resetRegistryForTesting", { enumerable: true, get: function () { return registry_singleton_1.__resetRegistryForTesting; } });

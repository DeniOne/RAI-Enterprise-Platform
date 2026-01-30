"use strict";
/**
 * Registry Loader
 *
 * Responsible for:
 * - Recursive scanning of bootstrap directories
 * - Loading and parsing JSON files
 * - Sorting by prefix (01_, 02_, etc.)
 * - Error handling with clear messages
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryLoader = exports.RegistryLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const logger_1 = require("../../config/logger");
// =============================================================================
// REGISTRY LOADER
// =============================================================================
class RegistryLoader {
    bootstrapDir;
    constructor(bootstrapDir) {
        this.bootstrapDir = bootstrapDir || path.join(__dirname, '../bootstrap');
    }
    /**
     * Load all entity definitions from bootstrap directories.
     * Throws on any error - fail-fast approach.
     */
    async load() {
        logger_1.logger.info(`[RegistryLoader] Starting load from: ${this.bootstrapDir}`);
        // 1. Verify bootstrap directory exists
        if (!fs.existsSync(this.bootstrapDir)) {
            throw new Error(`Bootstrap directory not found: ${this.bootstrapDir}`);
        }
        // 2. Scan for JSON files
        const jsonFiles = this.scanDirectory(this.bootstrapDir);
        logger_1.logger.info(`[RegistryLoader] Found ${jsonFiles.length} JSON files`);
        if (jsonFiles.length === 0) {
            throw new Error('No JSON files found in bootstrap directory');
        }
        // 3. Sort files by path (respects 00_, 01_, etc. prefixes)
        jsonFiles.sort((a, b) => a.localeCompare(b));
        // 4. Load and parse each file
        const entities = [];
        const errors = [];
        const checksumData = [];
        for (const file of jsonFiles) {
            try {
                const entity = await this.loadFile(file);
                if (entity) {
                    entities.push(entity);
                    checksumData.push(JSON.stringify(entity));
                }
            }
            catch (err) {
                errors.push({
                    file,
                    message: err instanceof Error ? err.message : String(err),
                    cause: err instanceof Error ? err : undefined
                });
            }
        }
        // 5. Fail if any errors occurred
        if (errors.length > 0) {
            const errorMessages = errors.map(e => `  - ${e.file}: ${e.message}`).join('\n');
            throw new Error(`Registry load failed with ${errors.length} error(s):\n${errorMessages}`);
        }
        // 6. Calculate checksum
        const checksum = (0, crypto_1.createHash)('sha256')
            .update(checksumData.join(''))
            .digest('hex')
            .substring(0, 16);
        logger_1.logger.info(`[RegistryLoader] Loaded ${entities.length} entities, checksum: ${checksum}`);
        return {
            entities,
            checksum,
            loadedFiles: jsonFiles,
            errors
        };
    }
    /**
     * Recursively scan directory for *.entity.json files
     */
    scanDirectory(dir) {
        const files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        // Sort entries by name to ensure consistent ordering
        entries.sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Recurse into subdirectories
                files.push(...this.scanDirectory(fullPath));
            }
            else if (entry.isFile() && entry.name.endsWith('.entity.json')) {
                files.push(fullPath);
            }
        }
        return files;
    }
    /**
     * Load and parse a single entity JSON file
     */
    async loadFile(filePath) {
        // Read file
        const content = fs.readFileSync(filePath, 'utf-8');
        // Parse JSON
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch (err) {
            throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
        }
        // Validate structure
        if (!parsed.entity_type) {
            throw new Error('Missing "entity_type" root property');
        }
        const entity = parsed.entity_type;
        // Validate required fields
        const requiredFields = ['urn', 'name', 'domain', 'class', 'lifecycle_fsm_urn', 'schema'];
        for (const field of requiredFields) {
            if (!(field in entity)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        // Validate schema structure
        if (!entity.schema || typeof entity.schema !== 'object') {
            throw new Error('Invalid schema: must be an object');
        }
        if (!Array.isArray(entity.schema.attributes)) {
            throw new Error('Invalid schema.attributes: must be an array');
        }
        if (!Array.isArray(entity.schema.relationships)) {
            throw new Error('Invalid schema.relationships: must be an array');
        }
        // Validate class
        const validClasses = ['core', 'reference', 'relation', 'meta'];
        if (!validClasses.includes(entity.class)) {
            throw new Error(`Invalid class "${entity.class}". Must be one of: ${validClasses.join(', ')}`);
        }
        logger_1.logger.debug(`[RegistryLoader] Loaded: ${entity.urn}`);
        return entity;
    }
}
exports.RegistryLoader = RegistryLoader;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
exports.registryLoader = new RegistryLoader();

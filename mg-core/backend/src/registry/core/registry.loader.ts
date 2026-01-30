/**
 * Registry Loader
 * 
 * Responsible for:
 * - Recursive scanning of bootstrap directories
 * - Loading and parsing JSON files
 * - Sorting by prefix (01_, 02_, etc.)
 * - Error handling with clear messages
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { EntityTypeFile, EntityTypeDefinition } from './registry.types';
import { logger } from '../../config/logger';

// =============================================================================
// LOADER RESULT
// =============================================================================

export interface LoaderResult {
    entities: EntityTypeDefinition[];
    checksum: string;
    loadedFiles: string[];
    errors: LoaderError[];
}

export interface LoaderError {
    file: string;
    message: string;
    cause?: Error;
}

// =============================================================================
// REGISTRY LOADER
// =============================================================================

export class RegistryLoader {
    private readonly bootstrapDir: string;

    constructor(bootstrapDir?: string) {
        this.bootstrapDir = bootstrapDir || path.join(__dirname, '../bootstrap');
    }

    /**
     * Load all entity definitions from bootstrap directories.
     * Throws on any error - fail-fast approach.
     */
    async load(): Promise<LoaderResult> {
        logger.info(`[RegistryLoader] Starting load from: ${this.bootstrapDir}`);

        // 1. Verify bootstrap directory exists
        if (!fs.existsSync(this.bootstrapDir)) {
            throw new Error(`Bootstrap directory not found: ${this.bootstrapDir}`);
        }

        // 2. Scan for JSON files
        const jsonFiles = this.scanDirectory(this.bootstrapDir);
        logger.info(`[RegistryLoader] Found ${jsonFiles.length} JSON files`);

        if (jsonFiles.length === 0) {
            throw new Error('No JSON files found in bootstrap directory');
        }

        // 3. Sort files by path (respects 00_, 01_, etc. prefixes)
        jsonFiles.sort((a, b) => a.localeCompare(b));

        // 4. Load and parse each file
        const entities: EntityTypeDefinition[] = [];
        const errors: LoaderError[] = [];
        const checksumData: string[] = [];

        for (const file of jsonFiles) {
            try {
                const entity = await this.loadFile(file);
                if (entity) {
                    entities.push(entity);
                    checksumData.push(JSON.stringify(entity));
                }
            } catch (err) {
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
        const checksum = createHash('sha256')
            .update(checksumData.join(''))
            .digest('hex')
            .substring(0, 16);

        logger.info(`[RegistryLoader] Loaded ${entities.length} entities, checksum: ${checksum}`);

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
    private scanDirectory(dir: string): string[] {
        const files: string[] = [];

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        // Sort entries by name to ensure consistent ordering
        entries.sort((a, b) => a.name.localeCompare(b.name));

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Recurse into subdirectories
                files.push(...this.scanDirectory(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.entity.json')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Load and parse a single entity JSON file
     */
    private async loadFile(filePath: string): Promise<EntityTypeDefinition> {
        // Read file
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse JSON
        let parsed: EntityTypeFile;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
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

        logger.debug(`[RegistryLoader] Loaded: ${entity.urn}`);

        return entity;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const registryLoader = new RegistryLoader();

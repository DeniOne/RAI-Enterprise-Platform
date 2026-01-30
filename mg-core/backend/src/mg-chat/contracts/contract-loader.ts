/**
 * MG Chat Contract Loader
 * 
 * Loads and validates MG Chat JSON contracts.
 * Fail-fast: any error prevents service startup.
 */

import * as fs from 'fs';
import * as path from 'path';
import { MGIntentMap, MGUxComponentMap, MGErrorUxMap, MGChatContracts } from './contract.types';
import { mgChatContractValidator } from './contract-validator';

// =============================================================================
// LOADER
// =============================================================================

export class MGChatContractLoader {
    private readonly contractsDir: string;
    private cachedContracts: MGChatContracts | null = null;

    constructor() {
        // Contracts are in documentation/ai/mg-chat/
        // From backend/src/mg-chat/contracts → go up 4 levels to project root
        this.contractsDir = path.join(__dirname, '..', '..', '..', '..', 'documentation', 'ai', 'mg-chat');
    }

    /**
     * Load all MG Chat contracts.
     * Idempotent: returns cached instance after first load.
     * Throws on any error.
     */
    load(): MGChatContracts {
        if (this.cachedContracts) {
            return this.cachedContracts;
        }

        console.log('[MGChatContractLoader] Loading contracts from:', this.contractsDir);

        // 1. Load JSON files
        const intents = this.loadJson<MGIntentMap>('mg_intent_map.json');
        const ux = this.loadJson<MGUxComponentMap>('mg_ux_components_map.json');
        const errors = this.loadJson<MGErrorUxMap>('error_ux_map.json');

        // 2. Validate
        mgChatContractValidator.validate(intents, ux, errors);

        // 3. Cache and return
        this.cachedContracts = Object.freeze({
            intents: Object.freeze(intents) as MGIntentMap,
            ux: Object.freeze(ux) as MGUxComponentMap,
            errors: Object.freeze(errors) as MGErrorUxMap
        });

        console.log('[MGChatContractLoader] ✅ Contracts loaded and validated');
        console.log(`  - Intents: ${intents.intents.length}`);
        console.log(`  - UX Components: ${Object.keys(ux.components).length}`);
        console.log(`  - Error Intents: ${errors.error_intents.length}`);

        return this.cachedContracts;
    }

    /**
     * Load and parse a single JSON file
     */
    private loadJson<T>(filename: string): T {
        const filePath = path.join(this.contractsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Contract file not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        try {
            return JSON.parse(content) as T;
        } catch (err) {
            throw new Error(`Failed to parse ${filename}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const mgChatContractLoader = new MGChatContractLoader();

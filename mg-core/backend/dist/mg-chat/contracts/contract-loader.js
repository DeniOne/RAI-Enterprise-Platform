"use strict";
/**
 * MG Chat Contract Loader
 *
 * Loads and validates MG Chat JSON contracts.
 * Fail-fast: any error prevents service startup.
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
exports.mgChatContractLoader = exports.MGChatContractLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const contract_validator_1 = require("./contract-validator");
// =============================================================================
// LOADER
// =============================================================================
class MGChatContractLoader {
    contractsDir;
    cachedContracts = null;
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
    load() {
        if (this.cachedContracts) {
            return this.cachedContracts;
        }
        console.log('[MGChatContractLoader] Loading contracts from:', this.contractsDir);
        // 1. Load JSON files
        const intents = this.loadJson('mg_intent_map.json');
        const ux = this.loadJson('mg_ux_components_map.json');
        const errors = this.loadJson('error_ux_map.json');
        // 2. Validate
        contract_validator_1.mgChatContractValidator.validate(intents, ux, errors);
        // 3. Cache and return
        this.cachedContracts = Object.freeze({
            intents: Object.freeze(intents),
            ux: Object.freeze(ux),
            errors: Object.freeze(errors)
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
    loadJson(filename) {
        const filePath = path.join(this.contractsDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Contract file not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
            return JSON.parse(content);
        }
        catch (err) {
            throw new Error(`Failed to parse ${filename}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
exports.MGChatContractLoader = MGChatContractLoader;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
exports.mgChatContractLoader = new MGChatContractLoader();

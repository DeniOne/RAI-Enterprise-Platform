"use strict";
/**
 * MG Chat Contract Validator
 *
 * Validates MG Chat contracts against JSON Schemas and cross-references.
 * Fail-fast: any error throws and prevents service startup.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mgChatContractValidator = exports.MGChatContractValidator = void 0;
const ajv_1 = __importDefault(require("ajv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// =============================================================================
// VALIDATOR
// =============================================================================
class MGChatContractValidator {
    ajv;
    schemasDir;
    constructor() {
        this.ajv = new ajv_1.default({ allErrors: true });
        // Schemas are in documentation/ai/mg-chat/schemas/
        // From backend/src/mg-chat/contracts → go up 4 levels to project root
        this.schemasDir = path.join(__dirname, '..', '..', '..', '..', 'documentation', 'ai', 'mg-chat', 'schemas');
    }
    /**
     * Validate all contracts: schema + cross-references
     */
    validate(intents, ux, errors) {
        // 1. Schema validation
        this.validateSchema(intents, 'intent.schema.json', 'mg_intent_map.json');
        this.validateSchema(ux, 'ux_components.schema.json', 'mg_ux_components_map.json');
        this.validateSchema(errors, 'error_ux.schema.json', 'error_ux_map.json');
        // 2. Cross-reference validation
        this.validateCrossReferences(intents, ux, errors);
    }
    /**
     * Validate contract against JSON Schema
     */
    validateSchema(data, schemaFile, contractName) {
        const schemaPath = path.join(this.schemasDir, schemaFile);
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        const validate = this.ajv.compile(schema);
        const valid = validate(data);
        if (!valid) {
            const errors = validate.errors?.map((err) => `  ${err.dataPath || err.instancePath || '/'}: ${err.message}`).join('\n');
            throw new Error(`Schema validation failed for ${contractName}:\n${errors}`);
        }
    }
    /**
     * Validate cross-references between contracts
     */
    validateCrossReferences(intents, ux, errors) {
        const validationErrors = [];
        // Collect all valid action IDs
        const intentIds = new Set(intents.intents.map(i => i.id));
        const componentIds = new Set(Object.keys(ux.components));
        const errorIds = new Set(errors.error_intents.map(e => e.id));
        const validTargets = new Set([...intentIds, ...componentIds, ...errorIds]);
        // Validate intent actions
        for (const intent of intents.intents) {
            const actions = intent.response?.actions || [];
            for (const actionId of actions) {
                if (!validTargets.has(actionId)) {
                    validationErrors.push(`Intent "${intent.id}" references unknown action: "${actionId}"`);
                }
            }
        }
        // Validate UX component action_ids
        for (const [compId, comp] of Object.entries(ux.components)) {
            for (let rowIdx = 0; rowIdx < comp.layout.length; rowIdx++) {
                for (let btnIdx = 0; btnIdx < comp.layout[rowIdx].length; btnIdx++) {
                    const btn = comp.layout[rowIdx][btnIdx];
                    if (!validTargets.has(btn.action_id)) {
                        validationErrors.push(`Component "${compId}" [row ${rowIdx}, btn ${btnIdx}] references unknown action: "${btn.action_id}"`);
                    }
                }
            }
        }
        // Validate error intent actions
        for (const err of errors.error_intents) {
            const actions = err.response?.actions || [];
            for (const actionId of actions) {
                if (!validTargets.has(actionId)) {
                    validationErrors.push(`Error intent "${err.id}" references unknown action: "${actionId}"`);
                }
            }
        }
        if (validationErrors.length > 0) {
            throw new Error(`Cross-reference validation failed:\n${validationErrors.map(e => `  - ${e}`).join('\n')}`);
        }
    }
}
exports.MGChatContractValidator = MGChatContractValidator;
exports.mgChatContractValidator = new MGChatContractValidator();

/**
 * MG Chat Contract Validator
 * 
 * Validates MG Chat contracts against JSON Schemas and cross-references.
 * Fail-fast: any error throws and prevents service startup.
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { MGIntentMap, MGUxComponentMap, MGErrorUxMap } from './contract.types';

// =============================================================================
// VALIDATOR
// =============================================================================

export class MGChatContractValidator {
    private readonly ajv: any;
    private readonly schemasDir: string;

    constructor() {
        this.ajv = new Ajv({ allErrors: true });
        // Schemas are in documentation/ai/mg-chat/schemas/
        // From backend/src/mg-chat/contracts → go up 4 levels to project root
        this.schemasDir = path.join(__dirname, '..', '..', '..', '..', 'documentation', 'ai', 'mg-chat', 'schemas');
    }

    /**
     * Validate all contracts: schema + cross-references
     */
    validate(intents: MGIntentMap, ux: MGUxComponentMap, errors: MGErrorUxMap): void {
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
    private validateSchema(data: any, schemaFile: string, contractName: string): void {
        const schemaPath = path.join(this.schemasDir, schemaFile);

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        const validate = this.ajv.compile(schema);
        const valid = validate(data);

        if (!valid) {
            const errors = validate.errors?.map((err: any) =>
                `  ${err.dataPath || err.instancePath || '/'}: ${err.message}`
            ).join('\n');
            throw new Error(`Schema validation failed for ${contractName}:\n${errors}`);
        }
    }

    /**
     * Validate cross-references between contracts
     */
    private validateCrossReferences(
        intents: MGIntentMap,
        ux: MGUxComponentMap,
        errors: MGErrorUxMap
    ): void {
        const validationErrors: string[] = [];

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
                    validationErrors.push(
                        `Intent "${intent.id}" references unknown action: "${actionId}"`
                    );
                }
            }
        }

        // Validate UX component action_ids
        for (const [compId, comp] of Object.entries(ux.components)) {
            for (let rowIdx = 0; rowIdx < comp.layout.length; rowIdx++) {
                for (let btnIdx = 0; btnIdx < comp.layout[rowIdx].length; btnIdx++) {
                    const btn = comp.layout[rowIdx][btnIdx];
                    if (!validTargets.has(btn.action_id)) {
                        validationErrors.push(
                            `Component "${compId}" [row ${rowIdx}, btn ${btnIdx}] references unknown action: "${btn.action_id}"`
                        );
                    }
                }
            }
        }

        // Validate error intent actions
        for (const err of errors.error_intents) {
            const actions = err.response?.actions || [];
            for (const actionId of actions) {
                if (!validTargets.has(actionId)) {
                    validationErrors.push(
                        `Error intent "${err.id}" references unknown action: "${actionId}"`
                    );
                }
            }
        }

        if (validationErrors.length > 0) {
            throw new Error(
                `Cross-reference validation failed:\n${validationErrors.map(e => `  - ${e}`).join('\n')}`
            );
        }
    }
}

export const mgChatContractValidator = new MGChatContractValidator();

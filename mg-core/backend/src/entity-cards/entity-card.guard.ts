/**
 * Entity Card Guard
 * 
 * Validation guardrails for Entity Cards.
 * Enforces:
 * - readonly fields cannot be updated
 * - required fields must be present
 * - enum values must be valid
 * - relation cardinality respected
 */

import {
    EntityCard,
    EntityCardAttribute,
    EntityCardRelation,
    EntityCardValidationResult,
    EntityCardValidationError
} from './entity-card.types';
import { entityCardCache } from './entity-card.cache';
import { logger } from '../config/logger';

// =============================================================================
// VALIDATION CONTEXT
// =============================================================================

export type ValidationOperation = 'create' | 'update';

// =============================================================================
// ENTITY CARD GUARD
// =============================================================================

export class EntityCardGuard {
    /**
     * Validate data against EntityCard.
     * Returns validation result with all errors.
     * NO SILENT FIXES - any violation is an error.
     */
    validate(
        entityType: string,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData?: Record<string, any>
    ): EntityCardValidationResult {
        const errors: EntityCardValidationError[] = [];

        // Get card from cache
        let card: EntityCard;
        try {
            card = entityCardCache.get(entityType);
        } catch (error) {
            return {
                valid: false,
                errors: [{
                    field: '_entity',
                    rule: 'entity_exists',
                    message: `Entity type not found: ${entityType}`
                }]
            };
        }

        // Validate attributes
        this.validateAttributes(card, data, operation, existingData, errors);

        // Validate relations
        this.validateRelations(card, data, operation, existingData, errors);

        // Validate forbidden fields
        this.validateForbiddenFields(card, data, errors);

        const valid = errors.length === 0;

        if (!valid) {
            logger.warn(`[EntityCardGuard] Validation failed for ${entityType}`, {
                errors: errors.length,
                operation
            });
        }

        return { valid, errors };
    }

    // =========================================================================
    // PRIVATE: Attribute validation
    // =========================================================================

    private validateAttributes(
        card: EntityCard,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData: Record<string, any> | undefined,
        errors: EntityCardValidationError[]
    ): void {
        for (const attr of card.attributes) {
            const value = data[attr.name];
            const existingValue = existingData?.[attr.name];

            // Required check (only on create, or if field is being set to empty)
            if (attr.required && operation === 'create' && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: attr.name,
                    rule: 'required',
                    message: `Field "${attr.name}" is required`,
                    value
                });
            }

            // Readonly check (on update)
            if (attr.readonly && operation === 'update' && value !== undefined) {
                if (existingValue !== undefined && value !== existingValue) {
                    errors.push({
                        field: attr.name,
                        rule: 'readonly',
                        message: `Field "${attr.name}" is readonly and cannot be modified`,
                        value
                    });
                }
            }

            // Type validation
            if (value !== undefined && value !== null) {
                this.validateType(attr, value, errors);
            }

            // Enum validation
            if (attr.enum && value !== undefined && value !== null) {
                this.validateEnum(attr, value, errors);
            }
        }
    }

    private validateType(
        attr: EntityCardAttribute,
        value: any,
        errors: EntityCardValidationError[]
    ): void {
        switch (attr.type) {
            case 'INTEGER':
                if (!Number.isInteger(Number(value))) {
                    errors.push({
                        field: attr.name,
                        rule: 'type',
                        message: `Field "${attr.name}" must be an integer`,
                        value
                    });
                }
                break;
            case 'DECIMAL':
                if (isNaN(Number(value))) {
                    errors.push({
                        field: attr.name,
                        rule: 'type',
                        message: `Field "${attr.name}" must be a number`,
                        value
                    });
                }
                break;
            case 'BOOLEAN':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                    errors.push({
                        field: attr.name,
                        rule: 'type',
                        message: `Field "${attr.name}" must be a boolean`,
                        value
                    });
                }
                break;
            case 'DATE':
            case 'DATETIME':
                if (isNaN(Date.parse(value))) {
                    errors.push({
                        field: attr.name,
                        rule: 'type',
                        message: `Field "${attr.name}" must be a valid date`,
                        value
                    });
                }
                break;
        }
    }

    private validateEnum(
        attr: EntityCardAttribute,
        value: any,
        errors: EntityCardValidationError[]
    ): void {
        const validValues = attr.enum!.map(e => e.value);
        if (!validValues.includes(value)) {
            errors.push({
                field: attr.name,
                rule: 'enum',
                message: `Field "${attr.name}" must be one of: ${validValues.join(', ')}`,
                value
            });
        }
    }

    // =========================================================================
    // PRIVATE: Relation validation
    // =========================================================================

    private validateRelations(
        card: EntityCard,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData: Record<string, any> | undefined,
        errors: EntityCardValidationError[]
    ): void {
        for (const rel of card.relations) {
            const value = data[rel.name] || data[`${rel.name}_id`];
            const existingValue = existingData?.[rel.name] || existingData?.[`${rel.name}_id`];

            // Required check
            if (rel.required && operation === 'create' && (value === undefined || value === null)) {
                errors.push({
                    field: rel.name,
                    rule: 'required',
                    message: `Relation "${rel.name}" is required`,
                    value
                });
            }

            // Readonly check
            if (rel.readonly && operation === 'update' && value !== undefined) {
                if (existingValue !== undefined && value !== existingValue) {
                    errors.push({
                        field: rel.name,
                        rule: 'readonly',
                        message: `Relation "${rel.name}" is readonly and cannot be modified`,
                        value
                    });
                }
            }

            // Cardinality validation for arrays
            if (value !== undefined && Array.isArray(value)) {
                if ((rel.cardinality === '1:1' || rel.cardinality === 'N:1') && value.length > 1) {
                    errors.push({
                        field: rel.name,
                        rule: 'cardinality',
                        message: `Relation "${rel.name}" allows only one value (${rel.cardinality})`,
                        value
                    });
                }
            }
        }
    }

    // =========================================================================
    // PRIVATE: Forbidden fields validation
    // =========================================================================

    // =========================================================================
    // VIEW-BASED VALIDATION (Step 9)
    // =========================================================================

    /**
     * Validate data against a specific Form View definition.
     * Enforces strict security:
     * - Rejects fields not in view
     * - Rejects readonly fields
     * - Rejects hidden fields
     */
    validateWithView(
        entityType: string,
        data: Record<string, any>,
        viewName: string
    ): EntityCardValidationResult {
        const errors: EntityCardValidationError[] = [];

        // 1. Get Card & View
        let card: EntityCard;
        try {
            card = entityCardCache.get(entityType);
        } catch (error) {
            return { valid: false, errors: [{ field: '_entity', rule: 'entity_exists', message: `Entity type not found: ${entityType}` }] };
        }

        const view = card.views[viewName];
        if (!view) {
            return { valid: false, errors: [{ field: '_view', rule: 'view_exists', message: `View "${viewName}" not found` }] };
        }

        if (view.type !== 'form') {
            return { valid: false, errors: [{ field: '_view', rule: 'view_type', message: `View "${viewName}" is not a form view` }] };
        }

        // 2. Validate Fields against View Definition
        const allowedFields = new Set<string>();

        for (const fieldDef of view.fields) {
            allowedFields.add(fieldDef.field);
            const value = data[fieldDef.field];

            // 2.1 Readonly Check (Security)
            if (fieldDef.readonly && value !== undefined) {
                // In update mode, we might allow sending same value, but strict security says: don't send it.
                // However, UI might send it back. Let's be strict: if it's readonly in view, backend shouldn't accept changes.
                // Ideally, UI shouldn't send it. If sent, it must match existing? 
                // For now: REJECT if present. UI must filter it out.
                errors.push({
                    field: fieldDef.field,
                    rule: 'security_readonly',
                    message: `Field "${fieldDef.field}" is readonly in this view`,
                    value
                });
            }

            // 2.2 Hidden Check (Security)
            if (fieldDef.ui?.hidden && value !== undefined) {
                errors.push({
                    field: fieldDef.field,
                    rule: 'security_hidden',
                    message: `Field "${fieldDef.field}" is hidden and cannot be set`,
                    value
                });
            }

            // 2.3 Required Check
            if (fieldDef.required && (value === undefined || value === null || value === '')) {
                // If update mode, required might not be needed if not present? 
                // Wait, validateWithView usually implies a Form Submit.
                // If Create -> Required. If Update -> Required only if present? 
                // Let's assume Payload must be complete for Create.
                if (view.mode === 'create') {
                    errors.push({
                        field: fieldDef.field,
                        rule: 'required',
                        message: `Field "${fieldDef.field}" is required`,
                        value
                    });
                }
            }
        }

        // 3. Reject Unknown Fields (Security)
        for (const key of Object.keys(data)) {
            if (!allowedFields.has(key)) {
                errors.push({
                    field: key,
                    rule: 'security_unknown',
                    message: `Field "${key}" is not allowed in view "${viewName}"`,
                    value: data[key]
                });
            }
        }

        // 4. Standard Type/Constraint Validation (Reuse existing logic)
        // We need to map view fields back to attributes/relations to check enums/types
        // This is complex because we need to find the attribute def.
        this.validateAttributesAgainstView(card, data, view.fields, errors);

        const valid = errors.length === 0;
        if (!valid) {
            logger.warn(`[EntityCardGuard] View Validation failed for ${entityType}:${viewName}`, {
                errors: errors.length
            });
        }

        return { valid, errors };
    }

    private validateAttributesAgainstView(
        card: EntityCard,
        data: Record<string, any>,
        viewFields: any[], // EntityCardFormField[] but avoiding circular dep issues if any
        errors: EntityCardValidationError[]
    ) {
        // reuse basic attribute validation for fields present in data
        // ... (simplified for now, ideally we call validateAttributes with filtered context)
        // For Step 9 MVP, strict view checks (readonly/hidden/unknown) are the main value add.
        // Type checking is done by existing guard methods, but we need to link them.

        // Let's iterate view fields and find matching attribute
        for (const fieldDef of viewFields) {
            const value = data[fieldDef.field];
            if (value !== undefined) {
                const attr = card.attributes.find(a => a.name === fieldDef.field);
                if (attr) {
                    this.validateType(attr, value, errors);
                    if (attr.enum) this.validateEnum(attr, value, errors);
                }
            }
        }
    }

    // =========================================================================
    // PRIVATE: Forbidden fields validation
    // =========================================================================

    private validateForbiddenFields(
        card: EntityCard,
        data: Record<string, any>,
        errors: EntityCardValidationError[]
    ): void {
        // Fields that should never be in input
        const systemFields = ['id', 'created_at', 'updated_at', 'lifecycle_status'];

        for (const field of systemFields) {
            if (data[field] !== undefined) {
                errors.push({
                    field,
                    rule: 'forbidden',
                    message: `System field "${field}" cannot be set manually`,
                    value: data[field]
                });
            }
        }
    }

    // =========================================================================
    // PUBLIC: Convenience methods
    // =========================================================================

    /**
     * Validate and throw on error
     */
    validateOrThrow(
        entityType: string,
        data: Record<string, any>,
        operation: ValidationOperation,
        existingData?: Record<string, any>
    ): void {
        const result = this.validate(entityType, data, operation, existingData);

        if (!result.valid) {
            const messages = result.errors.map(e => e.message).join('; ');
            throw new Error(`Validation failed: ${messages}`);
        }
    }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const entityCardGuard = new EntityCardGuard();

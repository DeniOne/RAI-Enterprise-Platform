/**
 * Registry Validator
 * 
 * Responsible for:
 * - Validating entity definitions against schema
 * - Checking relationship targets exist
 * - Detecting duplicate URNs
 * - Validating enum options
 * - Checking for circular required dependencies
 */

import {
    EntityTypeDefinition,
    AttributeDefinition,
    RelationshipDefinition,
    ValidationResult,
    ValidationError,
    RegistryAttributeType,
    RegistryCardinality
} from './registry.types';
import { logger } from '../../config/logger';

// =============================================================================
// VALIDATOR
// =============================================================================

export class RegistryValidator {
    private readonly validAttributeTypes: RegistryAttributeType[] = [
        'STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'ENUM', 'JSON'
    ];

    private readonly validCardinalities: RegistryCardinality[] = [
        'ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'
    ];

    /**
     * Validate all entity definitions.
     * Returns ValidationResult with errors and warnings.
     */
    validate(entities: EntityTypeDefinition[]): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        logger.info(`[RegistryValidator] Validating ${entities.length} entities`);

        // Build URN index for relationship validation
        const urnIndex = new Set(entities.map(e => e.urn));

        // Check for duplicates
        const urnCounts = new Map<string, number>();
        for (const entity of entities) {
            urnCounts.set(entity.urn, (urnCounts.get(entity.urn) || 0) + 1);
        }

        for (const [urn, count] of urnCounts) {
            if (count > 1) {
                errors.push({
                    file: 'multiple',
                    entity_urn: urn,
                    message: `Duplicate entity URN: "${urn}" appears ${count} times`,
                    severity: 'error'
                });
            }
        }

        // Validate each entity
        for (const entity of entities) {
            this.validateEntity(entity, urnIndex, errors, warnings);
        }

        // Check for circular required dependencies
        this.checkCircularDependencies(entities, errors);

        const valid = errors.length === 0;

        if (!valid) {
            logger.error(`[RegistryValidator] Validation FAILED with ${errors.length} error(s)`);
        } else {
            logger.info(`[RegistryValidator] Validation PASSED (${warnings.length} warning(s))`);
        }

        return { valid, errors, warnings };
    }

    /**
     * Validate a single entity definition
     */
    private validateEntity(
        entity: EntityTypeDefinition,
        urnIndex: Set<string>,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // Validate URN format
        if (!entity.urn.startsWith('urn:mg:')) {
            errors.push({
                file: entity.urn,
                entity_urn: entity.urn,
                field: 'urn',
                message: `Invalid URN format. Must start with "urn:mg:"`,
                severity: 'error'
            });
        }

        // Validate lifecycle FSM URN
        if (!entity.lifecycle_fsm_urn.startsWith('urn:mg:fsm:')) {
            warnings.push({
                file: entity.urn,
                entity_urn: entity.urn,
                field: 'lifecycle_fsm_urn',
                message: `Lifecycle FSM URN should start with "urn:mg:fsm:"`,
                severity: 'warning'
            });
        }

        // Validate relation entities have no business attributes (temporal exception)
        if (entity.class === 'relation') {
            const nonTemporalAttrs = entity.schema.attributes.filter(
                a => !['start_date', 'end_date', 'relation_type'].includes(a.name)
            );
            if (nonTemporalAttrs.length > 0) {
                warnings.push({
                    file: entity.urn,
                    entity_urn: entity.urn,
                    message: `Relation entity has non-temporal attributes: ${nonTemporalAttrs.map(a => a.name).join(', ')}`,
                    severity: 'warning'
                });
            }

            // Relation entities MUST have relationships
            if (entity.schema.relationships.length === 0) {
                errors.push({
                    file: entity.urn,
                    entity_urn: entity.urn,
                    message: `Relation entity must have at least one relationship`,
                    severity: 'error'
                });
            }
        }

        // Validate attributes
        for (const attr of entity.schema.attributes) {
            this.validateAttribute(entity.urn, attr, errors, warnings);
        }

        // Validate relationships
        for (const rel of entity.schema.relationships) {
            this.validateRelationship(entity.urn, rel, urnIndex, errors, warnings);
        }

        // Check that entity has at least attributes OR relationships
        if (entity.schema.attributes.length === 0 && entity.schema.relationships.length === 0) {
            // Allow core/reference with base-only if they have no custom schema
            // This is valid per ontology - base fields are inherited
        }
    }

    /**
     * Validate a single attribute definition
     */
    private validateAttribute(
        entityUrn: string,
        attr: AttributeDefinition,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // Validate type
        if (!this.validAttributeTypes.includes(attr.type)) {
            errors.push({
                file: entityUrn,
                entity_urn: entityUrn,
                field: `attributes.${attr.name}.type`,
                message: `Invalid attribute type "${attr.type}". Valid types: ${this.validAttributeTypes.join(', ')}`,
                severity: 'error'
            });
        }

        // ENUM must have options
        if (attr.type === 'ENUM' && (!attr.enum_options || attr.enum_options.length === 0)) {
            errors.push({
                file: entityUrn,
                entity_urn: entityUrn,
                field: `attributes.${attr.name}`,
                message: `ENUM attribute "${attr.name}" must have enum_options`,
                severity: 'error'
            });
        }

        // Non-ENUM should not have options
        if (attr.type !== 'ENUM' && attr.enum_options && attr.enum_options.length > 0) {
            warnings.push({
                file: entityUrn,
                entity_urn: entityUrn,
                field: `attributes.${attr.name}`,
                message: `Non-ENUM attribute "${attr.name}" has enum_options (will be ignored)`,
                severity: 'warning'
            });
        }

        // Validate enum option values
        if (attr.enum_options) {
            const values = new Set<string>();
            for (const opt of attr.enum_options) {
                if (values.has(opt.value)) {
                    errors.push({
                        file: entityUrn,
                        entity_urn: entityUrn,
                        field: `attributes.${attr.name}.enum_options`,
                        message: `Duplicate enum value "${opt.value}"`,
                        severity: 'error'
                    });
                }
                values.add(opt.value);
            }
        }
    }

    /**
     * Validate a single relationship definition
     */
    private validateRelationship(
        entityUrn: string,
        rel: RelationshipDefinition,
        urnIndex: Set<string>,
        errors: ValidationError[],
        warnings: ValidationError[]
    ): void {
        // Validate cardinality
        if (!this.validCardinalities.includes(rel.cardinality)) {
            errors.push({
                file: entityUrn,
                entity_urn: entityUrn,
                field: `relationships.${rel.name}.cardinality`,
                message: `Invalid cardinality "${rel.cardinality}". Valid: ${this.validCardinalities.join(', ')}`,
                severity: 'error'
            });
        }

        // Validate target exists
        if (!urnIndex.has(rel.target_entity_type_urn)) {
            errors.push({
                file: entityUrn,
                entity_urn: entityUrn,
                field: `relationships.${rel.name}.target_entity_type_urn`,
                message: `Target entity "${rel.target_entity_type_urn}" does not exist`,
                severity: 'error'
            });
        }
    }

    /**
     * Check for circular required dependencies
     * A -> B -> C -> A (all required = blocking cycle)
     */
    private checkCircularDependencies(
        entities: EntityTypeDefinition[],
        errors: ValidationError[]
    ): void {
        const entityMap = new Map(entities.map(e => [e.urn, e]));

        for (const entity of entities) {
            const visited = new Set<string>();
            const path: string[] = [];

            if (this.hasCircularDependency(entity.urn, entityMap, visited, path)) {
                errors.push({
                    file: entity.urn,
                    entity_urn: entity.urn,
                    message: `Circular required dependency detected: ${path.join(' -> ')}`,
                    severity: 'error'
                });
            }
        }
    }

    private hasCircularDependency(
        urn: string,
        entityMap: Map<string, EntityTypeDefinition>,
        visited: Set<string>,
        path: string[]
    ): boolean {
        if (path.includes(urn)) {
            path.push(urn);
            return true;
        }

        if (visited.has(urn)) {
            return false;
        }

        visited.add(urn);
        path.push(urn);

        const entity = entityMap.get(urn);
        if (!entity) return false;

        for (const rel of entity.schema.relationships) {
            if (rel.required) {
                if (this.hasCircularDependency(rel.target_entity_type_urn, entityMap, visited, [...path])) {
                    return true;
                }
            }
        }

        return false;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const registryValidator = new RegistryValidator();

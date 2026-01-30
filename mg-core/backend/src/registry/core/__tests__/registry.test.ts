/**
 * Registry Bootstrap Loader Tests
 * 
 * Обязательные unit-тесты:
 * - валидный registry → OK
 * - missing entity → FAIL
 * - broken relation → FAIL
 * - duplicate entity → FAIL
 * - enum value mismatch → FAIL
 */

import * as fs from 'fs';
import * as path from 'path';
import { RegistryLoader } from '../registry.loader';
import { RegistryValidator } from '../registry.validator';
import { RegistryGraph } from '../registry.graph';
import {
    bootstrapRegistry,
    getRegistry,
    isRegistryInitialized,
    __resetRegistryForTesting
} from '../registry.singleton';
import { EntityTypeDefinition } from '../registry.types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createValidEntity(urn: string, options: Partial<EntityTypeDefinition> = {}): EntityTypeDefinition {
    return {
        urn,
        name: urn.split(':').pop() || 'Entity',
        domain: 'test',
        class: 'reference',
        description: 'Test entity',
        lifecycle_fsm_urn: 'urn:mg:fsm:default:v1',
        schema: {
            attributes: [],
            relationships: []
        },
        ...options
    };
}

// =============================================================================
// VALIDATOR TESTS
// =============================================================================

describe('RegistryValidator', () => {
    let validator: RegistryValidator;

    beforeEach(() => {
        validator = new RegistryValidator();
    });

    describe('valid registry', () => {
        it('should pass validation for valid entities', () => {
            const entities = [
                createValidEntity('urn:mg:type:role'),
                createValidEntity('urn:mg:type:permission', {
                    schema: {
                        attributes: [
                            { name: 'action', type: 'STRING', required: true }
                        ],
                        relationships: []
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('duplicate entity', () => {
        it('should fail on duplicate URNs', () => {
            const entities = [
                createValidEntity('urn:mg:type:role'),
                createValidEntity('urn:mg:type:role') // duplicate
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true);
        });
    });

    describe('broken relation', () => {
        it('should fail when relationship target does not exist', () => {
            const entities = [
                createValidEntity('urn:mg:type:employee', {
                    schema: {
                        attributes: [],
                        relationships: [
                            {
                                name: 'person',
                                target_entity_type_urn: 'urn:mg:type:nonexistent', // broken
                                cardinality: 'MANY_TO_ONE',
                                required: true
                            }
                        ]
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('does not exist'))).toBe(true);
        });
    });

    describe('enum validation', () => {
        it('should fail when ENUM has no options', () => {
            const entities = [
                createValidEntity('urn:mg:type:status', {
                    schema: {
                        attributes: [
                            {
                                name: 'status_type',
                                type: 'ENUM',
                                required: true
                                // missing enum_options
                            }
                        ],
                        relationships: []
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('enum_options'))).toBe(true);
        });

        it('should fail on duplicate enum values', () => {
            const entities = [
                createValidEntity('urn:mg:type:status', {
                    schema: {
                        attributes: [
                            {
                                name: 'status_type',
                                type: 'ENUM',
                                required: true,
                                enum_options: [
                                    { value: 'active', label: 'Active' },
                                    { value: 'active', label: 'Also Active' } // duplicate
                                ]
                            }
                        ],
                        relationships: []
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('Duplicate enum'))).toBe(true);
        });
    });

    describe('relation entity validation', () => {
        it('should fail when relation entity has no relationships', () => {
            const entities = [
                createValidEntity('urn:mg:type:role_permission', {
                    class: 'relation',
                    schema: {
                        attributes: [],
                        relationships: [] // relation must have relationships
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('must have at least one relationship'))).toBe(true);
        });
    });

    describe('invalid attribute type', () => {
        it('should fail on invalid attribute type', () => {
            const entities = [
                createValidEntity('urn:mg:type:test', {
                    schema: {
                        attributes: [
                            { name: 'field', type: 'INVALID_TYPE' as any, required: true }
                        ],
                        relationships: []
                    }
                })
            ];

            const result = validator.validate(entities);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.message.includes('Invalid attribute type'))).toBe(true);
        });
    });
});

// =============================================================================
// GRAPH TESTS
// =============================================================================

describe('RegistryGraph', () => {
    it('should build graph with correct node count', () => {
        const entities = [
            createValidEntity('urn:mg:type:role'),
            createValidEntity('urn:mg:type:permission')
        ];

        const graph = new RegistryGraph(entities, 'test-checksum');

        expect(graph.metadata.entityCount).toBe(2);
        expect(graph.hasEntity('urn:mg:type:role')).toBe(true);
        expect(graph.hasEntity('urn:mg:type:permission')).toBe(true);
        expect(graph.hasEntity('urn:mg:type:nonexistent')).toBe(false);
    });

    it('should calculate dependencies correctly', () => {
        const entities = [
            createValidEntity('urn:mg:type:person'),
            createValidEntity('urn:mg:type:employee', {
                schema: {
                    attributes: [],
                    relationships: [
                        {
                            name: 'person',
                            target_entity_type_urn: 'urn:mg:type:person',
                            cardinality: 'MANY_TO_ONE',
                            required: true
                        }
                    ]
                }
            })
        ];

        const graph = new RegistryGraph(entities, 'test');

        expect(graph.getDependencies('urn:mg:type:employee')).toContain('urn:mg:type:person');
        expect(graph.getDependents('urn:mg:type:person')).toContain('urn:mg:type:employee');
    });

    it('should filter entities by domain', () => {
        const entities = [
            createValidEntity('urn:mg:type:role', { domain: 'security' }),
            createValidEntity('urn:mg:type:person', { domain: 'human' })
        ];

        const graph = new RegistryGraph(entities, 'test');

        expect(graph.getEntitiesByDomain('security')).toHaveLength(1);
        expect(graph.getEntitiesByDomain('human')).toHaveLength(1);
    });

    it('should filter entities by class', () => {
        const entities = [
            createValidEntity('urn:mg:type:person', { class: 'core' }),
            createValidEntity('urn:mg:type:role', { class: 'reference' })
        ];

        const graph = new RegistryGraph(entities, 'test');

        expect(graph.getEntitiesByClass('core')).toHaveLength(1);
        expect(graph.getEntitiesByClass('reference')).toHaveLength(1);
    });
});

// =============================================================================
// SINGLETON TESTS
// =============================================================================

describe('RegistrySingleton', () => {
    beforeEach(() => {
        __resetRegistryForTesting();
    });

    it('should throw when accessing uninitialized registry', () => {
        expect(() => getRegistry()).toThrow('Registry not initialized');
    });

    it('should report initialization state correctly', () => {
        expect(isRegistryInitialized()).toBe(false);
    });
});

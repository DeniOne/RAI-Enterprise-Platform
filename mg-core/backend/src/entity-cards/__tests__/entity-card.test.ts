/**
 * Entity Card Tests
 * 
 * Unit tests for Entity Card System.
 */

import {
    EntityCard,
    EntityCardAttribute,
    EntityCardRelation
} from '../entity-card.types';
import { EntityCardBuilder } from '../entity-card.builder';
import { EntityCardGuard } from '../entity-card.guard';
import { EntityCardCache } from '../entity-card.cache';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockCard: EntityCard = {
    entityType: 'person',
    urn: 'urn:mg:type:person',
    name: 'Person',
    attributes: [
        {
            name: 'first_name',
            type: 'STRING',
            required: true,
            readonly: false,
            unique: false,
            ui: { label: 'First Name', widget: 'text', order: 0 }
        },
        {
            name: 'status',
            type: 'ENUM',
            required: true,
            readonly: false,
            unique: false,
            enum: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
            ],
            ui: { label: 'Status', widget: 'select', order: 1 }
        },
        {
            name: 'created_at',
            type: 'DATETIME',
            required: false,
            readonly: true,
            unique: false,
            ui: { label: 'Created At', widget: 'datetime', order: 2 }
        }
    ],
    relations: [
        {
            name: 'department',
            target: 'urn:mg:type:org_unit',
            targetName: 'Org Unit',
            cardinality: 'N:1',
            required: true,
            readonly: false,
            ui: { label: 'Department', widget: 'relation', order: 0 }
        }
    ],
    lifecycle: {
        initialState: 'draft',
        states: [
            { code: 'draft', label: 'Draft', isFinal: false },
            { code: 'active', label: 'Active', isFinal: false },
            { code: 'archived', label: 'Archived', isFinal: true }
        ],
        transitions: {
            'draft': ['active'],
            'active': ['archived'],
            'archived': []
        }
    },
    permissions: {
        create: ['human:person:create'],
        read: ['human:person:read'],
        update: ['human:person:update'],
        delete: ['human:person:delete'],
        archive: ['human:person:archive']
    },
    metadata: {
        domain: 'human',
        class: 'core',
        tags: [],
        description: 'Physical person',
        version: '1.0.0'
    },
    checksum: 'abc123',
    builtAt: new Date().toISOString()
};

// =============================================================================
// GUARD TESTS
// =============================================================================

describe('EntityCardGuard', () => {
    let guard: EntityCardGuard;
    let mockCache: any;

    beforeEach(() => {
        // Mock cache that returns mockCard
        mockCache = {
            get: jest.fn().mockReturnValue(mockCard),
            has: jest.fn().mockReturnValue(true)
        };

        // Create guard with mocked cache
        guard = new EntityCardGuard();
        // Override cache access
        (guard as any).cache = mockCache;
    });

    describe('required field validation', () => {
        it('should fail when required field is missing on create', () => {
            const result = guard.validate('person', {}, 'create');

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'first_name' && e.rule === 'required')).toBe(true);
        });

        it('should pass when required field is present', () => {
            const result = guard.validate('person', {
                first_name: 'John',
                status: 'active',
                department: 'dept-123'
            }, 'create');

            // May have other errors but not required for first_name
            expect(result.errors.filter(e => e.field === 'first_name' && e.rule === 'required')).toHaveLength(0);
        });
    });

    describe('readonly field validation', () => {
        it('should fail when readonly field is modified on update', () => {
            const result = guard.validate(
                'person',
                { created_at: '2025-01-01' },
                'update',
                { created_at: '2024-01-01' }
            );

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'created_at' && e.rule === 'readonly')).toBe(true);
        });
    });

    describe('enum validation', () => {
        it('should fail when enum value is invalid', () => {
            const result = guard.validate('person', {
                first_name: 'John',
                status: 'INVALID_STATUS',
                department: 'dept-123'
            }, 'create');

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'status' && e.rule === 'enum')).toBe(true);
        });

        it('should pass with valid enum value', () => {
            const result = guard.validate('person', {
                first_name: 'John',
                status: 'active',
                department: 'dept-123'
            }, 'create');

            expect(result.errors.filter(e => e.field === 'status' && e.rule === 'enum')).toHaveLength(0);
        });
    });

    describe('forbidden fields validation', () => {
        it('should fail when system field is provided', () => {
            const result = guard.validate('person', {
                first_name: 'John',
                status: 'active',
                department: 'dept-123',
                id: 'manual-id'
            }, 'create');

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'id' && e.rule === 'forbidden')).toBe(true);
        });
    });

    describe('relation validation', () => {
        it('should fail when required relation is missing on create', () => {
            const result = guard.validate('person', {
                first_name: 'John',
                status: 'active'
                // department missing
            }, 'create');

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'department' && e.rule === 'required')).toBe(true);
        });
    });
});

// =============================================================================
// SNAPSHOT TESTS
// =============================================================================

describe('EntityCard snapshot', () => {
    it('should have deterministic structure', () => {
        // Verify card structure is stable
        expect(mockCard.entityType).toBe('person');
        expect(mockCard.attributes).toHaveLength(3);
        expect(mockCard.relations).toHaveLength(1);
        expect(mockCard.lifecycle.states).toHaveLength(3);
        expect(mockCard.permissions.create).toContain('human:person:create');
    });
});

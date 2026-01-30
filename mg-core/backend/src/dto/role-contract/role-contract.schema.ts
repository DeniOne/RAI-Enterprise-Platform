/**
 * Role Contract Zod Schemas - Phase 0.2
 * 
 * Zod schemas для валидации Role и RoleContract.
 * Canon: RoleContract = API между человеком и системой.
 * 
 * Эти схемы используются для:
 * - Валидации входных данных
 * - Runtime type checking
 * - Автоматической генерации TypeScript типов
 */

import { z } from 'zod';

// =============================================================================
// KPI DEFINITION SCHEMA
// =============================================================================

/**
 * Schema для KPI Definition
 * Canon: KPI — датчики, не цели.
 */
export const KPIDefinitionSchema = z.object({
    name: z.string().min(1, 'KPI name is required'),
    formula: z.string().min(1, 'Formula is required'),
    target: z.number().positive('Target must be positive'),
    threshold_warning: z.number().describe('Warning threshold (yellow zone)'),
    threshold_critical: z.number().describe('Critical threshold (red zone)'),
    unit: z.string().min(1, 'Unit is required'),
    calculation_period: z.enum(['daily', 'weekly', 'monthly']),
});

export type KPIDefinitionInput = z.infer<typeof KPIDefinitionSchema>;

// =============================================================================
// PERMISSION SCHEMA
// =============================================================================

/**
 * Schema для Permission
 */
export const PermissionSchema = z.object({
    resource: z.string().min(1, 'Resource is required'),
    actions: z
        .array(z.enum(['create', 'read', 'update', 'delete']))
        .min(1, 'At least one action is required'),
    conditions: z.record(z.string(), z.unknown()).optional(),
});

export type PermissionInput = z.infer<typeof PermissionSchema>;

// =============================================================================
// GROWTH PATH SCHEMA
// =============================================================================

/**
 * Schema для Growth Path
 */
export const GrowthPathSchema = z
    .object({
        from_level: z.number().int().min(1).max(5),
        to_level: z.number().int().min(1).max(5),
        requirements: z.array(z.string()).min(1, 'At least one requirement'),
        estimated_duration_months: z.number().positive(),
    })
    .refine((data) => data.to_level > data.from_level, {
        message: 'to_level must be greater than from_level',
        path: ['to_level'],
    });

export type GrowthPathInput = z.infer<typeof GrowthPathSchema>;

// =============================================================================
// ROLE SCHEMA
// =============================================================================

/**
 * Schema для создания Role
 */
export const CreateRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    code: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[A-Z_]+$/, 'Code must be uppercase letters and underscores only'),
    description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

// =============================================================================
// ROLE CONTRACT SCHEMA
// =============================================================================

/**
 * Schema для RoleContract
 * 
 * Canon: Нет роли без контракта.
 * 
 * Обязательные поля:
 * - mission (минимум 10 символов)
 * - value_product (ЦКП)
 * - responsibility_zones (минимум 1)
 * - kpi_definitions (минимум 1)
 */
export const RoleContractSchema = z.object({
    role_id: z.string().uuid('Invalid role ID format'),
    mission: z.string().min(10, 'Mission must be at least 10 characters'),
    value_product: z.string().min(10, 'Value product must be at least 10 characters'),
    responsibility_zones: z
        .array(z.string().min(1))
        .min(1, 'At least one responsibility zone is required'),
    kpi_definitions: z
        .array(KPIDefinitionSchema)
        .min(1, 'At least one KPI definition is required'),
    permissions: z.array(PermissionSchema).default([]),
    growth_paths: z.array(GrowthPathSchema).default([]),
});

export type RoleContractInput = z.infer<typeof RoleContractSchema>;

// =============================================================================
// SEED DATA SCHEMA (for validation)
// =============================================================================

/**
 * Schema для seed данных Role с контрактом
 */
export const SeedRoleWithContractSchema = z.object({
    role: CreateRoleSchema,
    contract: RoleContractSchema.omit({ role_id: true }),
});

export type SeedRoleWithContractInput = z.infer<typeof SeedRoleWithContractSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate KPI Definition
 */
export function validateKPIDefinition(data: unknown): KPIDefinitionInput {
    return KPIDefinitionSchema.parse(data);
}

/**
 * Validate Role Contract
 */
export function validateRoleContract(data: unknown): RoleContractInput {
    return RoleContractSchema.parse(data);
}

/**
 * Safe validate (returns result instead of throwing)
 */
export function safeValidateRoleContract(data: unknown) {
    return RoleContractSchema.safeParse(data);
}

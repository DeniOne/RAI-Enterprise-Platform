"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedRoleWithContractSchema = exports.RoleContractSchema = exports.CreateRoleSchema = exports.GrowthPathSchema = exports.PermissionSchema = exports.KPIDefinitionSchema = void 0;
exports.validateKPIDefinition = validateKPIDefinition;
exports.validateRoleContract = validateRoleContract;
exports.safeValidateRoleContract = safeValidateRoleContract;
const zod_1 = require("zod");
// =============================================================================
// KPI DEFINITION SCHEMA
// =============================================================================
/**
 * Schema для KPI Definition
 * Canon: KPI — датчики, не цели.
 */
exports.KPIDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'KPI name is required'),
    formula: zod_1.z.string().min(1, 'Formula is required'),
    target: zod_1.z.number().positive('Target must be positive'),
    threshold_warning: zod_1.z.number().describe('Warning threshold (yellow zone)'),
    threshold_critical: zod_1.z.number().describe('Critical threshold (red zone)'),
    unit: zod_1.z.string().min(1, 'Unit is required'),
    calculation_period: zod_1.z.enum(['daily', 'weekly', 'monthly']),
});
// =============================================================================
// PERMISSION SCHEMA
// =============================================================================
/**
 * Schema для Permission
 */
exports.PermissionSchema = zod_1.z.object({
    resource: zod_1.z.string().min(1, 'Resource is required'),
    actions: zod_1.z
        .array(zod_1.z.enum(['create', 'read', 'update', 'delete']))
        .min(1, 'At least one action is required'),
    conditions: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// =============================================================================
// GROWTH PATH SCHEMA
// =============================================================================
/**
 * Schema для Growth Path
 */
exports.GrowthPathSchema = zod_1.z
    .object({
    from_level: zod_1.z.number().int().min(1).max(5),
    to_level: zod_1.z.number().int().min(1).max(5),
    requirements: zod_1.z.array(zod_1.z.string()).min(1, 'At least one requirement'),
    estimated_duration_months: zod_1.z.number().positive(),
})
    .refine((data) => data.to_level > data.from_level, {
    message: 'to_level must be greater than from_level',
    path: ['to_level'],
});
// =============================================================================
// ROLE SCHEMA
// =============================================================================
/**
 * Schema для создания Role
 */
exports.CreateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Role name must be at least 2 characters'),
    code: zod_1.z
        .string()
        .min(2)
        .max(50)
        .regex(/^[A-Z_]+$/, 'Code must be uppercase letters and underscores only'),
    description: zod_1.z.string().optional(),
});
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
exports.RoleContractSchema = zod_1.z.object({
    role_id: zod_1.z.string().uuid('Invalid role ID format'),
    mission: zod_1.z.string().min(10, 'Mission must be at least 10 characters'),
    value_product: zod_1.z.string().min(10, 'Value product must be at least 10 characters'),
    responsibility_zones: zod_1.z
        .array(zod_1.z.string().min(1))
        .min(1, 'At least one responsibility zone is required'),
    kpi_definitions: zod_1.z
        .array(exports.KPIDefinitionSchema)
        .min(1, 'At least one KPI definition is required'),
    permissions: zod_1.z.array(exports.PermissionSchema).default([]),
    growth_paths: zod_1.z.array(exports.GrowthPathSchema).default([]),
});
// =============================================================================
// SEED DATA SCHEMA (for validation)
// =============================================================================
/**
 * Schema для seed данных Role с контрактом
 */
exports.SeedRoleWithContractSchema = zod_1.z.object({
    role: exports.CreateRoleSchema,
    contract: exports.RoleContractSchema.omit({ role_id: true }),
});
// =============================================================================
// VALIDATION HELPERS
// =============================================================================
/**
 * Validate KPI Definition
 */
function validateKPIDefinition(data) {
    return exports.KPIDefinitionSchema.parse(data);
}
/**
 * Validate Role Contract
 */
function validateRoleContract(data) {
    return exports.RoleContractSchema.parse(data);
}
/**
 * Safe validate (returns result instead of throwing)
 */
function safeValidateRoleContract(data) {
    return exports.RoleContractSchema.safeParse(data);
}

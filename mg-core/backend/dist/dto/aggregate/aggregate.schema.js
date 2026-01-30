"use strict";
/**
 * Aggregate Zod Schemas - Phase 0.4
 *
 * Zod schemas для валидации Aggregates.
 * Canon: Aggregates — read-only, без бизнес-логики.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPerformanceViewSchema = exports.PerformanceTrends = exports.PeriodStatsViewSchema = exports.DailySummaryProjectionSchema = exports.QualificationAggregateSchema = exports.QualificationStates = exports.BranchAggregateSchema = exports.ShiftAggregateSchema = exports.ShiftKaizenSchema = exports.ShiftFactSchema = exports.ShiftPlanSchema = exports.ShiftStatuses = exports.UserAggregateSchema = exports.CurrentShiftSchema = exports.PeriodStatsSchema = exports.AggregatePeriods = void 0;
exports.validateUserAggregate = validateUserAggregate;
exports.validateShiftAggregate = validateShiftAggregate;
exports.validateBranchAggregate = validateBranchAggregate;
const zod_1 = require("zod");
// =============================================================================
// COMMON SCHEMAS
// =============================================================================
exports.AggregatePeriods = ['daily', 'weekly', 'monthly'];
exports.PeriodStatsSchema = zod_1.z.object({
    period: zod_1.z.enum(exports.AggregatePeriods),
    period_start: zod_1.z.date(),
    period_end: zod_1.z.date(),
    shifts_count: zod_1.z.number().int().nonnegative(),
    sessions_count: zod_1.z.number().int().nonnegative(),
    revenue_total: zod_1.z.number().nonnegative(),
    nps_average: zod_1.z.number().min(0).max(10).optional(),
});
// =============================================================================
// USER AGGREGATE SCHEMA
// =============================================================================
exports.CurrentShiftSchema = zod_1.z.object({
    shift_id: zod_1.z.string().uuid(),
    started_at: zod_1.z.date(),
    planned_end: zod_1.z.date(),
    status: zod_1.z.literal('active'),
});
exports.UserAggregateSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    role_id: zod_1.z.string().uuid(),
    role_code: zod_1.z.string(),
    qualification_level: zod_1.z.number().int().min(1).max(5),
    current_shift: exports.CurrentShiftSchema.optional(),
    period_stats: exports.PeriodStatsSchema,
    last_updated: zod_1.z.date(),
});
// =============================================================================
// SHIFT AGGREGATE SCHEMA
// =============================================================================
exports.ShiftStatuses = ['pending', 'active', 'completed', 'cancelled'];
exports.ShiftPlanSchema = zod_1.z.object({
    sessions_count: zod_1.z.number().int().nonnegative(),
    revenue: zod_1.z.number().nonnegative(),
    start: zod_1.z.date(),
    end: zod_1.z.date(),
});
exports.ShiftFactSchema = zod_1.z.object({
    sessions_count: zod_1.z.number().int().nonnegative(),
    revenue: zod_1.z.number().nonnegative(),
    nps_scores: zod_1.z.array(zod_1.z.number().min(0).max(10)),
    start: zod_1.z.date().optional(),
    end: zod_1.z.date().optional(),
});
exports.ShiftKaizenSchema = zod_1.z.object({
    problems: zod_1.z.array(zod_1.z.string()),
    improvements: zod_1.z.array(zod_1.z.string()),
    conclusions: zod_1.z.string(),
});
exports.ShiftAggregateSchema = zod_1.z.object({
    shift_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    role_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(exports.ShiftStatuses),
    plan: exports.ShiftPlanSchema,
    fact: exports.ShiftFactSchema,
    kaizen: exports.ShiftKaizenSchema.optional(),
    last_updated: zod_1.z.date(),
});
// =============================================================================
// BRANCH AGGREGATE SCHEMA
// =============================================================================
exports.BranchAggregateSchema = zod_1.z.object({
    branch_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    active_shifts_count: zod_1.z.number().int().nonnegative(),
    active_users: zod_1.z.array(zod_1.z.string().uuid()),
    period_stats: exports.PeriodStatsSchema,
    last_updated: zod_1.z.date(),
});
// =============================================================================
// QUALIFICATION AGGREGATE SCHEMA
// =============================================================================
exports.QualificationStates = ['stable', 'eligible_for_upgrade', 'risk_of_downgrade'];
exports.QualificationAggregateSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    current_level: zod_1.z.number().int().min(1).max(5),
    level_name: zod_1.z.string(),
    state: zod_1.z.enum(exports.QualificationStates),
    achieved_at: zod_1.z.date(),
    days_at_current_level: zod_1.z.number().int().nonnegative(),
    recent_events: zod_1.z.array(zod_1.z.object({
        event_id: zod_1.z.string().uuid(),
        type: zod_1.z.enum(['QUALIFICATION_PROPOSED', 'QUALIFICATION_CHANGED']),
        timestamp: zod_1.z.date(),
    })),
    last_updated: zod_1.z.date(),
});
// =============================================================================
// PROJECTION SCHEMAS
// =============================================================================
exports.DailySummaryProjectionSchema = zod_1.z.object({
    date: zod_1.z.date(),
    user_id: zod_1.z.string().uuid(),
    shifts_count: zod_1.z.number().int().nonnegative(),
    sessions_count: zod_1.z.number().int().nonnegative(),
    revenue: zod_1.z.number().nonnegative(),
    nps_average: zod_1.z.number().min(0).max(10).optional(),
    events_count: zod_1.z.number().int().nonnegative(),
});
exports.PeriodStatsViewSchema = zod_1.z.object({
    sessions: zod_1.z.number().int().nonnegative(),
    revenue: zod_1.z.number().nonnegative(),
    nps: zod_1.z.number().min(0).max(10).optional(),
});
exports.PerformanceTrends = ['up', 'down', 'stable'];
exports.UserPerformanceViewSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    role: zod_1.z.string(),
    qualification_level: zod_1.z.number().int().min(1).max(5),
    today: exports.PeriodStatsViewSchema,
    this_week: exports.PeriodStatsViewSchema,
    this_month: exports.PeriodStatsViewSchema,
    trend: zod_1.z.enum(exports.PerformanceTrends),
    last_updated: zod_1.z.date(),
});
// =============================================================================
// VALIDATION HELPERS
// =============================================================================
/**
 * Validate User Aggregate
 */
function validateUserAggregate(data) {
    return exports.UserAggregateSchema.safeParse(data);
}
/**
 * Validate Shift Aggregate
 */
function validateShiftAggregate(data) {
    return exports.ShiftAggregateSchema.safeParse(data);
}
/**
 * Validate Branch Aggregate
 */
function validateBranchAggregate(data) {
    return exports.BranchAggregateSchema.safeParse(data);
}

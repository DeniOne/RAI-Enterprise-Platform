/**
 * Aggregate Zod Schemas - Phase 0.4
 * 
 * Zod schemas для валидации Aggregates.
 * Canon: Aggregates — read-only, без бизнес-логики.
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const AggregatePeriods = ['daily', 'weekly', 'monthly'] as const;

export const PeriodStatsSchema = z.object({
    period: z.enum(AggregatePeriods),
    period_start: z.date(),
    period_end: z.date(),
    shifts_count: z.number().int().nonnegative(),
    sessions_count: z.number().int().nonnegative(),
    revenue_total: z.number().nonnegative(),
    nps_average: z.number().min(0).max(10).optional(),
});

// =============================================================================
// USER AGGREGATE SCHEMA
// =============================================================================

export const CurrentShiftSchema = z.object({
    shift_id: z.string().uuid(),
    started_at: z.date(),
    planned_end: z.date(),
    status: z.literal('active'),
});

export const UserAggregateSchema = z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
    role_code: z.string(),
    qualification_level: z.number().int().min(1).max(5),
    current_shift: CurrentShiftSchema.optional(),
    period_stats: PeriodStatsSchema,
    last_updated: z.date(),
});

// =============================================================================
// SHIFT AGGREGATE SCHEMA
// =============================================================================

export const ShiftStatuses = ['pending', 'active', 'completed', 'cancelled'] as const;

export const ShiftPlanSchema = z.object({
    sessions_count: z.number().int().nonnegative(),
    revenue: z.number().nonnegative(),
    start: z.date(),
    end: z.date(),
});

export const ShiftFactSchema = z.object({
    sessions_count: z.number().int().nonnegative(),
    revenue: z.number().nonnegative(),
    nps_scores: z.array(z.number().min(0).max(10)),
    start: z.date().optional(),
    end: z.date().optional(),
});

export const ShiftKaizenSchema = z.object({
    problems: z.array(z.string()),
    improvements: z.array(z.string()),
    conclusions: z.string(),
});

export const ShiftAggregateSchema = z.object({
    shift_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
    branch_id: z.string().uuid(),
    status: z.enum(ShiftStatuses),
    plan: ShiftPlanSchema,
    fact: ShiftFactSchema,
    kaizen: ShiftKaizenSchema.optional(),
    last_updated: z.date(),
});

// =============================================================================
// BRANCH AGGREGATE SCHEMA
// =============================================================================

export const BranchAggregateSchema = z.object({
    branch_id: z.string().uuid(),
    name: z.string().min(1),
    active_shifts_count: z.number().int().nonnegative(),
    active_users: z.array(z.string().uuid()),
    period_stats: PeriodStatsSchema,
    last_updated: z.date(),
});

// =============================================================================
// QUALIFICATION AGGREGATE SCHEMA
// =============================================================================

export const QualificationStates = ['stable', 'eligible_for_upgrade', 'risk_of_downgrade'] as const;

export const QualificationAggregateSchema = z.object({
    user_id: z.string().uuid(),
    current_level: z.number().int().min(1).max(5),
    level_name: z.string(),
    state: z.enum(QualificationStates),
    achieved_at: z.date(),
    days_at_current_level: z.number().int().nonnegative(),
    recent_events: z.array(z.object({
        event_id: z.string().uuid(),
        type: z.enum(['QUALIFICATION_PROPOSED', 'QUALIFICATION_CHANGED']),
        timestamp: z.date(),
    })),
    last_updated: z.date(),
});

// =============================================================================
// PROJECTION SCHEMAS
// =============================================================================

export const DailySummaryProjectionSchema = z.object({
    date: z.date(),
    user_id: z.string().uuid(),
    shifts_count: z.number().int().nonnegative(),
    sessions_count: z.number().int().nonnegative(),
    revenue: z.number().nonnegative(),
    nps_average: z.number().min(0).max(10).optional(),
    events_count: z.number().int().nonnegative(),
});

export const PeriodStatsViewSchema = z.object({
    sessions: z.number().int().nonnegative(),
    revenue: z.number().nonnegative(),
    nps: z.number().min(0).max(10).optional(),
});

export const PerformanceTrends = ['up', 'down', 'stable'] as const;

export const UserPerformanceViewSchema = z.object({
    user_id: z.string().uuid(),
    role: z.string(),
    qualification_level: z.number().int().min(1).max(5),
    today: PeriodStatsViewSchema,
    this_week: PeriodStatsViewSchema,
    this_month: PeriodStatsViewSchema,
    trend: z.enum(PerformanceTrends),
    last_updated: z.date(),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate User Aggregate
 */
export function validateUserAggregate(data: unknown) {
    return UserAggregateSchema.safeParse(data);
}

/**
 * Validate Shift Aggregate
 */
export function validateShiftAggregate(data: unknown) {
    return ShiftAggregateSchema.safeParse(data);
}

/**
 * Validate Branch Aggregate
 */
export function validateBranchAggregate(data: unknown) {
    return BranchAggregateSchema.safeParse(data);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AggregatePeriod = typeof AggregatePeriods[number];
export type ShiftStatus = typeof ShiftStatuses[number];
export type QualificationState = typeof QualificationStates[number];
export type PerformanceTrend = typeof PerformanceTrends[number];

export type UserAggregateInput = z.infer<typeof UserAggregateSchema>;
export type ShiftAggregateInput = z.infer<typeof ShiftAggregateSchema>;
export type BranchAggregateInput = z.infer<typeof BranchAggregateSchema>;

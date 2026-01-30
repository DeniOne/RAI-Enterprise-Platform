/**
 * Event Zod Schemas - Phase 0.3
 * 
 * Zod schemas для валидации событий.
 * Canon: События — единственный источник фактов.
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 */

import { z } from 'zod';

// =============================================================================
// CONSTANTS (for Zod enums)
// =============================================================================

export const EventTypes = [
    'SHIFT_STARTED',
    'SHIFT_COMPLETED',
    'KPI_RECORDED',
    'FEEDBACK_SUBMITTED',
    'COURSE_COMPLETED',
    'TEST_PASSED',
    'MENTORING_COMPLETED',
    'QUALIFICATION_PROPOSED',
    'QUALIFICATION_CHANGED',
    'REWARD_GRANTED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'TRANSACTION_CREATED',
] as const;

export const SubjectTypes = ['user', 'task', 'shift', 'session', 'order'] as const;
export const EventSources = ['system', 'user', 'api', 'scheduler'] as const;
export const RewardTypes = ['MC', 'GMC', 'RUB'] as const;
export const TaskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// =============================================================================
// CANONICAL PAYLOAD SCHEMAS
// Canon: Каждому EventType соответствует строго один canonical payload schema.
// =============================================================================

/**
 * SHIFT_STARTED payload schema
 */
export const ShiftStartedPayloadSchema = z.object({
    shift_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
    branch_id: z.string().uuid(),
    planned_start: z.string().datetime(),
    actual_start: z.string().datetime(),
    planned_end: z.string().datetime(),
});

/**
 * SHIFT_COMPLETED payload schema
 * Includes Plan vs Fact and Kaizen data
 */
export const ShiftCompletedPayloadSchema = z.object({
    shift_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
    branch_id: z.string().uuid(),
    actual_end: z.string().datetime(),
    duration_minutes: z.number().int().positive(),
    plan: z.object({
        sessions_count: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
    }),
    fact: z.object({
        sessions_count: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
        nps_average: z.number().min(0).max(10).optional(),
    }),
    problems: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    conclusions: z.string().optional(),
});

/**
 * KPI_RECORDED payload schema
 */
export const KPIRecordedPayloadSchema = z.object({
    kpi_id: z.string().uuid(),
    kpi_name: z.string().min(1),
    user_id: z.string().uuid(),
    value: z.number(),
    unit: z.string().min(1),
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
    source_event_ids: z.array(z.string().uuid()).min(1),
});

/**
 * FEEDBACK_SUBMITTED payload schema
 */
export const FeedbackSubmittedPayloadSchema = z.object({
    session_id: z.string().uuid(),
    user_id: z.string().uuid(),
    client_id: z.string().uuid().optional(),
    nps_score: z.number().int().min(0).max(10),
    comment: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

/**
 * COURSE_COMPLETED payload schema
 */
export const CourseCompletedPayloadSchema = z.object({
    course_id: z.string().uuid(),
    user_id: z.string().uuid(),
    academy_id: z.string().uuid(),
    completed_at: z.string().datetime(),
    score: z.number().min(0).max(100).optional(),
    duration_minutes: z.number().int().positive(),
});

/**
 * TEST_PASSED payload schema
 */
export const TestPassedPayloadSchema = z.object({
    test_id: z.string().uuid(),
    user_id: z.string().uuid(),
    course_id: z.string().uuid().optional(),
    score: z.number().min(0),
    max_score: z.number().positive(),
    passed_at: z.string().datetime(),
    attempts_count: z.number().int().positive(),
});

/**
 * MENTORING_COMPLETED payload schema
 */
export const MentoringCompletedPayloadSchema = z.object({
    mentoring_session_id: z.string().uuid(),
    mentor_id: z.string().uuid(),
    mentee_id: z.string().uuid(),
    topic: z.string().min(1),
    duration_minutes: z.number().int().positive(),
    completed_at: z.string().datetime(),
    feedback: z.string().optional(),
});

/**
 * QUALIFICATION_PROPOSED payload schema
 */
export const QualificationProposedPayloadSchema = z.object({
    user_id: z.string().uuid(),
    current_level: z.number().int().min(1).max(5),
    proposed_level: z.number().int().min(1).max(5),
    proposed_by: z.string().uuid(),
    reason: z.string().min(10),
    supporting_evidence: z.array(z.string()).min(1),
});

/**
 * QUALIFICATION_CHANGED payload schema
 */
export const QualificationChangedPayloadSchema = z.object({
    user_id: z.string().uuid(),
    previous_level: z.number().int().min(1).max(5),
    new_level: z.number().int().min(1).max(5),
    changed_by: z.string().uuid(),
    reason: z.string().min(10),
    effective_from: z.string().datetime(),
});

/**
 * REWARD_GRANTED payload schema
 * Canon: Reward — следствие, не причина.
 */
export const RewardGrantedPayloadSchema = z.object({
    user_id: z.string().uuid(),
    reward_rule_id: z.string().uuid(),
    reward_type: z.enum(RewardTypes),
    amount: z.number().positive(),
    reason: z.string().min(1),
    trigger_event_id: z.string().uuid(),
});

/**
 * TASK_CREATED payload schema
 */
export const TaskCreatedPayloadSchema = z.object({
    task_id: z.string().uuid(),
    creator_id: z.string().uuid(),
    assignee_id: z.string().uuid().optional(),
    title: z.string().min(1),
    priority: z.enum(TaskPriorities),
    due_date: z.string().datetime().optional(),
});

/**
 * TASK_COMPLETED payload schema
 */
export const TaskCompletedPayloadSchema = z.object({
    task_id: z.string().uuid(),
    assignee_id: z.string().uuid(),
    completed_at: z.string().datetime(),
    duration_minutes: z.number().int().positive().optional(),
    mc_reward: z.number().nonnegative().optional(),
});

/**
 * TRANSACTION_CREATED payload schema
 */
export const TransactionCreatedPayloadSchema = z.object({
    transaction_id: z.string().uuid(),
    sender_id: z.string().uuid().optional(),
    recipient_id: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.enum(RewardTypes),
    reason: z.string().min(1),
    related_event_id: z.string().uuid().optional(),
});

// =============================================================================
// PAYLOAD SCHEMA MAP (Canon: 1:1 mapping)
// =============================================================================

/**
 * Map EventType → Zod Schema
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 */
export const PayloadSchemaMap = {
    SHIFT_STARTED: ShiftStartedPayloadSchema,
    SHIFT_COMPLETED: ShiftCompletedPayloadSchema,
    KPI_RECORDED: KPIRecordedPayloadSchema,
    FEEDBACK_SUBMITTED: FeedbackSubmittedPayloadSchema,
    COURSE_COMPLETED: CourseCompletedPayloadSchema,
    TEST_PASSED: TestPassedPayloadSchema,
    MENTORING_COMPLETED: MentoringCompletedPayloadSchema,
    QUALIFICATION_PROPOSED: QualificationProposedPayloadSchema,
    QUALIFICATION_CHANGED: QualificationChangedPayloadSchema,
    REWARD_GRANTED: RewardGrantedPayloadSchema,
    TASK_CREATED: TaskCreatedPayloadSchema,
    TASK_COMPLETED: TaskCompletedPayloadSchema,
    TRANSACTION_CREATED: TransactionCreatedPayloadSchema,
} as const;

// =============================================================================
// EVENT METADATA SCHEMA
// =============================================================================

export const EventMetadataSchema = z.object({
    ip_address: z.string().optional(),
    user_agent: z.string().optional(),
    session_id: z.string().uuid().optional(),
    request_id: z.string().uuid().optional(),
}).passthrough(); // Allow additional properties

// =============================================================================
// CREATE EVENT SCHEMA
// =============================================================================

/**
 * Schema for creating a new Event
 */
export const CreateEventSchema = z.object({
    type: z.enum(EventTypes),
    source: z.enum(EventSources),
    subject_id: z.string().uuid(),
    subject_type: z.enum(SubjectTypes),
    payload: z.record(z.string(), z.unknown()), // Will be validated with type-specific schema
    metadata: EventMetadataSchema.optional(),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate event payload based on event type
 * Canon: Enforces 1:1 mapping between EventType and Payload schema
 */
export function validateEventPayload<T extends keyof typeof PayloadSchemaMap>(
    type: T,
    payload: unknown
) {
    const schema = PayloadSchemaMap[type];
    return schema.safeParse(payload);
}

/**
 * Get the payload schema for an event type
 */
export function getPayloadSchema<T extends keyof typeof PayloadSchemaMap>(type: T) {
    return PayloadSchemaMap[type];
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type EventType = typeof EventTypes[number];
export type SubjectType = typeof SubjectTypes[number];
export type EventSource = typeof EventSources[number];
export type RewardType = typeof RewardTypes[number];
export type TaskPriority = typeof TaskPriorities[number];

export type ShiftStartedPayloadInput = z.infer<typeof ShiftStartedPayloadSchema>;
export type ShiftCompletedPayloadInput = z.infer<typeof ShiftCompletedPayloadSchema>;
export type FeedbackSubmittedPayloadInput = z.infer<typeof FeedbackSubmittedPayloadSchema>;
export type KPIRecordedPayloadInput = z.infer<typeof KPIRecordedPayloadSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

"use strict";
/**
 * Event Zod Schemas - Phase 0.3
 *
 * Zod schemas для валидации событий.
 * Canon: События — единственный источник фактов.
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEventSchema = exports.EventMetadataSchema = exports.PayloadSchemaMap = exports.TransactionCreatedPayloadSchema = exports.TaskCompletedPayloadSchema = exports.TaskCreatedPayloadSchema = exports.RewardGrantedPayloadSchema = exports.QualificationChangedPayloadSchema = exports.QualificationProposedPayloadSchema = exports.MentoringCompletedPayloadSchema = exports.TestPassedPayloadSchema = exports.CourseCompletedPayloadSchema = exports.FeedbackSubmittedPayloadSchema = exports.KPIRecordedPayloadSchema = exports.ShiftCompletedPayloadSchema = exports.ShiftStartedPayloadSchema = exports.TaskPriorities = exports.RewardTypes = exports.EventSources = exports.SubjectTypes = exports.EventTypes = void 0;
exports.validateEventPayload = validateEventPayload;
exports.getPayloadSchema = getPayloadSchema;
const zod_1 = require("zod");
// =============================================================================
// CONSTANTS (for Zod enums)
// =============================================================================
exports.EventTypes = [
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
];
exports.SubjectTypes = ['user', 'task', 'shift', 'session', 'order'];
exports.EventSources = ['system', 'user', 'api', 'scheduler'];
exports.RewardTypes = ['MC', 'GMC', 'RUB'];
exports.TaskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
// =============================================================================
// CANONICAL PAYLOAD SCHEMAS
// Canon: Каждому EventType соответствует строго один canonical payload schema.
// =============================================================================
/**
 * SHIFT_STARTED payload schema
 */
exports.ShiftStartedPayloadSchema = zod_1.z.object({
    shift_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    role_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    planned_start: zod_1.z.string().datetime(),
    actual_start: zod_1.z.string().datetime(),
    planned_end: zod_1.z.string().datetime(),
});
/**
 * SHIFT_COMPLETED payload schema
 * Includes Plan vs Fact and Kaizen data
 */
exports.ShiftCompletedPayloadSchema = zod_1.z.object({
    shift_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    role_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    actual_end: zod_1.z.string().datetime(),
    duration_minutes: zod_1.z.number().int().positive(),
    plan: zod_1.z.object({
        sessions_count: zod_1.z.number().int().nonnegative(),
        revenue: zod_1.z.number().nonnegative(),
    }),
    fact: zod_1.z.object({
        sessions_count: zod_1.z.number().int().nonnegative(),
        revenue: zod_1.z.number().nonnegative(),
        nps_average: zod_1.z.number().min(0).max(10).optional(),
    }),
    problems: zod_1.z.array(zod_1.z.string()).optional(),
    improvements: zod_1.z.array(zod_1.z.string()).optional(),
    conclusions: zod_1.z.string().optional(),
});
/**
 * KPI_RECORDED payload schema
 */
exports.KPIRecordedPayloadSchema = zod_1.z.object({
    kpi_id: zod_1.z.string().uuid(),
    kpi_name: zod_1.z.string().min(1),
    user_id: zod_1.z.string().uuid(),
    value: zod_1.z.number(),
    unit: zod_1.z.string().min(1),
    period_start: zod_1.z.string().datetime(),
    period_end: zod_1.z.string().datetime(),
    source_event_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
/**
 * FEEDBACK_SUBMITTED payload schema
 */
exports.FeedbackSubmittedPayloadSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    client_id: zod_1.z.string().uuid().optional(),
    nps_score: zod_1.z.number().int().min(0).max(10),
    comment: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * COURSE_COMPLETED payload schema
 */
exports.CourseCompletedPayloadSchema = zod_1.z.object({
    course_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    academy_id: zod_1.z.string().uuid(),
    completed_at: zod_1.z.string().datetime(),
    score: zod_1.z.number().min(0).max(100).optional(),
    duration_minutes: zod_1.z.number().int().positive(),
});
/**
 * TEST_PASSED payload schema
 */
exports.TestPassedPayloadSchema = zod_1.z.object({
    test_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    course_id: zod_1.z.string().uuid().optional(),
    score: zod_1.z.number().min(0),
    max_score: zod_1.z.number().positive(),
    passed_at: zod_1.z.string().datetime(),
    attempts_count: zod_1.z.number().int().positive(),
});
/**
 * MENTORING_COMPLETED payload schema
 */
exports.MentoringCompletedPayloadSchema = zod_1.z.object({
    mentoring_session_id: zod_1.z.string().uuid(),
    mentor_id: zod_1.z.string().uuid(),
    mentee_id: zod_1.z.string().uuid(),
    topic: zod_1.z.string().min(1),
    duration_minutes: zod_1.z.number().int().positive(),
    completed_at: zod_1.z.string().datetime(),
    feedback: zod_1.z.string().optional(),
});
/**
 * QUALIFICATION_PROPOSED payload schema
 */
exports.QualificationProposedPayloadSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    current_level: zod_1.z.number().int().min(1).max(5),
    proposed_level: zod_1.z.number().int().min(1).max(5),
    proposed_by: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(10),
    supporting_evidence: zod_1.z.array(zod_1.z.string()).min(1),
});
/**
 * QUALIFICATION_CHANGED payload schema
 */
exports.QualificationChangedPayloadSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    previous_level: zod_1.z.number().int().min(1).max(5),
    new_level: zod_1.z.number().int().min(1).max(5),
    changed_by: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(10),
    effective_from: zod_1.z.string().datetime(),
});
/**
 * REWARD_GRANTED payload schema
 * Canon: Reward — следствие, не причина.
 */
exports.RewardGrantedPayloadSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    reward_rule_id: zod_1.z.string().uuid(),
    reward_type: zod_1.z.enum(exports.RewardTypes),
    amount: zod_1.z.number().positive(),
    reason: zod_1.z.string().min(1),
    trigger_event_id: zod_1.z.string().uuid(),
});
/**
 * TASK_CREATED payload schema
 */
exports.TaskCreatedPayloadSchema = zod_1.z.object({
    task_id: zod_1.z.string().uuid(),
    creator_id: zod_1.z.string().uuid(),
    assignee_id: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1),
    priority: zod_1.z.enum(exports.TaskPriorities),
    due_date: zod_1.z.string().datetime().optional(),
});
/**
 * TASK_COMPLETED payload schema
 */
exports.TaskCompletedPayloadSchema = zod_1.z.object({
    task_id: zod_1.z.string().uuid(),
    assignee_id: zod_1.z.string().uuid(),
    completed_at: zod_1.z.string().datetime(),
    duration_minutes: zod_1.z.number().int().positive().optional(),
    mc_reward: zod_1.z.number().nonnegative().optional(),
});
/**
 * TRANSACTION_CREATED payload schema
 */
exports.TransactionCreatedPayloadSchema = zod_1.z.object({
    transaction_id: zod_1.z.string().uuid(),
    sender_id: zod_1.z.string().uuid().optional(),
    recipient_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.enum(exports.RewardTypes),
    reason: zod_1.z.string().min(1),
    related_event_id: zod_1.z.string().uuid().optional(),
});
// =============================================================================
// PAYLOAD SCHEMA MAP (Canon: 1:1 mapping)
// =============================================================================
/**
 * Map EventType → Zod Schema
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 */
exports.PayloadSchemaMap = {
    SHIFT_STARTED: exports.ShiftStartedPayloadSchema,
    SHIFT_COMPLETED: exports.ShiftCompletedPayloadSchema,
    KPI_RECORDED: exports.KPIRecordedPayloadSchema,
    FEEDBACK_SUBMITTED: exports.FeedbackSubmittedPayloadSchema,
    COURSE_COMPLETED: exports.CourseCompletedPayloadSchema,
    TEST_PASSED: exports.TestPassedPayloadSchema,
    MENTORING_COMPLETED: exports.MentoringCompletedPayloadSchema,
    QUALIFICATION_PROPOSED: exports.QualificationProposedPayloadSchema,
    QUALIFICATION_CHANGED: exports.QualificationChangedPayloadSchema,
    REWARD_GRANTED: exports.RewardGrantedPayloadSchema,
    TASK_CREATED: exports.TaskCreatedPayloadSchema,
    TASK_COMPLETED: exports.TaskCompletedPayloadSchema,
    TRANSACTION_CREATED: exports.TransactionCreatedPayloadSchema,
};
// =============================================================================
// EVENT METADATA SCHEMA
// =============================================================================
exports.EventMetadataSchema = zod_1.z.object({
    ip_address: zod_1.z.string().optional(),
    user_agent: zod_1.z.string().optional(),
    session_id: zod_1.z.string().uuid().optional(),
    request_id: zod_1.z.string().uuid().optional(),
}).passthrough(); // Allow additional properties
// =============================================================================
// CREATE EVENT SCHEMA
// =============================================================================
/**
 * Schema for creating a new Event
 */
exports.CreateEventSchema = zod_1.z.object({
    type: zod_1.z.enum(exports.EventTypes),
    source: zod_1.z.enum(exports.EventSources),
    subject_id: zod_1.z.string().uuid(),
    subject_type: zod_1.z.enum(exports.SubjectTypes),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()), // Will be validated with type-specific schema
    metadata: exports.EventMetadataSchema.optional(),
});
// =============================================================================
// VALIDATION HELPERS
// =============================================================================
/**
 * Validate event payload based on event type
 * Canon: Enforces 1:1 mapping between EventType and Payload schema
 */
function validateEventPayload(type, payload) {
    const schema = exports.PayloadSchemaMap[type];
    return schema.safeParse(payload);
}
/**
 * Get the payload schema for an event type
 */
function getPayloadSchema(type) {
    return exports.PayloadSchemaMap[type];
}

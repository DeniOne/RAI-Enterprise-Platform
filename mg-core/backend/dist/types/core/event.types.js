"use strict";
/**
 * Core Event Types - Phase 0.3
 *
 * Canon: События — единственный источник фактов. Нет KPI без события.
 * Canon: Каждому EventType соответствует строго один canonical payload schema.
 *
 * Эти типы описывают структуру событий в системе.
 * Event Store является единственным источником фактов для всех Engines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSources = exports.SubjectTypes = exports.EventTypes = void 0;
// =============================================================================
// EVENT TYPE ENUM
// =============================================================================
/**
 * Все типы событий в системе
 *
 * Canon: Каждый EventType имеет строго один canonical payload.
 * Никаких произвольных payload для одного и того же EventType.
 */
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
    'PHOTOCOMPANY_RESULT', // Module 13: PhotoCompany shift results
];
// =============================================================================
// SUBJECT TYPES
// =============================================================================
/**
 * Типы субъектов событий
 */
exports.SubjectTypes = ['user', 'task', 'shift', 'session', 'order'];
// =============================================================================
// EVENT SOURCES
// =============================================================================
/**
 * Источники событий
 */
exports.EventSources = ['system', 'user', 'api', 'scheduler'];

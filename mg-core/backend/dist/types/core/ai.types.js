"use strict";
/**
 * AI Types - Phase 2.1
 *
 * Canon: AI объясняет. Человек решает.
 *
 * Это НЕ Agentic AI. НЕ Orchestrator. НЕ Decision Engine.
 * Это EXPLAINABILITY LAYER поверх ERP.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORBIDDEN_INTENTS = void 0;
// =============================================================================
// GUARDRAILS
// =============================================================================
/**
 * Типы запрещённых намерений
 */
exports.FORBIDDEN_INTENTS = [
    'change_data',
    'grant_reward',
    'modify_qualification',
    'execute_action',
    'make_decision',
    'bypass_rules',
    'compare_people',
    'give_advice',
];

/**
 * AI Module - Phase 2 + Phase 3
 * 
 * Canon: 
 * - AI объясняет. AI рекомендует. AI сигнализирует. (Phase 2)
 * - AI предлагает сценарии. Человек утверждает. (Phase 3)
 * 
 * Phase 2: Advisory Layer (Analyst, Coach, Auditor, Ops Advisor)
 * Phase 3: Orchestrator (Non-semantic aggregator)
 * 
 * Orchestrator = collect → tag → order → attach
 * ZERO interpretation.
 */

// LLM Adapter
export { OpenAILLMAdapter, createLLMAdapter, LLMAdapterError } from './llm.adapter';

// Guardrails
export { checkGuardrails, validateRequest, getRefusalMessage, REFUSAL_MESSAGE } from './ai-guardrails';

// AI Analyst (Phase 2.1)
export { AIAnalyst, AIAnalystError } from './analyst';
export * from './analyst/analyst.types';

// AI Coach (Phase 2.2)
export { AICoach, AICoachError } from './coach';
export * from './coach/coach.types';

// AI Auditor (Phase 2.3)
export { AIAuditor, AIAuditorError } from './auditor';
export * from './auditor/auditor.types';

// AI Ops Advisor (Phase 2.4)
export { AIOpsAdvisor, AIOpsAdvisorError } from './ops-advisor';
export * from './ops-advisor/ops-advisor.types';

// AI Orchestrator (Phase 3)
export { AIOrchestratorEngine, AIOrchestratorError } from './orchestrator';
export * from './orchestrator/orchestrator.types';


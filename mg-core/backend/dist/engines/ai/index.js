"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestratorError = exports.AIOrchestratorEngine = exports.AIOpsAdvisorError = exports.AIOpsAdvisor = exports.AIAuditorError = exports.AIAuditor = exports.AICoachError = exports.AICoach = exports.AIAnalystError = exports.AIAnalyst = exports.REFUSAL_MESSAGE = exports.getRefusalMessage = exports.validateRequest = exports.checkGuardrails = exports.LLMAdapterError = exports.createLLMAdapter = exports.OpenAILLMAdapter = void 0;
// LLM Adapter
var llm_adapter_1 = require("./llm.adapter");
Object.defineProperty(exports, "OpenAILLMAdapter", { enumerable: true, get: function () { return llm_adapter_1.OpenAILLMAdapter; } });
Object.defineProperty(exports, "createLLMAdapter", { enumerable: true, get: function () { return llm_adapter_1.createLLMAdapter; } });
Object.defineProperty(exports, "LLMAdapterError", { enumerable: true, get: function () { return llm_adapter_1.LLMAdapterError; } });
// Guardrails
var ai_guardrails_1 = require("./ai-guardrails");
Object.defineProperty(exports, "checkGuardrails", { enumerable: true, get: function () { return ai_guardrails_1.checkGuardrails; } });
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return ai_guardrails_1.validateRequest; } });
Object.defineProperty(exports, "getRefusalMessage", { enumerable: true, get: function () { return ai_guardrails_1.getRefusalMessage; } });
Object.defineProperty(exports, "REFUSAL_MESSAGE", { enumerable: true, get: function () { return ai_guardrails_1.REFUSAL_MESSAGE; } });
// AI Analyst (Phase 2.1)
var analyst_1 = require("./analyst");
Object.defineProperty(exports, "AIAnalyst", { enumerable: true, get: function () { return analyst_1.AIAnalyst; } });
Object.defineProperty(exports, "AIAnalystError", { enumerable: true, get: function () { return analyst_1.AIAnalystError; } });
__exportStar(require("./analyst/analyst.types"), exports);
// AI Coach (Phase 2.2)
var coach_1 = require("./coach");
Object.defineProperty(exports, "AICoach", { enumerable: true, get: function () { return coach_1.AICoach; } });
Object.defineProperty(exports, "AICoachError", { enumerable: true, get: function () { return coach_1.AICoachError; } });
__exportStar(require("./coach/coach.types"), exports);
// AI Auditor (Phase 2.3)
var auditor_1 = require("./auditor");
Object.defineProperty(exports, "AIAuditor", { enumerable: true, get: function () { return auditor_1.AIAuditor; } });
Object.defineProperty(exports, "AIAuditorError", { enumerable: true, get: function () { return auditor_1.AIAuditorError; } });
__exportStar(require("./auditor/auditor.types"), exports);
// AI Ops Advisor (Phase 2.4)
var ops_advisor_1 = require("./ops-advisor");
Object.defineProperty(exports, "AIOpsAdvisor", { enumerable: true, get: function () { return ops_advisor_1.AIOpsAdvisor; } });
Object.defineProperty(exports, "AIOpsAdvisorError", { enumerable: true, get: function () { return ops_advisor_1.AIOpsAdvisorError; } });
__exportStar(require("./ops-advisor/ops-advisor.types"), exports);
// AI Orchestrator (Phase 3)
var orchestrator_1 = require("./orchestrator");
Object.defineProperty(exports, "AIOrchestratorEngine", { enumerable: true, get: function () { return orchestrator_1.AIOrchestratorEngine; } });
Object.defineProperty(exports, "AIOrchestratorError", { enumerable: true, get: function () { return orchestrator_1.AIOrchestratorError; } });
__exportStar(require("./orchestrator/orchestrator.types"), exports);

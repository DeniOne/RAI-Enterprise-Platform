"use strict";
/**
 * AI Orchestrator Module - Phase 3
 *
 * Canon: AI предлагает сценарии. Человек утверждает.
 *
 * Non-semantic aggregator: collect → tag → order → attach
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
exports.AIOrchestratorError = exports.AIOrchestratorEngine = void 0;
var ai_orchestrator_1 = require("./ai-orchestrator");
Object.defineProperty(exports, "AIOrchestratorEngine", { enumerable: true, get: function () { return ai_orchestrator_1.AIOrchestratorEngine; } });
Object.defineProperty(exports, "AIOrchestratorError", { enumerable: true, get: function () { return ai_orchestrator_1.AIOrchestratorError; } });
__exportStar(require("./orchestrator.types"), exports);

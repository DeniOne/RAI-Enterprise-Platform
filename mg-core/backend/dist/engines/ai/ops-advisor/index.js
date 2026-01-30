"use strict";
/**
 * AI Ops Advisor Module - Phase 2.4
 *
 * Canon: AI рекомендует. Человек решает.
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
exports.AIOpsAdvisorError = exports.AIOpsAdvisor = void 0;
var ai_ops_advisor_1 = require("./ai-ops-advisor");
Object.defineProperty(exports, "AIOpsAdvisor", { enumerable: true, get: function () { return ai_ops_advisor_1.AIOpsAdvisor; } });
Object.defineProperty(exports, "AIOpsAdvisorError", { enumerable: true, get: function () { return ai_ops_advisor_1.AIOpsAdvisorError; } });
__exportStar(require("./ops-advisor.types"), exports);

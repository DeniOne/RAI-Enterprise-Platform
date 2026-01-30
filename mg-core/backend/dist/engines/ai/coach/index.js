"use strict";
/**
 * AI Coach Module - Phase 2.2
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
exports.AICoachError = exports.AICoach = void 0;
var ai_coach_1 = require("./ai-coach");
Object.defineProperty(exports, "AICoach", { enumerable: true, get: function () { return ai_coach_1.AICoach; } });
Object.defineProperty(exports, "AICoachError", { enumerable: true, get: function () { return ai_coach_1.AICoachError; } });
__exportStar(require("./coach.types"), exports);

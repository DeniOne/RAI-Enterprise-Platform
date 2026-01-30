"use strict";
/**
 * AI Ops Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_ops_controller_1 = require("./ai-ops.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// GET /api/ai-ops/:entityType/:id/analyze
router.get('/:entityType/:id/analyze', passport_1.default.authenticate('jwt', { session: false }), ai_ops_controller_1.aiOpsController.analyze);
// POST /api/ai-ops/feedback (PHASE 4.5)
router.post('/feedback', passport_1.default.authenticate('jwt', { session: false }), ai_ops_controller_1.aiOpsController.submitFeedback);
// GET /api/ai-ops/feedback/analytics (PHASE 4.5 - Internal)
router.get('/feedback/analytics', passport_1.default.authenticate('jwt', { session: false }), 
// TODO: Add role check middleware (AI_TEAM, ADMIN only)
ai_ops_controller_1.aiOpsController.getAnalytics);
exports.default = router;

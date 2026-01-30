/**
 * AI Ops Routes
 */

import { Router } from 'express';
import { aiOpsController } from './ai-ops.controller';
import passport from 'passport';

const router = Router();

// GET /api/ai-ops/:entityType/:id/analyze
router.get(
    '/:entityType/:id/analyze',
    passport.authenticate('jwt', { session: false }),
    aiOpsController.analyze
);

// POST /api/ai-ops/feedback (PHASE 4.5)
router.post(
    '/feedback',
    passport.authenticate('jwt', { session: false }),
    aiOpsController.submitFeedback
);

// GET /api/ai-ops/feedback/analytics (PHASE 4.5 - Internal)
router.get(
    '/feedback/analytics',
    passport.authenticate('jwt', { session: false }),
    // TODO: Add role check middleware (AI_TEAM, ADMIN only)
    aiOpsController.getAnalytics
);

export default router;


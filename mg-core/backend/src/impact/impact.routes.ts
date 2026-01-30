/**
 * Impact Routes
 */

import { Router } from 'express';
import { impactController } from './impact.controller';
import passport from 'passport';

const router = Router();

// GET /api/impact/:entityType/:id?view=xxx
router.get(
    '/:entityType/:id',
    passport.authenticate('jwt', { session: false }),
    impactController.getImpactReport
);

export default router;

/**
 * Graph Routes
 * 
 * Secure Graph API endpoints.
 */

import { Router } from 'express';
import { graphController } from './graph.controller';
import passport from 'passport';

const router = Router();

// GET /api/graph/:entityType/:id?view=xxx
router.get(
    '/:entityType/:id',
    passport.authenticate('jwt', { session: false }),
    graphController.getGraph
);

export default router;

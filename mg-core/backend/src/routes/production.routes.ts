/**
 * Production Routes
 * 
 * Read-only endpoints for production data.
 * /api/production/*
 */

import { Router } from 'express';
import productionController from '../controllers/production.controller';
import passport from 'passport';

const router = Router();

/**
 * GET /api/production/sessions
 * Returns list of production sessions from PSEE read-model.
 * Requires authentication.
 */
router.get(
    '/sessions',
    passport.authenticate('jwt', { session: false }),
    (req, res) => productionController.getSessions(req, res)
);

export default router;

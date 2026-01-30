import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import passport from 'passport';
import { requireRoles } from '../middleware/roles.middleware';
import { UserRole } from '../dto/common/common.enums';

const router = Router();

// Personal analytics – any authenticated user
router.get(
    '/personal',
    passport.authenticate('jwt', { session: false }),
    (req, res) => analyticsController.getPersonalAnalytics(req, res)
);

// Executive analytics – admin role required
router.get(
    '/executive',
    passport.authenticate('jwt', { session: false }),
    requireRoles(UserRole.ADMIN),
    (req, res) => analyticsController.getExecutiveAnalytics(req, res)
);

export default router;

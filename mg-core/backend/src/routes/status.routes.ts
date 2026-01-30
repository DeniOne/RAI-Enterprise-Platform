import { Router } from 'express';
import { statusController } from '../controllers/status.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/roles.middleware';

const router = Router();

/**
 * Status Management Routes
 * 
 * All routes require authentication.
 * Status assignment requires ADMIN role.
 */

// POST /api/status/assign - Assign status (ADMIN only)
router.post(
    '/assign',
    authenticate,
    requireRole(['ADMIN']),
    (req, res) => statusController.assignStatus(req, res)
);

// GET /api/status/user/:userId - Get current status
router.get(
    '/user/:userId',
    authenticate,
    (req, res) => statusController.getUserStatus(req, res)
);

// GET /api/status/history/:userId - Get status history (ADMIN or self)
router.get(
    '/history/:userId',
    authenticate,
    (req, res) => statusController.getStatusHistory(req, res)
);

// GET /api/status/all - Get all available statuses
router.get(
    '/all',
    authenticate,
    (req, res) => statusController.getAllStatuses(req, res)
);

// GET /api/status/users - Get all users with statuses (ADMIN only)
router.get(
    '/users',
    authenticate,
    requireRole(['ADMIN']),
    (req, res) => statusController.getUsersWithStatuses(req, res)
);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const status_controller_1 = require("../controllers/status.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_middleware_1 = require("../middleware/roles.middleware");
const router = (0, express_1.Router)();
/**
 * Status Management Routes
 *
 * All routes require authentication.
 * Status assignment requires ADMIN role.
 */
// POST /api/status/assign - Assign status (ADMIN only)
router.post('/assign', auth_middleware_1.authenticate, (0, roles_middleware_1.requireRole)(['ADMIN']), (req, res) => status_controller_1.statusController.assignStatus(req, res));
// GET /api/status/user/:userId - Get current status
router.get('/user/:userId', auth_middleware_1.authenticate, (req, res) => status_controller_1.statusController.getUserStatus(req, res));
// GET /api/status/history/:userId - Get status history (ADMIN or self)
router.get('/history/:userId', auth_middleware_1.authenticate, (req, res) => status_controller_1.statusController.getStatusHistory(req, res));
// GET /api/status/all - Get all available statuses
router.get('/all', auth_middleware_1.authenticate, (req, res) => status_controller_1.statusController.getAllStatuses(req, res));
// GET /api/status/users - Get all users with statuses (ADMIN only)
router.get('/users', auth_middleware_1.authenticate, (0, roles_middleware_1.requireRole)(['ADMIN']), (req, res) => status_controller_1.statusController.getUsersWithStatuses(req, res));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusController = exports.StatusController = void 0;
const status_assignment_service_1 = require("../services/status-assignment.service");
const assign_status_dto_1 = require("../dto/status/assign-status.dto");
const status_response_dto_1 = require("../dto/status/status-response.dto");
/**
 * StatusController
 *
 * Handles HTTP requests for participation status management.
 * RBAC: Status assignment requires ADMIN role (enforced at route level).
 */
class StatusController {
    /**
     * POST /api/status/assign
     * Assign a participation status to a user
     *
     * @requires ADMIN role (enforced by middleware)
     */
    async assignStatus(req, res) {
        try {
            const { userId, statusCode, reason } = req.body;
            // Validate request body
            const validation = (0, assign_status_dto_1.validateAssignStatusDto)({ userId, statusCode, reason });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }
            // Get authenticated user ID (set by auth middleware)
            const assignedBy = req.user?.id;
            if (!assignedBy) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Assign status
            const result = await status_assignment_service_1.statusAssignmentService.assignStatus({
                userId,
                statusCode,
                assignedBy,
                reason
            });
            // Map to response DTO
            const response = (0, status_response_dto_1.mapToStatusResponse)(result);
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Error assigning status:', error);
            // Handle specific errors
            if (error.message.includes('does not exist')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('not active')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('already has status')) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * GET /api/status/user/:userId
     * Get current participation status for a user
     */
    async getUserStatus(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const status = await status_assignment_service_1.statusAssignmentService.getCurrentStatus(userId);
            if (!status) {
                return res.status(404).json({ error: 'No status assigned to this user' });
            }
            const response = (0, status_response_dto_1.mapToStatusResponse)(status);
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Error getting user status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * GET /api/status/history/:userId
     * Get status change history for a user
     *
     * @requires ADMIN role OR self (enforced by middleware)
     */
    async getStatusHistory(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            // Check authorization: ADMIN or self
            const requestingUserId = req.user?.id;
            const userRole = req.user?.role;
            if (userRole !== 'ADMIN' && requestingUserId !== userId) {
                return res.status(403).json({ error: 'Forbidden: You can only view your own history' });
            }
            const history = await status_assignment_service_1.statusAssignmentService.getStatusHistory(userId);
            const response = history.map(status_response_dto_1.mapToStatusHistory);
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Error getting status history:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * GET /api/status/all
     * Get all available participation statuses
     */
    async getAllStatuses(req, res) {
        try {
            const statuses = await status_assignment_service_1.statusAssignmentService.getAllStatuses();
            const response = statuses.map(status_response_dto_1.mapToAvailableStatus);
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Error getting all statuses:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * GET /api/status/users
     * Get all users with their current participation status
     *
     * @requires ADMIN role (enforced by middleware)
     */
    async getUsersWithStatuses(req, res) {
        try {
            const users = await status_assignment_service_1.statusAssignmentService.getUsersWithStatuses();
            // Transform specifically for admin list
            const response = users.map(user => ({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                currentStatus: user.current_participation_status ? {
                    code: user.current_participation_status.status_code,
                    description: user.current_participation_status.status?.description || '',
                    assignedAt: user.current_participation_status.assigned_at
                } : null
            }));
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Error getting users with statuses:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.StatusController = StatusController;
exports.statusController = new StatusController();

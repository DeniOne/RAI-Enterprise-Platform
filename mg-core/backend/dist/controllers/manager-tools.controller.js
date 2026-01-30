"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerToolsController = exports.ManagerToolsController = void 0;
const manager_tools_service_1 = require("../services/manager-tools.service");
class ManagerToolsController {
    /**
     * Submit Kaizen (Employee)
     */
    async submitKaizen(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            const { text } = req.body;
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const kaizen = await manager_tools_service_1.managerToolsService.submitKaizen(userId, text);
            res.status(201).json(kaizen);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * Review Kaizen (Manager only)
     */
    async reviewKaizen(req, res) {
        try {
            const managerId = req.headers['x-user-id'];
            const { status, comment } = req.body;
            const { id } = req.params;
            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const result = await manager_tools_service_1.managerToolsService.reviewKaizen(managerId, id, status, comment);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * Get Kaizen Feed
     */
    async getKaizenFeed(req, res) {
        try {
            const { status } = req.query;
            const feed = await manager_tools_service_1.managerToolsService.getKaizenFeed(status);
            res.json(feed);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * Team Happiness Report (Aggregated)
     */
    async getHappinessReport(req, res) {
        try {
            const managerId = req.headers['x-user-id'];
            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const report = await manager_tools_service_1.managerToolsService.getTeamHappinessReport(managerId);
            res.json(report);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.ManagerToolsController = ManagerToolsController;
exports.managerToolsController = new ManagerToolsController();

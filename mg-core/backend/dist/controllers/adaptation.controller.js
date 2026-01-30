"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptationController = exports.AdaptationController = void 0;
const adaptation_service_1 = require("../services/adaptation.service");
class AdaptationController {
    async getMyStatus(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const status = await adaptation_service_1.adaptationService.getMyAdaptationStatus(userId);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async create1on1(req, res) {
        try {
            const { employeeId, scheduledAt } = req.body;
            const managerId = req.headers['x-user-id'];
            const session = await adaptation_service_1.adaptationService.create1on1({
                managerId,
                employeeId,
                scheduledAt: new Date(scheduledAt)
            });
            res.status(201).json(session);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async complete1on1(req, res) {
        try {
            const { notes, actionItems, mood } = req.body;
            const { id } = req.params;
            const session = await adaptation_service_1.adaptationService.complete1on1(id, notes, actionItems, mood);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getTeamStatus(req, res) {
        try {
            const managerId = req.headers['x-user-id'];
            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const status = await adaptation_service_1.adaptationService.getTeamStatus(managerId);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.AdaptationController = AdaptationController;
exports.adaptationController = new AdaptationController();

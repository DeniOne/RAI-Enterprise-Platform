"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.growthMatrixController = exports.GrowthMatrixController = void 0;
const growth_matrix_service_1 = require("../services/growth-matrix.service");
class GrowthMatrixController {
    async getMyPulse(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const pulse = await growth_matrix_service_1.growthMatrixService.getGrowthPulse(userId);
            res.json(pulse);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.GrowthMatrixController = GrowthMatrixController;
exports.growthMatrixController = new GrowthMatrixController();

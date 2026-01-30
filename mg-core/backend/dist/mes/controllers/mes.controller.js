"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesController = exports.MesController = void 0;
const production_order_service_1 = require("../services/production-order.service");
const quality_service_1 = require("../services/quality.service");
const defect_service_1 = require("../services/defect.service");
const mes_service_1 = require("../services/mes.service");
class MesController {
    async createProductionOrder(req, res) {
        try {
            const user = req.user;
            const dto = req.body;
            const order = await production_order_service_1.productionOrderService.create(dto, user.id);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async getProductionOrders(req, res) {
        try {
            const orders = await production_order_service_1.productionOrderService.getAll();
            res.json(orders);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getProductionOrder(req, res) {
        try {
            const order = await production_order_service_1.productionOrderService.getOne(req.params.id);
            if (!order)
                return res.status(404).json({ message: 'Order not found' });
            res.json(order);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createQualityCheck(req, res) {
        try {
            const user = req.user;
            const dto = req.body;
            const check = await quality_service_1.qualityService.registerCheck(dto, user.id);
            res.status(201).json(check);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async createDefect(req, res) {
        try {
            const user = req.user;
            const dto = req.body;
            const defect = await defect_service_1.defectService.registerDefect(dto, user.id);
            res.status(201).json(defect);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    // ==========================================
    // MOTIVATIONAL ORGANISM ENDPOINTS (Sprint 5-8)
    // ==========================================
    /**
     * GET /api/mes/my-shift
     * Get current employee's shift progress
     */
    async getMyShift(req, res) {
        try {
            const user = req.user;
            const shiftProgress = await mes_service_1.mesService.getMyShiftProgress(user.id);
            res.json(shiftProgress);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/mes/earnings-forecast
     * Calculate earnings forecast based on current shift metrics
     */
    async getMyEarningsForecast(req, res) {
        try {
            const user = req.user;
            const forecast = await mes_service_1.mesService.getEarningsForecast(user.id);
            res.json(forecast);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.MesController = MesController;
exports.mesController = new MesController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const mes_controller_1 = require("./controllers/mes.controller");
const roles_middleware_1 = require("../middleware/roles.middleware");
const common_enums_1 = require("../dto/common/common.enums");
const router = (0, express_1.Router)();
router.use(passport_1.default.authenticate('jwt', { session: false }));
const requireProductionWrite = (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.MANAGER, common_enums_1.UserRole.PRODUCTION_MANAGER);
router.post('/production-orders', requireProductionWrite, mes_controller_1.mesController.createProductionOrder);
router.get('/production-orders', mes_controller_1.mesController.getProductionOrders);
router.get('/production-orders/:id', mes_controller_1.mesController.getProductionOrder);
router.post('/quality-checks', requireProductionWrite, mes_controller_1.mesController.createQualityCheck);
router.post('/defects', requireProductionWrite, mes_controller_1.mesController.createDefect);
// ==========================================
// MOTIVATIONAL ORGANISM ENDPOINTS (Sprint 5-6)
// Personal endpoints for employee shift progress
// ==========================================
router.get('/my-shift', mes_controller_1.mesController.getMyShift);
router.get('/earnings-forecast', mes_controller_1.mesController.getMyEarningsForecast);
exports.mesRouter = router;
exports.default = router;

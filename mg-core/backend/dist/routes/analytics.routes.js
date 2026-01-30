"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = __importDefault(require("../controllers/analytics.controller"));
const passport_1 = __importDefault(require("passport"));
const roles_middleware_1 = require("../middleware/roles.middleware");
const common_enums_1 = require("../dto/common/common.enums");
const router = (0, express_1.Router)();
// Personal analytics – any authenticated user
router.get('/personal', passport_1.default.authenticate('jwt', { session: false }), (req, res) => analytics_controller_1.default.getPersonalAnalytics(req, res));
// Executive analytics – admin role required
router.get('/executive', passport_1.default.authenticate('jwt', { session: false }), (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN), (req, res) => analytics_controller_1.default.getExecutiveAnalytics(req, res));
exports.default = router;

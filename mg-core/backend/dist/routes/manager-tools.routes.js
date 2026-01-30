"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manager_tools_controller_1 = require("../controllers/manager-tools.controller");
const router = (0, express_1.Router)();
// Kaizen Pipeline
router.post('/kaizen', manager_tools_controller_1.managerToolsController.submitKaizen);
router.get('/kaizen/feed', manager_tools_controller_1.managerToolsController.getKaizenFeed);
router.patch('/kaizen/:id/review', manager_tools_controller_1.managerToolsController.reviewKaizen);
// Team Happiness (Aggregated)
router.get('/happiness', manager_tools_controller_1.managerToolsController.getHappinessReport);
exports.default = router;

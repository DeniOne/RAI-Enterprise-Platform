"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adaptation_controller_1 = require("../controllers/adaptation.controller");
const growth_matrix_controller_1 = require("../controllers/growth-matrix.controller");
const router = (0, express_1.Router)();
// Adaptation & Mentorship
router.get('/my', (req, res) => adaptation_controller_1.adaptationController.getMyStatus(req, res));
router.post('/1on1', (req, res) => adaptation_controller_1.adaptationController.create1on1(req, res));
router.patch('/1on1/:id/complete', (req, res) => adaptation_controller_1.adaptationController.complete1on1(req, res));
router.get('/team-status', (req, res) => adaptation_controller_1.adaptationController.getTeamStatus(req, res));
// Growth Matrix
router.get('/pulse', (req, res) => growth_matrix_controller_1.growthMatrixController.getMyPulse(req, res));
exports.default = router;

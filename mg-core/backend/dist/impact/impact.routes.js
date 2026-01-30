"use strict";
/**
 * Impact Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const impact_controller_1 = require("./impact.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// GET /api/impact/:entityType/:id?view=xxx
router.get('/:entityType/:id', passport_1.default.authenticate('jwt', { session: false }), impact_controller_1.impactController.getImpactReport);
exports.default = router;

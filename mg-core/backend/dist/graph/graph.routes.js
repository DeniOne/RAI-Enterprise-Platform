"use strict";
/**
 * Graph Routes
 *
 * Secure Graph API endpoints.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const graph_controller_1 = require("./graph.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// GET /api/graph/:entityType/:id?view=xxx
router.get('/:entityType/:id', passport_1.default.authenticate('jwt', { session: false }), graph_controller_1.graphController.getGraph);
exports.default = router;

"use strict";
/**
 * Production Routes
 *
 * Read-only endpoints for production data.
 * /api/production/*
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const production_controller_1 = __importDefault(require("../controllers/production.controller"));
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
/**
 * GET /api/production/sessions
 * Returns list of production sessions from PSEE read-model.
 * Requires authentication.
 */
router.get('/sessions', passport_1.default.authenticate('jwt', { session: false }), (req, res) => production_controller_1.default.getSessions(req, res));
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telegram_controller_1 = __importDefault(require("../controllers/telegram.controller"));
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// Webhook endpoint (no auth required - Telegram will call this)
router.post('/webhook', (req, res) => telegram_controller_1.default.webhook(req, res));
// Link Telegram account (requires authentication)
router.post('/link', passport_1.default.authenticate('jwt', { session: false }), (req, res) => telegram_controller_1.default.linkAccount(req, res));
// Get bot status (requires authentication)
router.get('/status', passport_1.default.authenticate('jwt', { session: false }), (req, res) => telegram_controller_1.default.getStatus(req, res));
exports.default = router;

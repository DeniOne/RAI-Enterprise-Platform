"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const economy_controller_1 = require("../controllers/economy.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const economyController = new economy_controller_1.EconomyController();
router.get('/wallet', passport_1.default.authenticate('jwt', { session: false }), (req, res) => economyController.getWallet(req, res));
router.post('/transfer', passport_1.default.authenticate('jwt', { session: false }), (req, res) => economyController.transfer(req, res));
router.get('/transactions', passport_1.default.authenticate('jwt', { session: false }), (req, res) => economyController.getTransactions(req, res));
exports.default = router;

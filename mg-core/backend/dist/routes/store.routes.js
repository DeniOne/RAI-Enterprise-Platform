"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_controller_1 = require("../controllers/store.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const storeController = new store_controller_1.StoreController();
router.get('/products', passport_1.default.authenticate('jwt', { session: false }), (req, res) => storeController.getProducts(req, res));
router.post('/purchase/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => storeController.purchaseProduct(req, res));
exports.default = router;

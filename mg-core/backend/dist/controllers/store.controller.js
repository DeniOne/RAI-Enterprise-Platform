"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreController = void 0;
const store_service_1 = __importDefault(require("../services/store.service"));
class StoreController {
    async getProducts(req, res) {
        try {
            const products = await store_service_1.default.getProducts();
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async purchaseProduct(req, res) {
        try {
            const userId = req.user.id;
            const productId = req.params.id;
            const purchase = await store_service_1.default.purchaseProduct(userId, productId);
            res.status(201).json(purchase);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.StoreController = StoreController;

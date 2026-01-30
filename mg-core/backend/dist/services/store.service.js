"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
class StoreService {
    async getProducts(activeOnly = true) {
        return prisma_1.prisma.product.findMany({
            where: activeOnly ? { is_active: true } : {},
            orderBy: { created_at: 'desc' }
        });
    }
    async getProduct(id) {
        return prisma_1.prisma.product.findUnique({ where: { id } });
    }
    async purchaseProduct(userId, productId) {
        return prisma_1.prisma.$transaction(async (tx) => {
            // 1. Get product
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product)
                throw new Error('Product not found');
            if (!product.is_active)
                throw new Error('Product is not active');
            if (product.stock <= 0)
                throw new Error('Product is out of stock');
            // 2. Get wallet
            const wallet = await tx.wallet.findUnique({ where: { user_id: userId } });
            if (!wallet)
                throw new Error('Wallet not found');
            if (wallet.mc_balance.lessThan(product.price)) {
                throw new Error('Insufficient funds');
            }
            // 3. Deduct balance
            await tx.wallet.update({
                where: { user_id: userId },
                data: { mc_balance: { decrement: product.price } }
            });
            // 4. Create transaction record
            await tx.transaction.create({
                data: {
                    type: client_1.TransactionType.STORE_PURCHASE,
                    currency: client_1.Currency.MC,
                    amount: product.price,
                    sender_id: userId,
                    description: `Purchase of ${product.name}`,
                    metadata: { productId: product.id, productName: product.name }
                }
            });
            // 5. Decrement stock
            await tx.product.update({
                where: { id: productId },
                data: { stock: { decrement: 1 } }
            });
            // 6. Create purchase record
            const purchase = await tx.purchase.create({
                data: {
                    user_id: userId,
                    product_id: productId,
                    price_paid: product.price,
                    status: 'COMPLETED'
                }
            });
            return purchase;
        });
    }
}
exports.StoreService = StoreService;
exports.default = new StoreService();

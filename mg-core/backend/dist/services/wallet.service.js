"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const crypto_1 = require("crypto");
const prisma_1 = require("../config/prisma");
const economy_registry_bridge_1 = require("./economy-registry.bridge");
class WalletService {
    async getWalletByUserId(userId) {
        let wallet = await prisma_1.prisma.wallet.findUnique({
            where: { user_id: userId }
        });
        if (!wallet) {
            wallet = await this.createWallet(userId);
        }
        return this.mapToResponse(wallet);
    }
    async createWallet(userId) {
        // 1. Validations (Domain)
        // 2. Generate Identity (Registry First Principle)
        const walletId = (0, crypto_1.randomUUID)();
        // 3. Registry Governance Gate (Must succeed BEFORE persistence)
        // If this fails (Blocking), we throw and NEVER touch the DB.
        // If it succeeds, we have a "reservation" or effective structure in Registry.
        await economy_registry_bridge_1.economyRegistryBridge.createWalletStructure(userId, walletId);
        // 4. Persistence (Projection)
        // We persist the Wallet with the ID we already established in Registry.
        return await prisma_1.prisma.wallet.create({
            data: {
                id: walletId, // Explicit ID to match Registry
                user_id: userId,
                mc_balance: 0,
                gmc_balance: 0,
                mc_frozen: 0
            }
        });
    }
    /**
     * Transfer Wallet Ownership (Strict Registry Governance)
     */
    async transferOwnership(walletId, newOwnerId, force = false, reason) {
        // 1. Registry Governance
        await economy_registry_bridge_1.economyRegistryBridge.transferWalletOwnership(walletId, newOwnerId, force, reason);
        // 2. Domain Update
        await prisma_1.prisma.wallet.update({
            where: { id: walletId },
            data: { user_id: newOwnerId }
        });
    }
    mapToResponse(wallet) {
        return {
            userId: wallet.user_id,
            mcBalance: Number(wallet.mc_balance),
            gmcBalance: Number(wallet.gmc_balance),
            mcFrozen: Number(wallet.mc_frozen),
            safeActivatedAt: wallet.safe_activated_at?.toISOString(),
            safeExpiresAt: wallet.safe_expires_at?.toISOString(),
            updatedAt: wallet.updated_at.toISOString()
        };
    }
}
exports.WalletService = WalletService;

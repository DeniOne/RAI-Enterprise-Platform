import { Wallet } from '@prisma/client';
import { WalletResponseDto } from '../dto/economy/economy.dto';
import { randomUUID } from 'crypto';

import { prisma } from '../config/prisma';
import { economyRegistryBridge } from './economy-registry.bridge';

export class WalletService {
    async getWalletByUserId(userId: string): Promise<WalletResponseDto> {
        let wallet = await prisma.wallet.findUnique({
            where: { user_id: userId }
        });

        if (!wallet) {
            wallet = await this.createWallet(userId);
        }

        return this.mapToResponse(wallet);
    }

    async createWallet(userId: string): Promise<Wallet> {
        // 1. Validations (Domain)

        // 2. Generate Identity (Registry First Principle)
        const walletId = randomUUID();

        // 3. Registry Governance Gate (Must succeed BEFORE persistence)
        // If this fails (Blocking), we throw and NEVER touch the DB.
        // If it succeeds, we have a "reservation" or effective structure in Registry.
        await economyRegistryBridge.createWalletStructure(userId, walletId);

        // 4. Persistence (Projection)
        // We persist the Wallet with the ID we already established in Registry.
        return await prisma.wallet.create({
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
    async transferOwnership(walletId: string, newOwnerId: string, force: boolean = false, reason?: string) {
        // 1. Registry Governance
        await economyRegistryBridge.transferWalletOwnership(walletId, newOwnerId, force, reason);

        // 2. Domain Update
        await prisma.wallet.update({
            where: { id: walletId },
            data: { user_id: newOwnerId }
        });
    }

    private mapToResponse(wallet: Wallet): WalletResponseDto {
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


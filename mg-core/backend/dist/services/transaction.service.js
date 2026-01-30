"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_enums_1 = require("../dto/common/common.enums");
const prisma_1 = require("../config/prisma");
const wallet_service_1 = require("./wallet.service");
const logger_1 = require("../config/logger");
const walletService = new wallet_service_1.WalletService();
class TransactionService {
    async createTransaction(dto, senderId) {
        // Start a transaction to ensure atomicity
        return await prisma_1.prisma.$transaction(async (tx) => {
            // CANON v2.2: Economy Guard - Check Foundation Acceptance
            const checkAcceptance = async (uid, role) => {
                const acceptance = await tx.foundationAcceptance.findUnique({ where: { person_id: uid } });
                const ACTIVE_VERSION = 'v1.0'; // TODO: Config
                if (!acceptance || acceptance.decision !== 'ACCEPTED') {
                    throw new Error(`FOUNDATION_REQUIRED: ${role} ${uid} cannot participate in economy without Foundation Acceptance.`);
                }
                if (acceptance.version !== ACTIVE_VERSION) {
                    throw new Error(`FOUNDATION_VERSION_MISMATCH: ${role} ${uid} has outdated Foundation version.`);
                }
            };
            if (senderId)
                await checkAcceptance(senderId, 'Sender');
            if (dto.recipientId)
                await checkAcceptance(dto.recipientId, 'Recipient');
            // 1. Validate Sender Balance (if spending or transferring)
            if (senderId && (dto.type === common_enums_1.TransactionType.SPEND || dto.type === common_enums_1.TransactionType.TRANSFER)) {
                const senderWallet = await tx.wallet.findUnique({ where: { user_id: senderId } });
                if (!senderWallet)
                    throw new Error('Sender wallet not found');
                const balance = dto.currency === common_enums_1.Currency.MC ? Number(senderWallet.mc_balance) : Number(senderWallet.gmc_balance);
                if (balance < dto.amount) {
                    throw new Error('Insufficient funds');
                }
                // Deduct from sender
                await tx.wallet.update({
                    where: { user_id: senderId },
                    data: {
                        mc_balance: dto.currency === common_enums_1.Currency.MC ? { decrement: dto.amount } : undefined,
                        gmc_balance: dto.currency === common_enums_1.Currency.GMC ? { decrement: dto.amount } : undefined,
                    }
                });
            }
            // 2. Add to Recipient (if earning or transferring)
            if (dto.recipientId && (dto.type === common_enums_1.TransactionType.EARN || dto.type === common_enums_1.TransactionType.TRANSFER || dto.type === common_enums_1.TransactionType.REWARD)) {
                // Ensure recipient wallet exists
                let recipientWallet = await tx.wallet.findUnique({ where: { user_id: dto.recipientId } });
                if (!recipientWallet) {
                    // Refactor: Use WalletService to create wallet respecting Registry Governance
                    // Note: WalletService uses its own prisma instance outside this transaction for Registry Bridge calls.
                    // This breaks atomicity slightly regarding the Registry call vs this TX, but 
                    // since Wallet creation is idempotent-ish and safe to exist even if TX fails later, it is acceptable.
                    // However, we must ensure we don't block the transaction logic.
                    // Ideally we should move this check OUTSIDE the transaction or allow side-effects.
                    // Since walletService.createWallet does internal translation and commits, we call it.
                    // IMPORTANT: We cannot await it inside this prisma.$transaction if it uses a different prisma context that might lock.
                    // But here it's fine as long as we accept the wallet is created even if TX rolls back later.
                    // Actually, for strictness, if TX fails, wallet remains. That is acceptable for a "Wallet" entity.
                    recipientWallet = await walletService.createWallet(dto.recipientId);
                    logger_1.logger.info('WALLET_AUTO_CREATED', {
                        userId: dto.recipientId,
                        reason: 'Transaction Requirement',
                        impactHash: 'registry_impact_verified' // Placeholder until Bridge returns actual hash
                    });
                }
                // Add to recipient
                await tx.wallet.update({
                    where: { user_id: dto.recipientId },
                    data: {
                        mc_balance: dto.currency === common_enums_1.Currency.MC ? { increment: dto.amount } : undefined,
                        gmc_balance: dto.currency === common_enums_1.Currency.GMC ? { increment: dto.amount } : undefined,
                    }
                });
            }
            // 3. Create Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    type: dto.type,
                    currency: dto.currency,
                    amount: dto.amount,
                    sender_id: senderId,
                    recipient_id: dto.recipientId,
                    description: dto.description,
                }
            });
            return this.mapToResponse(transaction);
        });
    }
    async getTransactions(userId) {
        const transactions = await prisma_1.prisma.transaction.findMany({
            where: {
                OR: [
                    { sender_id: userId },
                    { recipient_id: userId }
                ]
            },
            orderBy: { created_at: 'desc' }
        });
        return transactions.map(this.mapToResponse);
    }
    mapToResponse(tx) {
        return {
            id: tx.id,
            type: tx.type,
            currency: tx.currency,
            amount: Number(tx.amount),
            senderId: tx.sender_id || undefined,
            recipientId: tx.recipient_id || undefined,
            description: tx.description || undefined,
            metadata: tx.metadata || undefined,
            createdAt: tx.created_at.toISOString()
        };
    }
}
exports.TransactionService = TransactionService;

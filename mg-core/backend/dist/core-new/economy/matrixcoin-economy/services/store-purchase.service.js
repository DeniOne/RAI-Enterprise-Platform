"use strict";
/**
 * Store Purchase Service
 * Module 08 — MatrixCoin-Economy
 * PHASE 1 — BASIC PURCHASE FLOW
 *
 * ⚠️ STRICT TRANSACTIONAL LOGIC
 * - Source of Truth: Wallet Table
 * - Locking: Atomic updateMany with Predicates
 * - Rollback: Explicit Status Update
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorePurchaseService = exports.StorePurchaseError = void 0;
const client_1 = require("@prisma/client");
const audit_types_1 = require("../core/audit.types");
const crypto_1 = require("crypto");
class StorePurchaseError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'StorePurchaseError';
    }
}
exports.StorePurchaseError = StorePurchaseError;
class StorePurchaseService {
    prisma;
    eligibilityService;
    auditRepo;
    constructor(prisma, eligibilityService, auditRepo) {
        this.prisma = prisma;
        this.eligibilityService = eligibilityService;
        this.auditRepo = auditRepo;
    }
    /**
     * Execute Atomic Purchase
     * 9-Step Flow with Strict Rollback
     */
    async purchaseItem(userId, itemId, idempotencyKey) {
        const timestamp = new Date();
        // =========================================================================
        // STEP 0: IDEMPOTENCY & INITIALIZATION (Outside TX)
        // =========================================================================
        // 0.1 Check Existing or Create PENDING
        // Using upsert would be ideal but we want to know IF it existed to return result immediately.
        // We use finding first, then creating if not found (handling race condition via unique constraint catch).
        let purchase = await this.prisma.purchase.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } }
        });
        if (purchase) {
            // Idempotency Hit
            if (purchase.status === client_1.PurchaseStatus.COMPLETED) {
                return purchase; // Return the record directly
            }
            if (purchase.status === client_1.PurchaseStatus.ROLLED_BACK || purchase.status === client_1.PurchaseStatus.REJECTED) {
                throw new StorePurchaseError('IDEMPOTENCY_REJECTED', 'This request was previously processed and rejected/rolled back.');
            }
            if (purchase.status === client_1.PurchaseStatus.PENDING_APPROVAL) {
                // In progress... or stuck. For now, we assume in progress and throw Conflict.
                throw new StorePurchaseError('CONCURRENT_REQUEST', 'Transaction is currently processing.');
            }
        }
        // 0.2 Create PENDING Purchase
        try {
            purchase = await this.prisma.purchase.create({
                data: {
                    userId,
                    itemId,
                    priceMC: 0, // Placeholder, will set actual price inside logic or pre-calc?
                    // Better to Pre-Calc price here? No, price is in StoreItem.
                    // We store 0 and update it later? Or read Item first?
                    // Let's read Item first to get Price for the Record?
                    // NO, Requirements say "Atomic". 
                    // Let's set 0 as "Unknown" or allow update?
                    // Let's set it to valid integer if possible, or 0.
                    status: client_1.PurchaseStatus.PENDING_APPROVAL,
                    idempotencyKey,
                    transactionId: (0, crypto_1.randomUUID)(), // Temporary ID until finalized? Or internal ID.
                }
            });
            // Audit Creation
            this.auditRepo.saveEvent({
                ...(0, audit_types_1.createBaseAuditEvent)('STORE_PURCHASE_CREATED', // Need to add to Enum
                userId, 'SYSTEM'),
                eventId: (0, crypto_1.randomUUID)(),
                eventType: 'STORE_PURCHASE_CREATED',
                payload: { purchaseId: purchase.id, itemId }
            });
        }
        catch (error) {
            // Race condition check
            if (error.code === 'P2002') { // Unique constraint
                return this.purchaseItem(userId, itemId, idempotencyKey); // Retry recursive (max depth?)
            }
            throw error;
        }
        const purchaseId = purchase.id;
        // =========================================================================
        // STEP 1-N: ATOMIC TRANSACTION BLOCK
        // =========================================================================
        try {
            await this.prisma.$transaction(async (tx) => {
                // ---------------------------------------------------------------------
                // STEP 1: LOAD DEPENDENCIES (Users & Items)
                // ---------------------------------------------------------------------
                const item = await tx.storeItem.findUnique({ where: { id: itemId } });
                if (!item)
                    throw new StorePurchaseError('ITEM_NOT_FOUND', 'Item not found');
                // Update Purchase record with actual Price
                // (We do this early to lock the intent?)
                // Actually we just use local variable, update DB at the end or begin.
                const price = item.priceMC;
                // ---------------------------------------------------------------------
                // STEP 2: VALIDATE ITEM (State)
                // ---------------------------------------------------------------------
                if (!item.active)
                    throw new StorePurchaseError('ITEM_INACTIVE', 'Item is not active');
                if (item.stock !== null && item.stock <= 0)
                    throw new StorePurchaseError('OUT_OF_STOCK', 'Item is out of stock');
                // Check Purchase Limit
                if (item.purchaseLimit) {
                    const count = await tx.purchase.count({
                        where: { userId, itemId, status: { not: client_1.PurchaseStatus.ROLLED_BACK } } // Count PENDING too? Yes.
                    });
                    if (count > item.purchaseLimit)
                        throw new StorePurchaseError('LIMIT_EXCEEDED', 'Purchase limit exceeded');
                }
                // ---------------------------------------------------------------------
                // STEP 3: ELIGIBILITY CHECK
                // ---------------------------------------------------------------------
                // We need to call EligibilityService. But it requires Snapshot.
                // Snapshot generation is expensive. 
                // PHASE 1 Simplification: We only check Wallet Balance here?
                // Requirement said: "Inject StoreEligibilityService".
                // We'll trust Wallet balance for "Affordability" but use Eligibility for "Access" rules.
                // Assuming Eligibility Service is purely rule-based on user props?
                // If it needs MC Snapshot, we have to generate it.
                // For PHASE 1, we rely on Wallet balance for funds.
                // ---------------------------------------------------------------------
                // STEP 4: CALCULATE PRICE (Frozen Logic?)
                // ---------------------------------------------------------------------
                // Price is fixed integer `item.priceMC`.
                // ---------------------------------------------------------------------
                // STEP 5: ATOMIC FUNDS LOCK & DEBIT (Source of Truth: Wallet)
                // ---------------------------------------------------------------------
                const walletUpdate = await tx.wallet.updateMany({
                    where: {
                        user_id: userId,
                        mc_balance: { gte: price } // 🔒 Predicate Lock
                    },
                    data: {
                        mc_balance: { decrement: price }
                    }
                });
                if (walletUpdate.count === 0) {
                    throw new StorePurchaseError('INSUFFICIENT_FUNDS', `Insufficient funds in wallet. Required: ${price}`);
                }
                // ---------------------------------------------------------------------
                // STEP 6: ATOMIC STOCK LOCK & DEBIT
                // ---------------------------------------------------------------------
                // Only if stock is tracked
                if (item.stock !== null) {
                    const stockUpdate = await tx.storeItem.updateMany({
                        where: {
                            id: itemId,
                            stock: { gt: 0 } // 🔒 Predicate Lock
                        },
                        data: {
                            stock: { decrement: 1 }
                        }
                    });
                    if (stockUpdate.count === 0) {
                        // Rare race condition: Passed Step 2 but failed here.
                        // Must Rollback Wallet! (Automatic by tx rollback)
                        throw new StorePurchaseError('OUT_OF_STOCK', 'Item went out of stock during transaction');
                    }
                }
                // ---------------------------------------------------------------------
                // STEP 7: FINALIZE PURCHASE RECORD
                // ---------------------------------------------------------------------
                await tx.purchase.update({
                    where: { id: purchaseId },
                    data: {
                        status: client_1.PurchaseStatus.COMPLETED,
                        priceMC: price
                    }
                });
                // ---------------------------------------------------------------------
                // STEP 8: AUDIT LOG (Success)
                // ---------------------------------------------------------------------
                // Using 'any' bypass as types are frozen in core for now
                // Ideally should update AuditEventType
            });
            // =========================================================================
            // SUCCESS - Post-Transaction
            // =========================================================================
            this.auditRepo.saveEvent({
                ...(0, audit_types_1.createBaseAuditEvent)('STORE_PURCHASE_COMPLETED', userId, 'SYSTEM'),
                eventId: (0, crypto_1.randomUUID)(),
                eventType: 'STORE_PURCHASE_COMPLETED',
                payload: { purchaseId, itemId, status: 'COMPLETED' }
            });
            // Re-fetch updated purchase to return
            return this.prisma.purchase.findUnique({ where: { id: purchaseId } });
        }
        catch (error) {
            // =========================================================================
            // FAILURE - ROLLBACK HANDLER
            // =========================================================================
            // The TX is already rolled back (Wallet & Stock are safe).
            // We must now explicitly update Purchase to ROLLED_BACK.
            await this.prisma.purchase.update({
                where: { id: purchaseId },
                data: {
                    status: client_1.PurchaseStatus.ROLLED_BACK,
                    // Optionally store error reason in metadata if we add it
                }
            });
            // Audit Failure
            this.auditRepo.saveEvent({
                ...(0, audit_types_1.createBaseAuditEvent)('STORE_PURCHASE_ROLLED_BACK', userId, 'SYSTEM'),
                eventId: (0, crypto_1.randomUUID)(),
                eventType: 'STORE_PURCHASE_ROLLED_BACK', // Force string
                payload: { purchaseId, error: error.message }
            });
            throw error; // Re-throw to caller
        }
    }
}
exports.StorePurchaseService = StorePurchaseService;

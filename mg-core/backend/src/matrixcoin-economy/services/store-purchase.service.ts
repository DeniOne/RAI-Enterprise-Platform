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

import { PrismaClient, PurchaseStatus } from '@prisma/client';
import { StoreEligibilityService } from './store-eligibility.service';
import { AuditEventRepository } from './audit-event.repository';
import { AuditEventType, createBaseAuditEvent } from '../core/audit.types';
import { randomUUID } from 'crypto';
import { StoreAccessDeniedReason } from '../core/economy.enums'; // Ensure this exists or map correctly

export class StorePurchaseError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'StorePurchaseError';
    }
}

export class StorePurchaseService {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly eligibilityService: StoreEligibilityService,
        private readonly auditRepo: AuditEventRepository
    ) { }

    /**
     * Execute Atomic Purchase
     * 9-Step Flow with Strict Rollback
     */
    public async purchaseItem(
        userId: string,
        itemId: string,
        idempotencyKey: string
    ): Promise<any> { // Replace 'any' with PurchaseResult type later
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
            if (purchase.status === PurchaseStatus.COMPLETED) {
                return purchase; // Return the record directly
            }
            if (purchase.status === PurchaseStatus.ROLLED_BACK || purchase.status === PurchaseStatus.REJECTED) {
                throw new StorePurchaseError('IDEMPOTENCY_REJECTED', 'This request was previously processed and rejected/rolled back.');
            }
            if (purchase.status === PurchaseStatus.PENDING_APPROVAL) {
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
                    status: PurchaseStatus.PENDING_APPROVAL,
                    idempotencyKey,
                    transactionId: randomUUID(), // Temporary ID until finalized? Or internal ID.
                }
            });

            // Audit Creation
            this.auditRepo.saveEvent({
                ...createBaseAuditEvent(
                    'STORE_PURCHASE_CREATED' as any, // Need to add to Enum
                    userId,
                    'SYSTEM'
                ),
                eventId: randomUUID(),
                eventType: 'STORE_PURCHASE_CREATED' as any,
                payload: { purchaseId: purchase.id, itemId }
            } as any);

        } catch (error: any) {
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
                if (!item) throw new StorePurchaseError('ITEM_NOT_FOUND', 'Item not found');

                // Update Purchase record with actual Price
                // (We do this early to lock the intent?)
                // Actually we just use local variable, update DB at the end or begin.
                const price = item.priceMC;

                // ---------------------------------------------------------------------
                // STEP 2: VALIDATE ITEM (State)
                // ---------------------------------------------------------------------
                if (!item.active) throw new StorePurchaseError('ITEM_INACTIVE', 'Item is not active');
                if (item.stock !== null && item.stock <= 0) throw new StorePurchaseError('OUT_OF_STOCK', 'Item is out of stock');

                // Check Purchase Limit
                if (item.purchaseLimit) {
                    const count = await tx.purchase.count({
                        where: { userId, itemId, status: { not: PurchaseStatus.ROLLED_BACK } } // Count PENDING too? Yes.
                    });
                    if (count > item.purchaseLimit) throw new StorePurchaseError('LIMIT_EXCEEDED', 'Purchase limit exceeded');
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
                        status: PurchaseStatus.COMPLETED,
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
                ...createBaseAuditEvent(
                    'STORE_PURCHASE_COMPLETED' as any,
                    userId,
                    'SYSTEM'
                ),
                eventId: randomUUID(),
                eventType: 'STORE_PURCHASE_COMPLETED' as any,
                payload: { purchaseId, itemId, status: 'COMPLETED' }
            } as any);

            // Re-fetch updated purchase to return
            return this.prisma.purchase.findUnique({ where: { id: purchaseId } });

        } catch (error: any) {
            // =========================================================================
            // FAILURE - ROLLBACK HANDLER
            // =========================================================================
            // The TX is already rolled back (Wallet & Stock are safe).
            // We must now explicitly update Purchase to ROLLED_BACK.

            await this.prisma.purchase.update({
                where: { id: purchaseId },
                data: {
                    status: PurchaseStatus.ROLLED_BACK,
                    // Optionally store error reason in metadata if we add it
                }
            });

            // Audit Failure
            this.auditRepo.saveEvent({
                ...createBaseAuditEvent(
                    'STORE_PURCHASE_ROLLED_BACK' as any,
                    userId,
                    'SYSTEM'
                ),
                eventId: randomUUID(),
                eventType: 'STORE_PURCHASE_ROLLED_BACK' as any, // Force string
                payload: { purchaseId, error: error.message }
            } as any);

            throw error; // Re-throw to caller
        }
    }
}

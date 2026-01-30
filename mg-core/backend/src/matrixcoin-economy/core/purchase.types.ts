/**
 * Purchase Types
 * Module 08 — MatrixCoin-Economy
 * PHASE 0 — STORE (PURCHASE LOGIC)
 * 
 * ⚠️ CANONICAL: Defines types for Purchase Flow (PHASE 1+)
 * This is a placeholder for future Purchase implementation.
 */

import { PurchaseStatus } from '@prisma/client';

// Re-export from Prisma
export { PurchaseStatus };

/**
 * Context required for Purchase operation
 * Will be used in PHASE 1+
 */
export interface PurchaseContext {
    readonly userId: string;
    readonly itemId: string;
    readonly idempotencyKey: string;
    readonly timestamp: Date;
}

/**
 * Result of Purchase operation
 * Will be used in PHASE 1+
 */
export interface PurchaseResult {
    readonly purchaseId: string;
    readonly itemId: string;
    readonly priceMC: number;
    readonly status: PurchaseStatus;
    readonly balanceBefore: number;
    readonly balanceAfter: number;
    readonly createdAt: Date;
}

/**
 * Purchase error codes
 * Aligned with STORE-API.md error responses
 */
export enum PurchaseErrorCode {
    INVALID_ITEM = 'INVALID_ITEM',
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    PURCHASE_LIMIT_EXCEEDED = 'PURCHASE_LIMIT_EXCEEDED',
    ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
    ITEM_INACTIVE = 'ITEM_INACTIVE',
    IDEMPOTENCY_CONFLICT = 'IDEMPOTENCY_CONFLICT',
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Purchase domain error
 */
export class PurchaseError extends Error {
    constructor(
        public readonly code: PurchaseErrorCode,
        message: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'PurchaseError';
    }
}

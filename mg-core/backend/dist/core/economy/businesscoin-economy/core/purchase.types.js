"use strict";
/**
 * Purchase Types
 * Module 08 — BusinessCoin-Economy
 * PHASE 0 — STORE (PURCHASE LOGIC)
 *
 * ⚠️ CANONICAL: Defines types for Purchase Flow (PHASE 1+)
 * This is a placeholder for future Purchase implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseError = exports.PurchaseErrorCode = exports.PurchaseStatus = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PurchaseStatus", { enumerable: true, get: function () { return client_1.PurchaseStatus; } });
/**
 * Purchase error codes
 * Aligned with STORE-API.md error responses
 */
var PurchaseErrorCode;
(function (PurchaseErrorCode) {
    PurchaseErrorCode["INVALID_ITEM"] = "INVALID_ITEM";
    PurchaseErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    PurchaseErrorCode["PURCHASE_LIMIT_EXCEEDED"] = "PURCHASE_LIMIT_EXCEEDED";
    PurchaseErrorCode["ITEM_NOT_FOUND"] = "ITEM_NOT_FOUND";
    PurchaseErrorCode["ITEM_INACTIVE"] = "ITEM_INACTIVE";
    PurchaseErrorCode["IDEMPOTENCY_CONFLICT"] = "IDEMPOTENCY_CONFLICT";
    PurchaseErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    PurchaseErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(PurchaseErrorCode || (exports.PurchaseErrorCode = PurchaseErrorCode = {}));
/**
 * Purchase domain error
 */
class PurchaseError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PurchaseError';
    }
}
exports.PurchaseError = PurchaseError;

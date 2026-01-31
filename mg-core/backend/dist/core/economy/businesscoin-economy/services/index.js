"use strict";
/**
 * Services Barrel Export
 * Module 08 — BusinessCoin-Economy
 *
 * ⚠️ STRUCTURE ONLY: Только интерфейсы, реализации нет
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./bc.service.interface"), exports);
__exportStar(require("./gbc.service.interface"), exports);
__exportStar(require("./store.service.interface"), exports);
__exportStar(require("./auction.service.interface"), exports);
__exportStar(require("./ai-adapter.interface"), exports);
// Implementations (STEP 2.4)
__exportStar(require("./bc.service"), exports);
__exportStar(require("./gbc.service"), exports);
// Implementations (STEP 3.1 / PHASE 0)
__exportStar(require("./store-eligibility.service"), exports);
// Implementations (PHASE 1)
__exportStar(require("./store-purchase.service"), exports);
// Implementations (STEP 3.2)
__exportStar(require("./auction.service"), exports);
// Implementations (STEP 3.3)
__exportStar(require("./gbc-recognition.service"), exports);
// Implementations (STEP 4)
__exportStar(require("./governance.service"), exports);
__exportStar(require("./store-eligibility.adapter"), exports);
__exportStar(require("./audit-event.repository"), exports);

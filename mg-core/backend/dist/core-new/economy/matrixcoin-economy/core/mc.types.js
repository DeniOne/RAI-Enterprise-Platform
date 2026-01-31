"use strict";
/**
 * MC (Matrix Coin) Type Definitions
 * Module 08 — MatrixCoin-Economy
 *
 * ⚠️ GUARD: MC НЕ является:
 * - деньгами
 * - бонусом
 * - зарплатой
 * - эквивалентом KPI
 *
 * MC — временный след участия, а не награда.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCLifecycleState = void 0;
// MCLifecycleState импортируется из economy.enums.ts
// Ref: STEP-2-STATE-LIFECYCLE.md Section 1.1
var economy_enums_1 = require("./economy.enums");
Object.defineProperty(exports, "MCLifecycleState", { enumerable: true, get: function () { return economy_enums_1.MCLifecycleState; } });

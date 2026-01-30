"use strict";
/**
 * Canonical Guard Registry
 *
 * This module exports the centralized registry for all canonical checks.
 *
 * CRITICAL: This is the ONLY entry point for canonical validation.
 * Direct imports of checkMCCanon or checkGMCCanon are FORBIDDEN.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCanon = void 0;
var canonicalGuardRegistry_1 = require("./canonicalGuardRegistry");
Object.defineProperty(exports, "checkCanon", { enumerable: true, get: function () { return canonicalGuardRegistry_1.checkCanon; } });

"use strict";
/**
 * Canonical Guard for MatrixGin
 *
 * This module exports the canonical guard system for enforcing
 * the philosophical rules of MC and GMC tokens.
 *
 * CRITICAL: Use ONLY the checkCanon function from registry.
 * Direct use of checkMCCanon or checkGMCCanon is FORBIDDEN.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCanon = exports.CanonicalViolationLogger = exports.CanonicalViolationError = exports.CanonicalViolationType = void 0;
// Export types for reference
var canonicalViolation_1 = require("./canonicalViolation");
Object.defineProperty(exports, "CanonicalViolationType", { enumerable: true, get: function () { return canonicalViolation_1.CanonicalViolationType; } });
var CanonicalViolationError_1 = require("./CanonicalViolationError");
Object.defineProperty(exports, "CanonicalViolationError", { enumerable: true, get: function () { return CanonicalViolationError_1.CanonicalViolationError; } });
var canonicalViolationLogger_1 = require("./canonicalViolationLogger");
Object.defineProperty(exports, "CanonicalViolationLogger", { enumerable: true, get: function () { return canonicalViolationLogger_1.CanonicalViolationLogger; } });
// Export ONLY the registry - this is the single entry point
var registry_1 = require("./registry");
Object.defineProperty(exports, "checkCanon", { enumerable: true, get: function () { return registry_1.checkCanon; } });
// NOTE: checkMCCanon and checkGMCCanon are NOT exported
// They are internal implementation details
// All services MUST use checkCanon from registry

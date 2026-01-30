"use strict";
/**
 * Anti-Fraud Type Definitions
 * Module 13: Corporate University
 *
 * CANON: Signals are append-only, immutable, never deleted
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalType = exports.SignalLevel = void 0;
// Signal Levels
var SignalLevel;
(function (SignalLevel) {
    SignalLevel["LOW"] = "LOW";
    SignalLevel["MEDIUM"] = "MEDIUM";
    SignalLevel["HIGH"] = "HIGH"; // Rule violations, requires manual review
})(SignalLevel || (exports.SignalLevel = SignalLevel = {}));
// Signal Types
var SignalType;
(function (SignalType) {
    // Metric-Level (LOW)
    SignalType["CONVERSION_ANOMALY"] = "CONVERSION_ANOMALY";
    SignalType["UNIFORM_METRICS"] = "UNIFORM_METRICS";
    // Behavioral-Level (MEDIUM)
    SignalType["NO_RESULT_IMPROVEMENT"] = "NO_RESULT_IMPROVEMENT";
    SignalType["EXCESSIVE_RETESTS"] = "EXCESSIVE_RETESTS";
    // Rule-Violation (HIGH)
    SignalType["NO_PRODUCTION_ACTIVITY"] = "NO_PRODUCTION_ACTIVITY";
    SignalType["ROLE_METRIC_MISMATCH"] = "ROLE_METRIC_MISMATCH";
    SignalType["LIFECYCLE_VIOLATION"] = "LIFECYCLE_VIOLATION";
})(SignalType || (exports.SignalType = SignalType = {}));

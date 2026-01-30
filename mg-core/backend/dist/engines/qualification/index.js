"use strict";
/**
 * Qualification Engine Index - Phase 1.2
 *
 * Экспортирует все компоненты Qualification Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuleByName = exports.ALL_QUALIFICATION_RULES = exports.riskOfDowngradeRule = exports.eligibleForUpgradeRule = exports.recordQualificationProposal = exports.QualificationValidationError = exports.QualificationEngine = void 0;
// Engine
var qualification_engine_1 = require("./qualification-engine");
Object.defineProperty(exports, "QualificationEngine", { enumerable: true, get: function () { return qualification_engine_1.QualificationEngine; } });
Object.defineProperty(exports, "QualificationValidationError", { enumerable: true, get: function () { return qualification_engine_1.QualificationValidationError; } });
// Recorder
var qualification_recorder_1 = require("./qualification-recorder");
Object.defineProperty(exports, "recordQualificationProposal", { enumerable: true, get: function () { return qualification_recorder_1.recordQualificationProposal; } });
// Rules
var rules_1 = require("./rules");
Object.defineProperty(exports, "eligibleForUpgradeRule", { enumerable: true, get: function () { return rules_1.eligibleForUpgradeRule; } });
Object.defineProperty(exports, "riskOfDowngradeRule", { enumerable: true, get: function () { return rules_1.riskOfDowngradeRule; } });
Object.defineProperty(exports, "ALL_QUALIFICATION_RULES", { enumerable: true, get: function () { return rules_1.ALL_QUALIFICATION_RULES; } });
Object.defineProperty(exports, "getRuleByName", { enumerable: true, get: function () { return rules_1.getRuleByName; } });

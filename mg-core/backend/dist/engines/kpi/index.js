"use strict";
/**
 * KPI Engine Index - Phase 1.1
 *
 * Экспортирует все компоненты KPI Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formulaRegistry = exports.ALL_FORMULAS = exports.npsAverageFormula = exports.revenueFormula = exports.sessionsCountFormula = exports.recordMultipleKPIResults = exports.recordKPIResult = exports.KPIValidationError = exports.KPIEngine = void 0;
// Engine
var kpi_engine_1 = require("./kpi-engine");
Object.defineProperty(exports, "KPIEngine", { enumerable: true, get: function () { return kpi_engine_1.KPIEngine; } });
Object.defineProperty(exports, "KPIValidationError", { enumerable: true, get: function () { return kpi_engine_1.KPIValidationError; } });
// Recorder
var kpi_recorder_1 = require("./kpi-recorder");
Object.defineProperty(exports, "recordKPIResult", { enumerable: true, get: function () { return kpi_recorder_1.recordKPIResult; } });
Object.defineProperty(exports, "recordMultipleKPIResults", { enumerable: true, get: function () { return kpi_recorder_1.recordMultipleKPIResults; } });
// Formulas
var formulas_1 = require("./formulas");
Object.defineProperty(exports, "sessionsCountFormula", { enumerable: true, get: function () { return formulas_1.sessionsCountFormula; } });
Object.defineProperty(exports, "revenueFormula", { enumerable: true, get: function () { return formulas_1.revenueFormula; } });
Object.defineProperty(exports, "npsAverageFormula", { enumerable: true, get: function () { return formulas_1.npsAverageFormula; } });
Object.defineProperty(exports, "ALL_FORMULAS", { enumerable: true, get: function () { return formulas_1.ALL_FORMULAS; } });
Object.defineProperty(exports, "formulaRegistry", { enumerable: true, get: function () { return formulas_1.formulaRegistry; } });

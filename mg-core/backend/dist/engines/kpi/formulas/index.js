"use strict";
/**
 * KPI Formulas Index - Phase 1.1
 *
 * Экспортирует все KPI формулы и реестр.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formulaRegistry = exports.ALL_FORMULAS = exports.npsAverageFormula = exports.revenueFormula = exports.sessionsCountFormula = void 0;
// Импорт формул
const sessions_formula_1 = require("./sessions.formula");
const revenue_formula_1 = require("./revenue.formula");
const nps_formula_1 = require("./nps.formula");
// =============================================================================
// FORMULA EXPORTS
// =============================================================================
var sessions_formula_2 = require("./sessions.formula");
Object.defineProperty(exports, "sessionsCountFormula", { enumerable: true, get: function () { return sessions_formula_2.sessionsCountFormula; } });
var revenue_formula_2 = require("./revenue.formula");
Object.defineProperty(exports, "revenueFormula", { enumerable: true, get: function () { return revenue_formula_2.revenueFormula; } });
var nps_formula_2 = require("./nps.formula");
Object.defineProperty(exports, "npsAverageFormula", { enumerable: true, get: function () { return nps_formula_2.npsAverageFormula; } });
// =============================================================================
// ALL FORMULAS
// =============================================================================
/**
 * Все зарегистрированные формулы
 */
exports.ALL_FORMULAS = [
    sessions_formula_1.sessionsCountFormula,
    revenue_formula_1.revenueFormula,
    nps_formula_1.npsAverageFormula,
];
// =============================================================================
// FORMULA REGISTRY
// =============================================================================
/**
 * Реестр формул KPI
 *
 * Предоставляет lookup по имени и типу события.
 */
exports.formulaRegistry = {
    formulas: exports.ALL_FORMULAS,
    /**
     * Получить формулу по имени
     */
    getByName: (name) => {
        return exports.ALL_FORMULAS.find(f => f.name === name);
    },
    /**
     * Получить формулы, связанные с типом события
     */
    getByEventType: (eventType) => {
        return exports.ALL_FORMULAS.filter(f => f.source_events.includes(eventType));
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolValidator = void 0;
class ProtocolValidator {
    validateTrial(trial, protocol) {
        var _a;
        const deviations = [];
        const requiredVariables = ((_a = protocol.variables) === null || _a === void 0 ? void 0 : _a.required) || [];
        const measuredVariables = new Set(trial.measurements.map((m) => m.variable));
        for (const variable of requiredVariables) {
            if (!measuredVariables.has(variable)) {
                deviations.push(`Missing mandatory measurement: ${variable}`);
            }
        }
        if (trial.deviations) {
            deviations.push(`Manual deviation recorded: ${trial.deviations}`);
        }
        return {
            isValid: deviations.length === 0,
            deviations
        };
    }
}
exports.ProtocolValidator = ProtocolValidator;
//# sourceMappingURL=ProtocolValidator.js.map
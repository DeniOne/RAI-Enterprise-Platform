"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalService = void 0;
class StatisticalService {
    calculateSummary(variable, measurements) {
        const values = measurements
            .filter((m) => m.variable === variable)
            .map((m) => m.value)
            .sort((a, b) => a - b);
        if (values.length === 0) {
            return { variable, mean: 0, median: 0, stdDev: 0, count: 0 };
        }
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const median = values.length % 2 === 0
            ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
            : values[Math.floor(values.length / 2)];
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return {
            variable,
            mean,
            median,
            stdDev,
            count: values.length
        };
    }
}
exports.StatisticalService = StatisticalService;
//# sourceMappingURL=StatisticalService.js.map
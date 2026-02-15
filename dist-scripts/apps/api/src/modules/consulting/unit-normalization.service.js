"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitNormalizationService = void 0;
const common_1 = require("@nestjs/common");
@(0, common_1.Injectable)()
class UnitNormalizationService {
    // Canonical Base Units:
    // Mass -> kg
    // Area -> ha (Agriculture standard)
    // Volume -> l
    // Count -> unit
    MASS_TO_KG = {
        kg: 1,
        ton: 1000,
        g: 0.001,
        c: 100,
        mg: 0.000001,
    };
    AREA_TO_HA = {
        ha: 1,
        m2: 0.0001,
        km2: 100,
    };
    VOLUME_TO_L = {
        l: 1,
        ml: 0.001,
        m3: 1000,
    };
    /**
     * Converts a value from a source unit to its canonical base unit.
     * Throws error if unit is unknown or incompatible.
     */
    normalize(value, unit) {
        const u = unit.toLowerCase();
        if (this.isMass(u)) {
            return { value: value * this.MASS_TO_KG[u], unit: 'kg' };
        }
        if (this.isArea(u)) {
            return { value: value * this.AREA_TO_HA[u], unit: 'ha' };
        }
        if (this.isVolume(u)) {
            return { value: value * this.VOLUME_TO_L[u], unit: 'l' };
        }
        // Count units are treated as base 1-to-1 if they match, or generic 'unit'
        if (this.isCount(u)) {
            return { value: value, unit: 'unit' };
        }
        throw new Error(`Unsupported or unknown unit: ${unit}`);
    }
    isMass(unit) {
        return unit in this.MASS_TO_KG;
    }
    isArea(unit) {
        return unit in this.AREA_TO_HA;
    }
    isVolume(unit) {
        return unit in this.VOLUME_TO_L;
    }
    isCount(unit) {
        return ['unit', 'pack', 'dose'].includes(unit);
    }
}
exports.UnitNormalizationService = UnitNormalizationService;

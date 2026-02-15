
import { Injectable } from '@nestjs/common';

export type MassUnit = 'kg' | 'ton' | 'g' | 'c' | 'mg'; // c = centner (100kg)
export type AreaUnit = 'ha' | 'm2' | 'km2';
export type VolumeUnit = 'l' | 'ml' | 'm3';
export type CountUnit = 'unit' | 'pack' | 'dose';

export type SupportedUnit = MassUnit | AreaUnit | VolumeUnit | CountUnit;

@Injectable()
export class UnitNormalizationService {

    // Canonical Base Units:
    // Mass -> kg
    // Area -> ha (Agriculture standard)
    // Volume -> l
    // Count -> unit

    private readonly MASS_TO_KG: Record<MassUnit, number> = {
        kg: 1,
        ton: 1000,
        g: 0.001,
        c: 100,
        mg: 0.000001,
    };

    private readonly AREA_TO_HA: Record<AreaUnit, number> = {
        ha: 1,
        m2: 0.0001,
        km2: 100,
    };

    private readonly VOLUME_TO_L: Record<VolumeUnit, number> = {
        l: 1,
        ml: 0.001,
        m3: 1000,
    };

    /**
     * Converts a value from a source unit to its canonical base unit.
     * Throws error if unit is unknown or incompatible.
     */
    normalize(value: number, unit: string): { value: number; unit: string } {
        const u = unit.toLowerCase();

        if (this.isMass(u)) {
            return { value: value * this.MASS_TO_KG[u as MassUnit], unit: 'kg' };
        }
        if (this.isArea(u)) {
            return { value: value * this.AREA_TO_HA[u as AreaUnit], unit: 'ha' };
        }
        if (this.isVolume(u)) {
            return { value: value * this.VOLUME_TO_L[u as VolumeUnit], unit: 'l' };
        }
        // Count units are treated as base 1-to-1 if they match, or generic 'unit'
        if (this.isCount(u)) {
            return { value: value, unit: 'unit' };
        }

        throw new Error(`Unsupported or unknown unit: ${unit}`);
    }

    private isMass(unit: string): boolean {
        return unit in this.MASS_TO_KG;
    }

    private isArea(unit: string): boolean {
        return unit in this.AREA_TO_HA;
    }

    private isVolume(unit: string): boolean {
        return unit in this.VOLUME_TO_L;
    }

    private isCount(unit: string): boolean {
        return ['unit', 'pack', 'dose'].includes(unit);
    }
}

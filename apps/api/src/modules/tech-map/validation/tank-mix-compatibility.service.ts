import { Injectable } from "@nestjs/common";

// ──────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────

export interface InputCatalogItem {
    id: string;
    name: string;
    incompatibleWith: string[] | null;
}

export interface CompatibilityResult {
    status: "COMPATIBLE" | "CAUTION" | "INCOMPATIBLE";
    /** Пары несовместимых id */
    conflictingPairs: Array<[string, string]>;
    message: string;
}

// ──────────────────────────────────────────────
// Сервис
// ──────────────────────────────────────────────

@Injectable()
export class TankMixCompatibilityService {
    /**
     * Принимает список препаратов из одного tank_mix_group_id.
     * Выполняет O(n²) попарную проверку по полю incompatibleWith.
     */
    checkCompatibility(inputs: InputCatalogItem[]): CompatibilityResult {
        if (inputs.length === 0) {
            return {
                status: "COMPATIBLE",
                conflictingPairs: [],
                message: "Список препаратов пуст — конфликтов нет",
            };
        }

        const conflictingPairs: Array<[string, string]> = [];

        for (let i = 0; i < inputs.length; i++) {
            for (let j = i + 1; j < inputs.length; j++) {
                const a = inputs[i];
                const b = inputs[j];

                const aIncompatibleWithB =
                    a.incompatibleWith?.includes(b.id) ?? false;
                const bIncompatibleWithA =
                    b.incompatibleWith?.includes(a.id) ?? false;

                if (aIncompatibleWithB || bIncompatibleWithA) {
                    conflictingPairs.push([a.id, b.id]);
                }
            }
        }

        if (conflictingPairs.length > 0) {
            const pairsStr = conflictingPairs
                .map(([x, y]) => `${x}+${y}`)
                .join(", ");
            return {
                status: "INCOMPATIBLE",
                conflictingPairs,
                message: `Обнаружены несовместимые пары препаратов: ${pairsStr}`,
            };
        }

        return {
            status: "COMPATIBLE",
            conflictingPairs: [],
            message: `Все ${inputs.length} препаратов совместимы в баковой смеси`,
        };
    }
}

import { Injectable } from "@nestjs/common";
import {
    DAGValidationService,
    OperationNode,
    ResourceCapacity,
} from "./dag-validation.service";
import {
    TankMixCompatibilityService,
    InputCatalogItem,
} from "./tank-mix-compatibility.service";

// ──────────────────────────────────────────────
// Типы входных данных
// ──────────────────────────────────────────────

export type ValidationSeverity = "HARD_STOP" | "CRITICAL_WARNING" | "WARNING";

export interface ValidationError {
    code: string;
    operationId?: string;
    resourceId?: string;
    message: string;
    severity: ValidationSeverity;
}

export interface ValidationReport {
    hardStops: ValidationError[];
    criticalWarnings: ValidationError[];
    warnings: ValidationError[];
    /** true если есть хотя бы 1 HARD_STOP */
    isBlockedForProduction: boolean;
}

export interface OperationResource {
    id: string;
    plannedRate: number | null;
    maxRate: number | null;
    inputCatalogId: string | null;
    tankMixGroupId: string | null;
    inputCatalog?: InputCatalogItem | null;
}

export interface OperationWithResources {
    id: string;
    operationType: string | null;
    bbchWindowFrom: number | null;
    bbchWindowTo: number | null;
    isCritical: boolean;
    actualStartDate: Date | null;
    plannedStartDate: Date | null;
    plannedDurationHours: number;
    dependencies: Array<{
        opId: string;
        type: "FS" | "SS" | "FF";
        lagMinDays: number;
        lagMaxDays: number;
    }>;
    resources: OperationResource[];
}

export interface ValidationInput {
    operations: OperationWithResources[];
    field: { protectedZoneFlags: string[] | null };
    cropZone: { targetYieldTHa: number };
    /** Текущий BBCH-индекс поля (если известен) */
    currentBBCH?: number | null;
}

// ──────────────────────────────────────────────
// Engine
// ──────────────────────────────────────────────

@Injectable()
export class TechMapValidationEngine {
    constructor(
        private readonly tankMix: TankMixCompatibilityService,
        private readonly dag: DAGValidationService,
    ) { }

    validate(input: ValidationInput): ValidationReport {
        const errors: ValidationError[] = [];

        // Правило 1: Несовместимые СЗР в одной баковой смеси
        this._rule1_tankMixCompatibility(input.operations, errors);

        // Правило 2: planned_rate > max_rate
        this._rule2_rateExceedsMax(input.operations, errors);

        // Правило 3: Операция вне BBCH-окна
        this._rule3_bbchWindow(input.operations, errors, input.currentBBCH);

        // Правило 4: Критическая операция пропущена
        this._rule4_criticalOpMissed(input.operations, errors);

        // Правило 5: СЗР в водоохранной/буферной зоне
        this._rule5_regulatoryZone(input.operations, input.field, errors);

        // Правило 6: Ресурсный конфликт
        this._rule6_resourceConflict(input.operations, errors);

        // Правило 7: Превышение дозы д.в./га
        this._rule7_activeSubstanceOverdose(input.operations, errors);

        const hardStops = errors.filter((e) => e.severity === "HARD_STOP");
        const criticalWarnings = errors.filter(
            (e) => e.severity === "CRITICAL_WARNING",
        );
        const warnings = errors.filter((e) => e.severity === "WARNING");

        return {
            hardStops,
            criticalWarnings,
            warnings,
            isBlockedForProduction: hardStops.length > 0,
        };
    }

    // ──────────────────────────────────────────────
    // Правило 1: Несовместимые баковые смеси
    // ──────────────────────────────────────────────
    private _rule1_tankMixCompatibility(
        operations: OperationWithResources[],
        errors: ValidationError[],
    ): void {
        // Собираем ресурсы по группам (tankMixGroupId)
        const groups = new Map<string, { item: InputCatalogItem; opId: string }[]>();

        for (const op of operations) {
            for (const res of op.resources) {
                if (!res.tankMixGroupId || !res.inputCatalog) continue;

                if (!groups.has(res.tankMixGroupId)) {
                    groups.set(res.tankMixGroupId, []);
                }
                groups.get(res.tankMixGroupId)!.push({
                    item: res.inputCatalog,
                    opId: op.id,
                });
            }
        }

        for (const [groupId, entries] of groups) {
            const items = entries.map((e) => e.item);
            const result = this.tankMix.checkCompatibility(items);

            if (result.status === "INCOMPATIBLE") {
                errors.push({
                    code: "INCOMPATIBLE_TANK_MIX",
                    operationId: entries[0]?.opId,
                    message: `Баковая смесь ${groupId}: ${result.message}`,
                    severity: "HARD_STOP",
                });
            }
        }
    }

    // ──────────────────────────────────────────────
    // Правило 2: planned_rate > max_rate
    // ──────────────────────────────────────────────
    private _rule2_rateExceedsMax(
        operations: OperationWithResources[],
        errors: ValidationError[],
    ): void {
        for (const op of operations) {
            for (const res of op.resources) {
                if (
                    res.plannedRate !== null &&
                    res.maxRate !== null &&
                    res.plannedRate > res.maxRate
                ) {
                    errors.push({
                        code: "RATE_EXCEEDS_MAX",
                        operationId: op.id,
                        resourceId: res.id,
                        message: `Ресурс ${res.id}: планируемая норма ${res.plannedRate} превышает максимальную ${res.maxRate}`,
                        severity: "HARD_STOP",
                    });
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // Правило 3: Операция вне BBCH-окна
    // ──────────────────────────────────────────────
    private _rule3_bbchWindow(
        operations: OperationWithResources[],
        errors: ValidationError[],
        currentBBCH?: number | null,
    ): void {
        if (currentBBCH == null) return;

        for (const op of operations) {
            if (op.bbchWindowFrom === null || op.bbchWindowTo === null) continue;

            if (currentBBCH < op.bbchWindowFrom || currentBBCH > op.bbchWindowTo) {
                errors.push({
                    code: "BBCH_WINDOW_VIOLATION",
                    operationId: op.id,
                    message: `Операция ${op.id}: текущий BBCH ${currentBBCH} вне окна [${op.bbchWindowFrom}–${op.bbchWindowTo}]`,
                    severity: "HARD_STOP",
                });
            }
        }
    }

    // ──────────────────────────────────────────────
    // Правило 4: Критическая операция пропущена (окно истекло)
    // ──────────────────────────────────────────────
    private _rule4_criticalOpMissed(
        operations: OperationWithResources[],
        errors: ValidationError[],
    ): void {
        const now = new Date();

        for (const op of operations) {
            if (!op.isCritical) continue;
            if (op.actualStartDate) continue; // уже выполнена

            // Окно истекло если plannedStartDate + duration уже в прошлом
            if (!op.plannedStartDate) continue;
            const plannedEnd = new Date(
                op.plannedStartDate.getTime() +
                op.plannedDurationHours * 60 * 60 * 1000,
            );

            if (plannedEnd < now) {
                errors.push({
                    code: "CRITICAL_OP_MISSED",
                    operationId: op.id,
                    message: `Критическая операция ${op.id} не выполнена: плановое окно истекло ${plannedEnd.toISOString().slice(0, 10)}`,
                    severity: "CRITICAL_WARNING",
                });
            }
        }
    }

    // ──────────────────────────────────────────────
    // Правило 5: СЗР в водоохранной/буферной зоне
    // ──────────────────────────────────────────────
    private _rule5_regulatoryZone(
        operations: OperationWithResources[],
        field: { protectedZoneFlags: string[] | null },
        errors: ValidationError[],
    ): void {
        const flags = field.protectedZoneFlags ?? [];
        if (!flags.includes("WATER_PROTECTION")) return;

        for (const op of operations) {
            if (op.operationType === "PESTICIDE_APP") {
                errors.push({
                    code: "REGULATORY_ZONE_VIOLATION",
                    operationId: op.id,
                    message: `Операция ${op.id} типа PESTICIDE_APP запрещена в водоохранной зоне`,
                    severity: "HARD_STOP",
                });
            }
        }
    }

    // ──────────────────────────────────────────────
    // Правило 6: Ресурсный конфликт
    // ──────────────────────────────────────────────
    private _rule6_resourceConflict(
        operations: OperationWithResources[],
        errors: ValidationError[],
    ): void {
        const nodes: OperationNode[] = operations.map((op) => ({
            id: op.id,
            plannedDurationHours: op.plannedDurationHours,
            isCritical: op.isCritical,
            dependencies: op.dependencies,
        }));

        const capacity: ResourceCapacity = {}; // упрощённая модель — без конкретной техники
        const conflicts = this.dag.detectResourceConflicts(nodes, capacity);

        for (const conflict of conflicts) {
            errors.push({
                code: "RESOURCE_CONFLICT",
                operationId: conflict.operationIds[0],
                message: conflict.description,
                severity: "WARNING",
            });
        }
    }

    // ──────────────────────────────────────────────
    // Правило 7: Превышение суммарной дозы д.в./га
    // ──────────────────────────────────────────────
    private _rule7_activeSubstanceOverdose(
        operations: OperationWithResources[],
        errors: ValidationError[],
    ): void {
        // Группируем ресурсы по active substance (из inputCatalog)
        const substanceDoses = new Map<
            string,
            { total: number; maxAllowed: number; opId: string; resId: string }
        >();

        for (const op of operations) {
            for (const res of op.resources) {
                if (!res.inputCatalog || res.plannedRate === null) continue;

                // Ожидаем activeSubstances в формате Array<{name: string; maxKgHa: number}>
                const catalog = res.inputCatalog as any;
                const substances: Array<{ name: string; maxKgHa?: number }> =
                    catalog.activeSubstances ?? [];

                for (const substance of substances) {
                    if (!substance.maxKgHa) continue;

                    const key = substance.name;
                    const existing = substanceDoses.get(key) ?? {
                        total: 0,
                        maxAllowed: substance.maxKgHa,
                        opId: op.id,
                        resId: res.id,
                    };
                    existing.total += res.plannedRate;
                    substanceDoses.set(key, existing);
                }
            }
        }

        for (const [substance, { total, maxAllowed, opId, resId }] of substanceDoses) {
            if (total > maxAllowed) {
                errors.push({
                    code: "ACTIVE_SUBSTANCE_OVERDOSE",
                    operationId: opId,
                    resourceId: resId,
                    message: `Действующее вещество "${substance}": суммарная доза ${total} кг/га превышает максимальную ${maxAllowed} кг/га`,
                    severity: "HARD_STOP",
                });
            }
        }
    }
}

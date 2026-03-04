import { Injectable } from "@nestjs/common";

// ──────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────

export type DependencyType = "FS" | "SS" | "FF";

export interface OperationDependency {
    opId: string;
    type: DependencyType;
    lagMinDays: number;
    lagMaxDays: number;
}

export interface OperationNode {
    id: string;
    plannedDurationHours: number;
    isCritical: boolean;
    dependencies: OperationDependency[];
}

export interface ValidationResult {
    valid: boolean;
    cycles: string[][];
}

export interface CriticalPathResult {
    criticalPath: string[];
    totalDurationDays: number;
    /** Float (резерв времени) для каждой операции в днях */
    floats: Record<string, number>;
}

export interface ResourceCapacity {
    /** Ключ — тип ресурса/ID техники; значение — количество единиц */
    [resourceType: string]: number;
}

export interface ResourceConflict {
    operationIds: [string, string];
    conflictType: "MACHINERY" | "LABOR";
    description: string;
}

// ──────────────────────────────────────────────
// Вспомогательные типы CPM
// ──────────────────────────────────────────────

type Color = "WHITE" | "GRAY" | "BLACK";

interface CPMNode {
    id: string;
    durationDays: number;
    /** ES = Early Start (дни) */
    es: number;
    /** EF = Early Finish (дни) */
    ef: number;
    /** LS = Late Start (дни) */
    ls: number;
    /** LF = Late Finish (дни) */
    lf: number;
    predecessors: { nodeId: string; type: DependencyType; lagDays: number }[];
    successors: string[];
}

// ──────────────────────────────────────────────
// Сервис
// ──────────────────────────────────────────────

@Injectable()
export class DAGValidationService {
    // ────────────────────────────────────────────
    // 1. Обнаружение циклов (DFS с маркировкой цветов)
    // ────────────────────────────────────────────

    validateAcyclicity(operations: OperationNode[]): ValidationResult {
        const color: Record<string, Color> = {};
        const cycles: string[][] = [];

        for (const op of operations) {
            color[op.id] = "WHITE";
        }

        const adjMap = this._buildAdjacencyMap(operations);

        const dfs = (nodeId: string, path: string[]): void => {
            color[nodeId] = "GRAY";
            path.push(nodeId);

            for (const neighbourId of adjMap[nodeId] ?? []) {
                if (color[neighbourId] === "GRAY") {
                    // Нашли цикл — записываем путь от neighbourId до конца
                    const cycleStart = path.indexOf(neighbourId);
                    cycles.push(path.slice(cycleStart));
                } else if (color[neighbourId] === "WHITE") {
                    dfs(neighbourId, path);
                }
            }

            path.pop();
            color[nodeId] = "BLACK";
        };

        for (const op of operations) {
            if (color[op.id] === "WHITE") {
                dfs(op.id, []);
            }
        }

        return { valid: cycles.length === 0, cycles };
    }

    // ────────────────────────────────────────────
    // 2. Критический путь (CPM)
    // ────────────────────────────────────────────

    calculateCriticalPath(operations: OperationNode[]): CriticalPathResult {
        if (operations.length === 0) {
            return { criticalPath: [], totalDurationDays: 0, floats: {} };
        }

        const HOURS_PER_DAY = 8;

        // Строим CPM-узлы
        const nodes: Record<string, CPMNode> = {};
        for (const op of operations) {
            nodes[op.id] = {
                id: op.id,
                durationDays: op.plannedDurationHours / HOURS_PER_DAY,
                es: 0,
                ef: 0,
                ls: Infinity,
                lf: Infinity,
                predecessors: op.dependencies.map((d) => ({
                    nodeId: d.opId,
                    type: d.type,
                    lagDays: d.lagMinDays,
                })),
                successors: [],
            };
        }

        // Обратная связь: кто является преемником
        for (const op of operations) {
            for (const dep of op.dependencies) {
                if (nodes[dep.opId]) {
                    nodes[dep.opId].successors.push(op.id);
                }
            }
        }

        // Топологическая сортировка через DFS
        const sorted = this._topologicalSort(operations);

        // Прямой проход (ES / EF)
        for (const nodeId of sorted) {
            const node = nodes[nodeId];
            let maxES = 0;

            for (const pred of node.predecessors) {
                const p = nodes[pred.nodeId];
                if (!p) continue;

                let candidateES: number;
                switch (pred.type) {
                    case "FS":
                        candidateES = p.ef + pred.lagDays;
                        break;
                    case "SS":
                        candidateES = p.es + pred.lagDays;
                        break;
                    case "FF":
                        // FF: finish B == finish A + lag → ES_B = EF_A + lag - duration_B
                        candidateES = p.ef + pred.lagDays - node.durationDays;
                        break;
                    default:
                        candidateES = p.ef;
                }
                maxES = Math.max(maxES, candidateES);
            }

            node.es = Math.max(0, maxES);
            node.ef = node.es + node.durationDays;
        }

        const projectDuration = Math.max(...Object.values(nodes).map((n) => n.ef));

        // Обратный проход (LS / LF)
        for (const nodeId of [...sorted].reverse()) {
            const node = nodes[nodeId];

            if (node.successors.length === 0) {
                // Конечные узлы
                node.lf = projectDuration;
                node.ls = node.lf - node.durationDays;
            } else {
                let minLF = Infinity;
                for (const succId of node.successors) {
                    const succ = nodes[succId];
                    const pred = succ.predecessors.find((p) => p.nodeId === nodeId);
                    if (!pred) continue;

                    let candidateLF: number;
                    switch (pred.type) {
                        case "FS":
                            candidateLF = succ.ls - pred.lagDays;
                            break;
                        case "SS":
                            candidateLF = succ.ls - pred.lagDays + node.durationDays;
                            break;
                        case "FF":
                            candidateLF = succ.lf - pred.lagDays;
                            break;
                        default:
                            candidateLF = succ.ls;
                    }
                    minLF = Math.min(minLF, candidateLF);
                }
                node.lf = minLF;
                node.ls = node.lf - node.durationDays;
            }
        }

        // Float = LS - ES
        const floats: Record<string, number> = {};
        const criticalPath: string[] = [];

        for (const [id, node] of Object.entries(nodes)) {
            const float = Math.round((node.ls - node.es) * 1000) / 1000;
            floats[id] = float;
            if (Math.abs(float) < 0.001) {
                criticalPath.push(id);
            }
        }

        // Сортируем критический путь в топологическом порядке
        const sortedCritical = sorted.filter((id) => criticalPath.includes(id));

        return {
            criticalPath: sortedCritical,
            totalDurationDays: Math.round(projectDuration * 100) / 100,
            floats,
        };
    }

    // ────────────────────────────────────────────
    // 3. Обнаружение ресурсных конфликтов
    // ────────────────────────────────────────────

    detectResourceConflicts(
        operations: OperationNode[],
        _availableCapacity: ResourceCapacity,
    ): ResourceConflict[] {
        const conflicts: ResourceConflict[] = [];
        const HOURS_PER_DAY = 8;

        // Рассчитываем временные окна на основе CPM
        const cpResult = this.calculateCriticalPath(operations);
        const nodeMap: Record<string, OperationNode> = {};
        for (const op of operations) {
            nodeMap[op.id] = op;
        }

        // Упрощённая модель: если два критических узла пересекаются по времени — конфликт
        const windows: { id: string; start: number; end: number }[] = [];

        let cursor = 0;
        for (const op of operations) {
            const durationDays = op.plannedDurationHours / HOURS_PER_DAY;
            windows.push({ id: op.id, start: cursor, end: cursor + durationDays });
            // Сдвигаем только для узлов в критическом пути (по-упрощённому)
            if (cpResult.criticalPath.includes(op.id)) {
                cursor += durationDays;
            }
        }

        // Пары с пересечением временных окон — потенциальный ресурсный конфликт
        for (let i = 0; i < windows.length; i++) {
            for (let j = i + 1; j < windows.length; j++) {
                const a = windows[i];
                const b = windows[j];
                // Пересечение: a.start < b.end && b.start < a.end
                if (a.start < b.end && b.start < a.end) {
                    // Не один из них зависит от другого (тогда пересечение ожидаемо)
                    const opA = nodeMap[a.id];
                    const depIds = opA.dependencies.map((d) => d.opId);
                    if (!depIds.includes(b.id)) {
                        conflicts.push({
                            operationIds: [a.id, b.id],
                            conflictType: "MACHINERY",
                            description: `Операции ${a.id} и ${b.id} перекрываются по времени (${a.start.toFixed(1)}..${a.end.toFixed(1)} vs ${b.start.toFixed(1)}..${b.end.toFixed(1)} дней)`,
                        });
                    }
                }
            }
        }

        return conflicts;
    }

    // ────────────────────────────────────────────
    // Вспомогательные методы
    // ────────────────────────────────────────────

    private _buildAdjacencyMap(
        operations: OperationNode[],
    ): Record<string, string[]> {
        const adj: Record<string, string[]> = {};
        for (const op of operations) {
            if (!adj[op.id]) adj[op.id] = [];
            for (const dep of op.dependencies) {
                // dep.opId → op.id (прямые рёбра)
                if (!adj[dep.opId]) adj[dep.opId] = [];
                adj[dep.opId].push(op.id);
            }
        }
        return adj;
    }

    private _topologicalSort(operations: OperationNode[]): string[] {
        const color: Record<string, Color> = {};
        const result: string[] = [];

        for (const op of operations) {
            color[op.id] = "WHITE";
        }

        const adj = this._buildAdjacencyMap(operations);

        const dfs = (nodeId: string): void => {
            color[nodeId] = "GRAY";
            for (const neighbourId of adj[nodeId] ?? []) {
                if (color[neighbourId] === "WHITE") {
                    dfs(neighbourId);
                }
            }
            color[nodeId] = "BLACK";
            result.unshift(nodeId);
        };

        for (const op of operations) {
            if (color[op.id] === "WHITE") {
                dfs(op.id);
            }
        }

        return result;
    }
}

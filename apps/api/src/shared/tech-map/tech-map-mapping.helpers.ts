import type {
  OperationWithResources,
  ValidationInput,
} from "../../modules/tech-map/validation/techmap-validation.engine";
import type {
  OperationDependency,
  OperationNode,
} from "../../modules/tech-map/validation/dag-validation.service";

function extractDependencies(raw: unknown): OperationDependency[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as OperationDependency[];
}

export function buildValidationInputFromTechMap(
  map: any,
  currentBBCH?: number | null,
): ValidationInput {
  const operations: OperationWithResources[] = map.stages.flatMap((stage: any) =>
    stage.operations.map((op: any) => ({
      id: op.id,
      operationType: op.operationType ?? null,
      bbchWindowFrom: op.bbchWindowFrom ?? null,
      bbchWindowTo: op.bbchWindowTo ?? null,
      isCritical: op.isCritical ?? false,
      actualStartDate: op.actualStartDate ?? null,
      plannedStartDate: op.plannedStartDate ?? null,
      plannedDurationHours: op.plannedDurationHours ?? 8,
      dependencies: extractDependencies(op.dependencies),
      resources: op.resources.map((res: any) => ({
        id: res.id,
        plannedRate: res.plannedRate ?? null,
        maxRate: res.maxRate ?? null,
        inputCatalogId: res.inputCatalogId ?? null,
        tankMixGroupId: res.tankMixGroupId ?? null,
        inputCatalog: res.inputCatalog ?? null,
      })),
    })),
  );

  return {
    operations,
    field: {
      protectedZoneFlags: map.field?.protectedZoneFlags ?? null,
    },
    cropZone: {
      targetYieldTHa: map.cropZone?.targetYieldTHa ?? 0,
    },
    currentBBCH,
  };
}

export function buildDagNodesFromTechMap(map: any): OperationNode[] {
  return map.stages.flatMap((stage: any) =>
    stage.operations.map((op: any) => ({
      id: op.id,
      plannedDurationHours: op.plannedDurationHours ?? 8,
      isCritical: op.isCritical ?? false,
      dependencies: extractDependencies(op.dependencies),
    })),
  );
}

export function buildOperationsSnapshot(map: any) {
  return map.stages.map((stage: any) => ({
    stage: stage.name,
    ops: stage.operations.map((operation: any) => ({
      id: operation.id,
      name: operation.name,
      machinery: operation.requiredMachineryType,
    })),
  }));
}

export function buildResourceNormsSnapshot(
  map: any,
  normalize: (value: number, unit: string) => { value: number; unit: string },
) {
  return map.stages.flatMap((stage: any) =>
    stage.operations.flatMap((operation: any) =>
      operation.resources.map((resource: any) => ({
        resourceId: resource.id,
        name: resource.name,
        originalAmount: resource.amount,
        originalUnit: resource.unit,
        normalized: normalize(resource.amount, resource.unit),
      })),
    ),
  );
}

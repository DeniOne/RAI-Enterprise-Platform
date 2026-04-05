import type {
  CompositeWorkflowStageContract,
} from "./composite-orchestration.types";

export interface CompositeStagePayloadArtifact {
  structuredOutput?: Record<string, unknown>;
}

export interface ResolveCompositeStagePayloadResult {
  ok: boolean;
  payload: Record<string, unknown>;
  missingRequiredBindings: string[];
}

export function resolveCompositeStagePayload(params: {
  stage: CompositeWorkflowStageContract;
  artifactsByStageId: Map<string, CompositeStagePayloadArtifact>;
}): ResolveCompositeStagePayloadResult {
  const payload = cloneRecord(params.stage.payload);
  const missingRequiredBindings: string[] = [];

  for (const binding of params.stage.payloadBindings ?? []) {
    const source = params.artifactsByStageId.get(binding.sourceStageId);
    const value = getByPath(source?.structuredOutput, binding.sourcePath);
    if (value === undefined) {
      if (binding.required !== false) {
        missingRequiredBindings.push(
          `${binding.sourceStageId}:${binding.sourcePath}->${binding.targetPath}`,
        );
      }
      continue;
    }
    applyBindingValue({
      payload,
      targetPath: binding.targetPath,
      value,
      writeMode: binding.writeMode ?? "overwrite",
    });
  }

  return {
    ok: missingRequiredBindings.length === 0,
    payload,
    missingRequiredBindings,
  };
}

function applyBindingValue(params: {
  payload: Record<string, unknown>;
  targetPath: string;
  value: unknown;
  writeMode: "overwrite" | "set_if_absent";
}): void {
  const segments = params.targetPath
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return;
  }

  let cursor: Record<string, unknown> = params.payload;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i];
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }

  const leafKey = segments[segments.length - 1];
  if (
    params.writeMode === "set_if_absent" &&
    cursor[leafKey] !== undefined &&
    cursor[leafKey] !== null
  ) {
    return;
  }
  cursor[leafKey] = cloneValue(params.value);
}

function getByPath(
  payload: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!payload) {
    return undefined;
  }
  const segments = path
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
  let current: unknown = payload;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function cloneRecord(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!payload) {
    return {};
  }
  return cloneValue(payload) as Record<string, unknown>;
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = cloneValue(inner);
    }
    return out;
  }
  return value;
}

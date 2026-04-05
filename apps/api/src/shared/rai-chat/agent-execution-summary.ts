import type {
  BranchResultContract,
  UserFacingBranchCompositionPayload,
} from "./branch-trust.types";

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function extractStructuredRuntimeSummary(
  output: Record<string, unknown> | null | undefined,
): string | null {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return null;
  }

  for (const value of [
    output.summary,
    output.explanation,
    output.recommendation,
    output.status,
  ]) {
    const summary = nonEmptyString(value);
    if (summary) {
      return summary;
    }
  }

  const data = output.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const summary = nonEmptyString(
      (data as Record<string, unknown>).summary,
    );
    if (summary) {
      return summary;
    }
  }

  return null;
}

export function resolveAgentExecutionSummary(input: {
  text?: string | null;
  structuredOutput?: Record<string, unknown> | null;
  structuredOutputs?: Array<Record<string, unknown>> | null;
  branchCompositions?: UserFacingBranchCompositionPayload[] | null;
  branchResults?: BranchResultContract[] | null;
  fallback?: string;
}): string {
  const explicitText = nonEmptyString(input.text);
  if (explicitText) {
    return explicitText;
  }

  const primaryStructured = extractStructuredRuntimeSummary(
    input.structuredOutput,
  );
  if (primaryStructured) {
    return primaryStructured;
  }

  for (const output of input.structuredOutputs ?? []) {
    const summary = extractStructuredRuntimeSummary(output);
    if (summary) {
      return summary;
    }
  }

  for (const composition of input.branchCompositions ?? []) {
    const summary = nonEmptyString(composition.summary);
    if (summary) {
      return summary;
    }
  }

  for (const branchResult of input.branchResults ?? []) {
    const summary = nonEmptyString(branchResult.summary);
    if (summary) {
      return summary;
    }
  }

  return input.fallback ?? "Результат подготовлен.";
}

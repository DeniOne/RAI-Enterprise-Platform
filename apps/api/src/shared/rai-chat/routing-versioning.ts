import { createHash } from "crypto";
import { WorkspaceContextDto } from "./rai-chat.dto";
import { RoutingVersionInfo } from "./semantic-routing.types";

export const SEMANTIC_ROUTER_VERSION = "semantic-router-v1";
export const SEMANTIC_ROUTER_PROMPT_VERSION = "semantic-router-prompt-v1";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([leftKey], [rightKey]) => leftKey.localeCompare(rightKey),
    );
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildToolsetVersion(toolIdentifiers: Iterable<string>): string {
  const normalized = [...new Set([...toolIdentifiers].filter(Boolean))]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .sort((left, right) => left.localeCompare(right));
  return hashString(normalized.join("|") || "empty");
}

export function buildWorkspaceStateDigest(
  workspaceContext?: WorkspaceContextDto,
): string {
  const normalized = {
    route: workspaceContext?.route ?? null,
    activeEntityRefs: (workspaceContext?.activeEntityRefs ?? []).map((item) => ({
      kind: item.kind,
      id: item.id,
    })),
    filters: workspaceContext?.filters ?? {},
    selectedRowSummary: workspaceContext?.selectedRowSummary
      ? {
          kind: workspaceContext.selectedRowSummary.kind,
          id: workspaceContext.selectedRowSummary.id,
          status: workspaceContext.selectedRowSummary.status ?? null,
        }
      : null,
    lastUserAction: workspaceContext?.lastUserAction ?? null,
  };
  return hashString(stableStringify(normalized));
}

export function buildRoutingVersionInfo(params: {
  toolIdentifiers: Iterable<string>;
  workspaceContext?: WorkspaceContextDto;
}): RoutingVersionInfo {
  return {
    routerVersion: SEMANTIC_ROUTER_VERSION,
    promptVersion: SEMANTIC_ROUTER_PROMPT_VERSION,
    toolsetVersion: buildToolsetVersion(params.toolIdentifiers),
    workspaceStateDigest: buildWorkspaceStateDigest(params.workspaceContext),
  };
}

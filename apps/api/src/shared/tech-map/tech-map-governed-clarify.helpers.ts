import {
  TECH_MAP_DEFAULT_CLARIFY_POLICY,
  type TechMapClarifyAuditEvent,
  type TechMapClarifyBatch,
  type TechMapWorkflowResumeState,
} from "./tech-map-governed-clarify.types";
import type { TechMapClarifyItem } from "./tech-map-governed-clarify.types";
import type { TechMapContextReadiness } from "./tech-map-governed-state.types";
import type { TechMapWorkflowPhase } from "./tech-map-governed-state.types";

export interface TechMapClarifyBatchBuildInput {
  workflow_id: string;
  draft_id: string;
  readiness: TechMapContextReadiness;
  next_readiness_target?: TechMapContextReadiness;
  clarify_items: TechMapClarifyItem[];
  blocking_phase?: TechMapWorkflowPhase;
  resolved_slot_keys?: string[];
  external_recheck_required?: boolean;
  baseline_context_hash?: string;
}

export interface TechMapClarifyAuditTrailInput {
  workflow_id: string;
  batch: TechMapClarifyBatch | null;
  resume_state: TechMapWorkflowResumeState | null;
  resolved_slot_keys?: string[];
  resume_requested?: boolean;
}

function resolveClarifyMode(
  items: TechMapClarifyItem[],
): "ONE_SHOT" | "MULTI_STEP" {
  if (
    items.some((item) => item.resolution_target === "HUMAN_REVIEW_REQUIRED") ||
    items.length > 3
  ) {
    return "MULTI_STEP";
  }

  return "ONE_SHOT";
}

function resolveClarifyStatus(
  items: TechMapClarifyItem[],
  resolvedSlotKeys: string[],
): TechMapClarifyBatch["status"] {
  if (items.length === 0) {
    return "RESOLVED";
  }

  if (resolvedSlotKeys.length > 0) {
    if (resolvedSlotKeys.length >= items.length) {
      return "RESOLVED";
    }
    return "PARTIALLY_RESOLVED";
  }

  return "OPEN";
}

function resolveBatchPriority(items: TechMapClarifyItem[]): number {
  const topPriority = items[0]?.priority ?? 0;
  const maxPriority = items.reduce(
    (max, item) => Math.max(max, item.priority),
    topPriority,
  );
  if (maxPriority >= 100) {
    return 100;
  }
  if (maxPriority >= 70) {
    return 70;
  }
  return 40;
}

function buildResumeToken(workflowId: string, batchId: string): string {
  return `resume:${workflowId}:${batchId}`;
}

function buildBatchId(workflowId: string, clarityKey: string): string {
  return `clarify:${workflowId}:${clarityKey}`;
}

function buildClarityKey(items: TechMapClarifyItem[]): string {
  return items
    .map((item) => item.slot_key)
    .sort()
    .join("|");
}

export function buildTechMapClarifyBatch(
  input: TechMapClarifyBatchBuildInput,
): TechMapClarifyBatch | null {
  if (input.clarify_items.length === 0) {
    return null;
  }

  const clarityKey = buildClarityKey(input.clarify_items);
  const batchId = buildBatchId(input.workflow_id, clarityKey);
  const mode = resolveClarifyMode(input.clarify_items);
  const resolvedSlotKeys = input.resolved_slot_keys ?? [];
  const status = resolveClarifyStatus(input.clarify_items, resolvedSlotKeys);
  const priority = resolveBatchPriority(input.clarify_items);
  const now = Date.now();
  const ttlMs = TECH_MAP_DEFAULT_CLARIFY_POLICY.clarify_batch_ttl_hours * 60 * 60 * 1000;

  return {
    batch_id: batchId,
    workflow_id: input.workflow_id,
    mode,
    status,
    priority,
    group_key: input.clarify_items[0]?.group_key ?? "tech_map",
    items: input.clarify_items,
    blocking_for_phase: input.blocking_phase ?? "MISSING_CONTEXT_TRIAGE",
    resume_token: buildResumeToken(input.workflow_id, batchId),
    expires_at: new Date(now + ttlMs).toISOString(),
  };
}

export function buildTechMapWorkflowResumeState(
  input: TechMapClarifyBatchBuildInput & { pending_batch_ids?: string[] },
): TechMapWorkflowResumeState | null {
  const batch = buildTechMapClarifyBatch(input);
  if (!batch) {
    return null;
  }

  const externalRecheckRequired =
    input.external_recheck_required ??
    input.clarify_items.some(
      (item) =>
        item.acceptable_sources.some((source) =>
          ["weather_provider", "price_book", "monitoring_provider"].includes(
            source,
          ),
        ),
    );
  const ttlMs =
    TECH_MAP_DEFAULT_CLARIFY_POLICY.workflow_resume_ttl_days *
    24 *
    60 *
    60 *
    1000;
  const baselineContextHash =
    input.baseline_context_hash ?? `baseline:${input.workflow_id}`;

  return {
    workflow_id: input.workflow_id,
    resume_token: batch.resume_token,
    resume_from_phase: input.blocking_phase ?? "MISSING_CONTEXT_TRIAGE",
    pending_batch_ids: input.pending_batch_ids ?? [batch.batch_id],
    baseline_context_hash: baselineContextHash,
    external_recheck_required: externalRecheckRequired,
    expires_at: new Date(Date.now() + ttlMs).toISOString(),
  };
}

export function buildTechMapClarifyAuditTrail(
  input: TechMapClarifyAuditTrailInput,
): TechMapClarifyAuditEvent[] {
  const now = new Date().toISOString();
  const batch = input.batch;
  const resumeState = input.resume_state;
  const resolvedSlotKeys = input.resolved_slot_keys ?? [];
  const events: TechMapClarifyAuditEvent[] = [];

  if (batch) {
    events.push({
      event_id: `clarify-event:${input.workflow_id}:opened`,
      event_type: "clarify_batch_opened",
      workflow_id: input.workflow_id,
      batch_id: batch.batch_id,
      resume_token: batch.resume_token,
      phase: batch.blocking_for_phase,
      message: `Clarify batch ${batch.batch_id} opened in ${batch.mode} mode with ${batch.items.length} item(s).`,
      occurred_at: now,
      details: {
        status: batch.status,
        priority: batch.priority,
      },
    });
  }

  if (input.resume_requested || resolvedSlotKeys.length > 0) {
    events.push({
      event_id: `clarify-event:${input.workflow_id}:resume-requested`,
      event_type: "workflow_resume_requested",
      workflow_id: input.workflow_id,
      batch_id: batch?.batch_id ?? null,
      resume_token: resumeState?.resume_token ?? batch?.resume_token ?? null,
      phase: resumeState?.resume_from_phase ?? batch?.blocking_for_phase ?? "MISSING_CONTEXT_TRIAGE",
      message:
        resolvedSlotKeys.length > 0
          ? `Resume requested after resolving ${resolvedSlotKeys.length} slot(s).`
          : "Resume requested.",
      occurred_at: now,
      details: {
        resolved_slot_keys: resolvedSlotKeys,
      },
    });
  }

  if (resumeState) {
    events.push({
      event_id: `clarify-event:${input.workflow_id}:resume-ready`,
      event_type: "workflow_resume_ready",
      workflow_id: input.workflow_id,
      batch_id: batch?.batch_id ?? null,
      resume_token: resumeState.resume_token,
      phase: resumeState.resume_from_phase,
      message: `Workflow resume state prepared for ${resumeState.resume_from_phase}.`,
      occurred_at: now,
      details: {
        external_recheck_required: resumeState.external_recheck_required,
        pending_batch_ids: resumeState.pending_batch_ids,
      },
    });
  }

  if (batch?.status === "RESOLVED") {
    events.push({
      event_id: `clarify-event:${input.workflow_id}:resolved`,
      event_type: "clarify_batch_resolved",
      workflow_id: input.workflow_id,
      batch_id: batch.batch_id,
      resume_token: batch.resume_token,
      phase: batch.blocking_for_phase,
      message: `Clarify batch ${batch.batch_id} resolved.`,
      occurred_at: now,
    });
  }

  if (batch?.status === "EXPIRED") {
    events.push({
      event_id: `clarify-event:${input.workflow_id}:expired`,
      event_type: "clarify_batch_expired",
      workflow_id: input.workflow_id,
      batch_id: batch.batch_id,
      resume_token: batch.resume_token,
      phase: batch.blocking_for_phase,
      message: `Clarify batch ${batch.batch_id} expired.`,
      occurred_at: now,
    });
  }

  return events;
}

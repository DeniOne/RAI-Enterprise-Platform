/**
 * Promote / canary / rollback для planner-path после перевода planner в default-on режим.
 * Чистые функции — тестируются без сети.
 */

export type PlannerPromotionMode =
  | "rollback_kill_switch"
  | "off"
  | "full_rollout"
  | "canary_allowlist_in"
  | "canary_allowlist_out"
  | "canary_percent_in"
  | "canary_percent_out";

export type PlannerPromotionDecision = {
  enabled: boolean;
  mode: PlannerPromotionMode;
};

/** Детерминированный bucket 0..99 для canary по companyId. */
export function plannerCanaryBucketForCompanyId(companyId: string): number {
  let h = 0;
  for (let i = 0; i < companyId.length; i += 1) {
    h = (h * 31 + companyId.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

function parseAllowlist(raw: string | undefined): Set<string> | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return ids.length > 0 ? new Set(ids) : null;
}

function parsePercent(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    return null;
  }
  return n;
}

function isRollback(env: NodeJS.ProcessEnv): boolean {
  const v = env.RAI_PLANNER_ROLLBACK;
  return v === "true" || v === "1";
}

/**
 * Включён ли planner-path для данной компании с учётом rollback и canary.
 *
 * Приоритет: RAI_PLANNER_ROLLBACK → RAI_PLANNER_CANARY_COMPANY_IDS → RAI_PLANNER_CANARY_PERCENT → full.
 */
export function resolvePlannerRuntimePathEnabled(input: {
  env: NodeJS.ProcessEnv;
  companyId: string;
}): PlannerPromotionDecision {
  const { env, companyId } = input;
  if (isRollback(env)) {
    return { enabled: false, mode: "rollback_kill_switch" };
  }
  const allow = parseAllowlist(env.RAI_PLANNER_CANARY_COMPANY_IDS);
  if (allow) {
    const ok = allow.has(companyId);
    return {
      enabled: ok,
      mode: ok ? "canary_allowlist_in" : "canary_allowlist_out",
    };
  }
  const pct = parsePercent(env.RAI_PLANNER_CANARY_PERCENT);
  if (pct !== null) {
    const bucket = plannerCanaryBucketForCompanyId(companyId);
    const ok = bucket < pct;
    return {
      enabled: ok,
      mode: ok ? "canary_percent_in" : "canary_percent_out",
    };
  }
  return { enabled: true, mode: "full_rollout" };
}

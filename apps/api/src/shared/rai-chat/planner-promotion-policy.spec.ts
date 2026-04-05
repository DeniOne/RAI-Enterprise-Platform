import {
  plannerCanaryBucketForCompanyId,
  resolvePlannerRuntimePathEnabled,
} from "./planner-promotion-policy";

describe("planner-promotion-policy", () => {
  it("rollback выключает путь даже при default-on planner", () => {
    expect(
      resolvePlannerRuntimePathEnabled({
        env: {
          RAI_PLANNER_ROLLBACK: "true",
        } as NodeJS.ProcessEnv,
        companyId: "c1",
      }),
    ).toEqual({ enabled: false, mode: "rollback_kill_switch" });
  });

  it("без env planner включён по умолчанию", () => {
    expect(
      resolvePlannerRuntimePathEnabled({
        env: {} as NodeJS.ProcessEnv,
        companyId: "c1",
      }),
    ).toEqual({ enabled: true, mode: "full_rollout" });
  });

  it("без canary planner идёт в full_rollout", () => {
    expect(
      resolvePlannerRuntimePathEnabled({
        env: {} as NodeJS.ProcessEnv,
        companyId: "any",
      }),
    ).toEqual({ enabled: true, mode: "full_rollout" });
  });

  it("allowlist: только перечисленные companyId", () => {
    const env = {
      RAI_PLANNER_CANARY_COMPANY_IDS: " a , b ",
    } as NodeJS.ProcessEnv;
    expect(resolvePlannerRuntimePathEnabled({ env, companyId: "a" })).toEqual({
      enabled: true,
      mode: "canary_allowlist_in",
    });
    expect(resolvePlannerRuntimePathEnabled({ env, companyId: "c" })).toEqual({
      enabled: false,
      mode: "canary_allowlist_out",
    });
  });

  it("percent: bucket детерминирован", () => {
    const id = "tenant-stable-1";
    expect(plannerCanaryBucketForCompanyId(id)).toBe(
      plannerCanaryBucketForCompanyId(id),
    );
  });

  it("percent: включение по порогу", () => {
    const id = "x";
    const bucket = plannerCanaryBucketForCompanyId(id);
    expect(
      resolvePlannerRuntimePathEnabled({
        env: {
          RAI_PLANNER_CANARY_PERCENT: String(bucket + 1),
        } as NodeJS.ProcessEnv,
        companyId: id,
      }).enabled,
    ).toBe(true);
    expect(
      resolvePlannerRuntimePathEnabled({
        env: {
          RAI_PLANNER_CANARY_PERCENT: String(bucket),
        } as NodeJS.ProcessEnv,
        companyId: id,
      }).enabled,
    ).toBe(false);
  });

  it("allowlist сильнее percent", () => {
    const env = {
      RAI_PLANNER_CANARY_COMPANY_IDS: "only-one",
      RAI_PLANNER_CANARY_PERCENT: "100",
    } as NodeJS.ProcessEnv;
    expect(
      resolvePlannerRuntimePathEnabled({ env, companyId: "other" }).enabled,
    ).toBe(false);
  });
});

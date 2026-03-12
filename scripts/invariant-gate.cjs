const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const modeArg = process.argv.find((a) => a.startsWith("--mode="));
const cliMode = modeArg ? modeArg.split("=")[1] : "";
const MODE = (cliMode || process.env.INVARIANT_GATE_MODE || "warn").toLowerCase();
const ENFORCE = MODE === "enforce" || MODE === "hard-fail";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".git" || name === "dist") continue;
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function runGovernanceCheck() {
  const cmd = process.platform === "win32" ? "node.exe" : "node";
  const res = spawnSync(cmd, [path.join("scripts", "verify-invariants.cjs")], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf-8",
  });
  return {
    ok: res.status === 0,
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

function checkControllersGuard() {
  const files = walk(path.join(ROOT, "apps", "api", "src")).filter((p) =>
    p.endsWith(".controller.ts"),
  );
  const noGuard = [];
  for (const file of files) {
    const txt = fs.readFileSync(file, "utf-8");
    if (!txt.includes("@Controller(")) continue;
    const hasNestGuard = txt.includes("@UseGuards(");
    const hasAuthorizedDecorator =
      txt.includes("@Authorized(") || txt.includes("@AuthorizedGql(");
    const hasMtlsRequirement = txt.includes("@RequireMtls()");
    const isHealthController = file.endsWith(path.join("modules", "health", "health.controller.ts"));
    if (
      !hasNestGuard &&
      !hasAuthorizedDecorator &&
      !hasMtlsRequirement &&
      !isHealthController
    ) {
      noGuard.push(rel(file));
    }
  }
  return noGuard;
}

function checkRawSqlGovernance() {
  const cmd = process.platform === "win32" ? "node.exe" : "node";
  const res = spawnSync(
    cmd,
    [path.join("scripts", "raw-sql-governance.cjs"), `--mode=${MODE}`],
    {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf-8",
    },
  );
  const out = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
  const reviewRequired = Number(
    out.match(/raw_sql_review_required=(\d+)/)?.[1] || 0,
  );
  const unsafe = Number(out.match(/raw_sql_unsafe=(\d+)/)?.[1] || 0);
  return {
    reviewRequired,
    unsafe,
    raw: out,
    status: res.status,
  };
}

function checkTenantMiddlewarePresence() {
  const file = path.join(ROOT, "apps", "api", "src", "shared", "prisma", "prisma.service.ts");
  if (!fs.existsSync(file)) return false;
  const txt = fs.readFileSync(file, "utf-8");
  const hasLegacyMiddleware =
    txt.includes("TENANT_MIDDLEWARE_MODE") && txt.includes("this.$use(");
  const hasExtensionMiddleware =
    txt.includes("TENANT_MIDDLEWARE_MODE") &&
    txt.includes("tenantClient") &&
    txt.includes("this.$extends(");
  return hasLegacyMiddleware || hasExtensionMiddleware;
}

function checkTenantContextLint() {
  const cmd = process.platform === "win32" ? "node.exe" : "node";
  const res = spawnSync(cmd, [path.join("scripts", "lint-tenant-context.cjs")], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf-8",
  });
  const out = `${res.stdout || ""}\n${res.stderr || ""}`;
  const m = out.match(/tenant_context_suspects=(\d+)/);
  const suspects = m ? Number(m[1]) : 0;
  return { suspects, raw: out.trim(), status: res.status };
}

function checkFsmStatusLint() {
  const cmd = process.platform === "win32" ? "node.exe" : "node";
  const res = spawnSync(cmd, [path.join("scripts", "lint-fsm-status-updates.cjs"), "--enforce"], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf-8",
  });
  const out = `${res.stdout || ""}\n${res.stderr || ""}`;
  const m = out.match(/fsm_status_update_suspects=(\d+)/);
  const suspects = m ? Number(m[1]) : 0;
  return { suspects, raw: out.trim(), status: res.status };
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function main() {
  console.log(`[invariant-gate] mode=${MODE} enforce=${ENFORCE}`);
  const violations = [];

  const governance = runGovernanceCheck();
  printSection("Docs Governance");
  if (!governance.ok) {
    console.log("verify-invariants: FAILED");
    if (governance.stdout) console.log(governance.stdout.trim());
    if (governance.stderr) console.log(governance.stderr.trim());
    violations.push("docs_governance_failed");
  } else {
    console.log("verify-invariants: OK");
  }

  const noGuard = checkControllersGuard();
  printSection("Controller Guards");
  console.log(`controllers_without_guards=${noGuard.length}`);
  for (const f of noGuard) console.log(`- ${f}`);
  if (noGuard.length > 0) violations.push("controllers_without_guards");

  const rawSqlGovernance = checkRawSqlGovernance();
  printSection("Raw SQL Governance");
  if (rawSqlGovernance.raw) {
    const preview = rawSqlGovernance.raw.split("\n").slice(0, 80).join("\n");
    console.log(preview);
  }
  if (rawSqlGovernance.unsafe > 0) {
    violations.push("raw_sql_unsafe_usage");
  }
  if (ENFORCE && rawSqlGovernance.reviewRequired > 0) {
    violations.push("raw_sql_unapproved_paths");
  }

  const hasTenantMw = checkTenantMiddlewarePresence();
  printSection("Tenant Middleware");
  console.log(`tenant_middleware_present=${hasTenantMw}`);
  if (!hasTenantMw) violations.push("tenant_middleware_missing");

  const tenantLint = checkTenantContextLint();
  printSection("Tenant Context Lint");
  console.log(`tenant_context_suspects=${tenantLint.suspects}`);
  if (tenantLint.raw) {
    const preview = tenantLint.raw.split("\n").slice(0, 40).join("\n");
    console.log(preview);
  }
  // Tracked risk now; move to hard violation after cleanup.

  const fsmStatusLint = checkFsmStatusLint();
  printSection("FSM Status Update Lint");
  console.log(`fsm_status_update_suspects=${fsmStatusLint.suspects}`);
  if (fsmStatusLint.raw) {
    const preview = fsmStatusLint.raw.split("\n").slice(0, 40).join("\n");
    console.log(preview);
  }
  if (fsmStatusLint.suspects > 0) violations.push("fsm_status_update_bypass");

  printSection("Summary");
  console.log(`violations=${violations.length}`);
  if (violations.length > 0) {
    console.log(`violation_keys=${violations.join(",")}`);
    if (ENFORCE) process.exit(1);
    console.log("mode=warn => exit 0");
    process.exit(0);
  }
  console.log("all_invariant_checks_passed");
}

main();

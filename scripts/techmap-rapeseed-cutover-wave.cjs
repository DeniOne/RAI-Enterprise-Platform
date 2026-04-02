#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_ENV_PATH = path.join(ROOT, ".env");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");

dotenv.config({ path: DEFAULT_ENV_PATH });

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function getArgs(name) {
  const prefix = `--${name}=`;
  return process.argv
    .filter((arg) => arg.startsWith(prefix))
    .map((arg) => arg.slice(prefix.length));
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function sanitizeFileSegment(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function upsertEnvValue(content, key, value) {
  const normalizedValue = `${value ?? ""}`;
  const line = `${key}=${normalizedValue}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const trimmed = content.trimEnd();
  return `${trimmed}${trimmed ? "\n" : ""}${line}\n`;
}

function parseCanonicalCompanyFilter(content) {
  const match = content.match(/^TECHMAP_RAPESEED_CANONICAL_COMPANIES=(.*)$/m);
  if (!match) {
    return [];
  }

  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setCanonicalFlags(envPath, companyIds) {
  const original = readEnvFile(envPath);
  const nextMode = "canonical";
  const mergedCompanyIds = Array.from(
    new Set([
      ...parseCanonicalCompanyFilter(original),
      ...companyIds.map((item) => String(item || "").trim()).filter(Boolean),
    ]),
  );
  let next = original;
  next = upsertEnvValue(next, "TECHMAP_RAPESEED_CANONICAL_MODE", nextMode);
  next = upsertEnvValue(
    next,
    "TECHMAP_RAPESEED_CANONICAL_COMPANIES",
    mergedCompanyIds.join(","),
  );
  fs.writeFileSync(envPath, next, "utf8");

  return {
    mode: nextMode,
    companyFilter: mergedCompanyIds.join(","),
  };
}

function parseTenantSpec(raw, index) {
  const [companyId, companyName, regionName] = String(raw || "").split("|");
  if (!companyId || !companyName || !regionName) {
    throw new Error(
      `Некорректный --tenant на позиции ${index + 1}. Ожидается формат companyId|Company Name|Region Name`,
    );
  }

  return {
    companyId: companyId.trim(),
    companyName: companyName.trim(),
    regionName: regionName.trim(),
  };
}

function runNodeScript(scriptPath, args) {
  return execFileSync("node", [scriptPath, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runCommand(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function restartRuntimeWithEnv(envState) {
  return execFileSync("pm2", ["restart", "rai-api", "--update-env"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      TECHMAP_RAPESEED_CANONICAL_MODE: envState.mode,
      TECHMAP_RAPESEED_CANONICAL_COMPANIES: envState.companyFilter,
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(baseUrl, endpoint) {
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `HTTP ${response.status} для ${endpoint}: ${body.slice(0, 500)}`,
    );
  }

  return response.json();
}

async function requestJsonWithRetry(baseUrl, endpoint, options = {}) {
  const attempts = options.attempts ?? 20;
  const delayMs = options.delayMs ?? 1000;
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await requestJson(baseUrl, endpoint);
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError ?? new Error(`Не удалось получить ${endpoint}`);
}

async function postGenerate(apiBaseUrl, tenant, seasonYear) {
  const idempotencyKey = `${tenant.companyId}-smoke-${seasonYear}-${Date.now()}`;
  const response = await fetch(`${apiBaseUrl}/tech-map/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      harvestPlanId: `${tenant.companyId}-harvest-plan-${seasonYear}`,
      seasonId: `${tenant.companyId}-season-${seasonYear}`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Smoke generation failed for ${tenant.companyId}: HTTP ${response.status} ${body.slice(0, 500)}`,
    );
  }

  return response.json();
}

async function postGenerateWithRetry(apiBaseUrl, tenant, seasonYear, options = {}) {
  const attempts = options.attempts ?? 10;
  const delayMs = options.delayMs ?? 1500;
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await postGenerate(apiBaseUrl, tenant, seasonYear);
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError ?? new Error(`Не удалось выполнить smoke generation для ${tenant.companyId}`);
}

async function ensureCanonicalFilterVisible(apiBaseUrl, companyIds, options = {}) {
  const attempts = options.attempts ?? 20;
  const delayMs = options.delayMs ?? 1000;
  const expected = companyIds.map((item) => String(item || "").trim()).filter(Boolean);
  let lastSeen = [];

  for (let index = 0; index < attempts; index += 1) {
    try {
      const packet = await requestJsonWithRetry(
        apiBaseUrl,
        `/tech-map/generation-rollout/cutover-packet?companyId=${encodeURIComponent(expected[0])}`,
        { attempts: 1, delayMs },
      );
      lastSeen = String(packet?.currentFeatureFlags?.companyFilter || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const allPresent = expected.every((companyId) => lastSeen.includes(companyId));
      if (packet?.currentFeatureFlags?.mode === "canonical" && allPresent) {
        return {
          mode: packet.currentFeatureFlags.mode,
          companyFilter: packet.currentFeatureFlags.companyFilter,
        };
      }
    } catch (_error) {
      // retry below
    }

    if (index < attempts - 1) {
      await sleep(delayMs);
    }
  }

  throw new Error(
    `Runtime не подтвердил canonical company filter для wave. Последний видимый filter: ${lastSeen.join(",") || "<empty>"}`,
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildMarkdownReport(report) {
  const lines = [
    "# Rapeseed Cutover Wave",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- wave_id: \`${report.waveId}\``,
    `- tenant_count: \`${report.tenants.length}\``,
    `- env_mode: \`${report.envState.mode}\``,
    `- env_company_filter: \`${report.envState.companyFilter}\``,
    "",
    "## Tenant Results",
    "",
    ...report.tenants.map((tenant) =>
      `- \`${tenant.companyId}\` -> \`${tenant.verify.status}\` / \`${tenant.verify.verdict}\` / techmap \`${tenant.smokeTechMapId}\``,
    ),
    "",
    "## Matrix",
    "",
    `- operational_pass: \`${report.matrixOperational.passCompanies.length}\``,
    `- operational_blocked: \`${report.matrixOperational.blockedCompanies.length}\``,
    `- all_pass: \`${report.matrixAll.passCompanies.length}\``,
    `- all_blocked: \`${report.matrixAll.blockedCompanies.length}\``,
    "",
  ];

  return lines.join("\n");
}

async function main() {
  const waveId = getArg("wave-id") || "default-wave";
  const envPath = path.resolve(getArg("env-file") || DEFAULT_ENV_PATH);
  const apiBaseUrl =
    getArg("api-url") ||
    process.env.RAI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api";
  const seasonYear = Number(getArg("season-year") || "2026");
  const tenantSpecs = getArgs("tenant");

  if (tenantSpecs.length === 0) {
    console.error(
      "Требуется хотя бы один --tenant=companyId|Company Name|Region Name",
    );
    process.exit(1);
  }

  const tenants = tenantSpecs.map(parseTenantSpec);

  const tenantResults = [];

  for (const tenant of tenants) {
    runNodeScript(path.join("scripts", "techmap-rapeseed-pilot-onboard.cjs"), [
      `--company-id=${tenant.companyId}`,
      `--company-name=${tenant.companyName}`,
      `--region-name=${tenant.regionName}`,
      `--season-year=${seasonYear}`,
    ]);
  }

  const envState = setCanonicalFlags(
    envPath,
    tenants.map((tenant) => tenant.companyId),
  );

  restartRuntimeWithEnv(envState);

  const health = await requestJsonWithRetry(apiBaseUrl, "/health");
  if (health.status !== "ok") {
    throw new Error("API health-check после restart не вернул status=ok");
  }

  await ensureCanonicalFilterVisible(
    apiBaseUrl,
    tenants.map((tenant) => tenant.companyId),
  );

  for (const tenant of tenants) {
    const smokeMap = await postGenerateWithRetry(apiBaseUrl, tenant, seasonYear);
    runNodeScript(path.join("scripts", "techmap-rapeseed-cutover.cjs"), [
      "--action=prepare",
      `--company-id=${tenant.companyId}`,
    ]);
    runNodeScript(path.join("scripts", "techmap-rapeseed-cutover.cjs"), [
      "--action=apply",
      `--company-id=${tenant.companyId}`,
    ]);
    runNodeScript(path.join("scripts", "techmap-rapeseed-cutover.cjs"), [
      "--action=verify",
      `--company-id=${tenant.companyId}`,
    ]);

    const prepareReport = readJson(
      path.join(
        OUTPUT_DIR,
        `techmap-rapeseed-cutover-${sanitizeFileSegment(tenant.companyId)}-prepare.json`,
      ),
    );
    const verifyReport = readJson(
      path.join(
        OUTPUT_DIR,
        `techmap-rapeseed-cutover-${sanitizeFileSegment(tenant.companyId)}-verify.json`,
      ),
    );

    tenantResults.push({
      ...tenant,
      smokeTechMapId: smokeMap.id,
      smokeGenerationStrategy:
        smokeMap.generationMetadata?.generationStrategy ?? null,
      prepare: {
        status: prepareReport.status,
        verdict: prepareReport.verdict,
      },
      verify: {
        status: verifyReport.status,
        verdict: verifyReport.verdict,
      },
    });
  }

  runNodeScript(path.join("scripts", "techmap-rapeseed-cutover-matrix.cjs"), []);
  runNodeScript(path.join("scripts", "techmap-rapeseed-cutover-matrix.cjs"), [
    "--scope=all",
  ]);

  const matrixOperational = readJson(
    path.join(OUTPUT_DIR, "techmap-rapeseed-cutover-matrix-operational.json"),
  );
  const matrixAll = readJson(
    path.join(OUTPUT_DIR, "techmap-rapeseed-cutover-matrix-all.json"),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    waveId,
    envState,
    tenants: tenantResults,
    matrixOperational,
    matrixAll,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const reportJson = path.join(
    OUTPUT_DIR,
    `techmap-rapeseed-cutover-wave-${sanitizeFileSegment(waveId)}.json`,
  );
  const reportMd = path.join(
    OUTPUT_DIR,
    `techmap-rapeseed-cutover-wave-${sanitizeFileSegment(waveId)}.md`,
  );
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2));
  fs.writeFileSync(reportMd, buildMarkdownReport(report), "utf8");

  console.log("[techmap-rapeseed-cutover-wave] summary");
  console.log(`- wave_id=${waveId}`);
  console.log(`- tenant_count=${tenantResults.length}`);
  console.log(`- operational_pass=${matrixOperational.passCompanies.length}`);
  console.log(`- operational_blocked=${matrixOperational.blockedCompanies.length}`);
  console.log(`- report_json=${rel(reportJson)}`);
  console.log(`- report_md=${rel(reportMd)}`);
}

main().catch((error) => {
  console.error("[techmap-rapeseed-cutover-wave] error");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

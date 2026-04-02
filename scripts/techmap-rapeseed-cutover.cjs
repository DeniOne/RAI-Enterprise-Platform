#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_ENV_PATH = path.join(ROOT, ".env");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");

dotenv.config({ path: DEFAULT_ENV_PATH });

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

function applyFeatureFlagsToEnv(params) {
  const original = readEnvFile(params.envPath);
  const backupPath = `${params.envPath}.rapeseed-cutover.bak`;
  fs.writeFileSync(backupPath, original, "utf8");

  let next = original;
  next = upsertEnvValue(
    next,
    "TECHMAP_RAPESEED_CANONICAL_MODE",
    params.mode,
  );
  next = upsertEnvValue(
    next,
    "TECHMAP_RAPESEED_CANONICAL_COMPANIES",
    params.companyFilter,
  );
  fs.writeFileSync(params.envPath, next, "utf8");

  return {
    backupPath,
    updatedKeys: {
      TECHMAP_RAPESEED_CANONICAL_MODE: params.mode,
      TECHMAP_RAPESEED_CANONICAL_COMPANIES: params.companyFilter,
    },
  };
}

function restartRuntimeWithEnv(params) {
  execFileSync("pm2", ["restart", "rai-api", "--update-env"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      TECHMAP_RAPESEED_CANONICAL_MODE: params.mode,
      TECHMAP_RAPESEED_CANONICAL_COMPANIES: params.companyFilter,
    },
  });

  return {
    restarted: true,
    runtimeFlags: {
      TECHMAP_RAPESEED_CANONICAL_MODE: params.mode,
      TECHMAP_RAPESEED_CANONICAL_COMPANIES: params.companyFilter,
    },
  };
}

async function requestJson(baseUrl, endpoint, token) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `HTTP ${response.status} для ${endpoint}: ${body.slice(0, 500)}`,
    );
  }

  return response.json();
}

function withCompanyScope(endpoint, companyId) {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) {
    return endpoint;
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}companyId=${encodeURIComponent(normalizedCompanyId)}`;
}

function buildMarkdownReport(report) {
  const lines = [
    "# Rapeseed Canonical Cutover",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- action: \`${report.action}\``,
    `- company_id: \`${report.companyId}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- api_base_url: \`${report.apiBaseUrl}\``,
    "",
    "## Readiness",
    "",
    `- readiness_verdict: \`${report.readiness?.verdict ?? "UNKNOWN"}\``,
    `- can_enable_canonical_default: \`${report.readiness?.canEnableCanonicalDefault ?? false}\``,
    `- suggested_mode: \`${report.readiness?.suggestedMode ?? "unknown"}\``,
    "",
    "## Feature Flags",
    "",
    `- current_mode: \`${report.packet?.currentFeatureFlags?.mode ?? "unknown"}\``,
    `- current_company_filter: \`${report.packet?.currentFeatureFlags?.companyFilter ?? ""}\``,
    `- recommended_mode: \`${report.packet?.recommendedFeatureFlags?.mode ?? "unknown"}\``,
    `- recommended_company_filter: \`${report.packet?.recommendedFeatureFlags?.companyFilter ?? ""}\``,
    "",
    "## Commands",
    "",
    `- release_command: \`${report.packet?.releaseCommand ?? "n/a"}\``,
    `- rollback_command: \`${report.packet?.rollbackCommand ?? "n/a"}\``,
    report.envChange?.backupPath
      ? `- env_backup: \`${report.envChange.backupPath}\``
      : "- env_backup: `n/a`",
    "",
    "## Blockers",
    "",
    ...(report.readiness?.blockers?.length
      ? report.readiness.blockers.map((item) => `- ${item}`)
      : ["- blockers: none"]),
    "",
    "## Warnings",
    "",
    ...(report.readiness?.warnings?.length
      ? report.readiness.warnings.map((item) => `- ${item}`)
      : ["- warnings: none"]),
    "",
    "## Next Action",
    "",
    `- ${report.nextAction}`,
    "",
  ];

  return lines.join("\n");
}

function printHelp() {
  console.log(
    [
      "Использование:",
      "  node scripts/techmap-rapeseed-cutover.cjs --action=prepare|apply|verify|rollback --company-id=<id> [--env-file=/abs/path/.env] [--api-url=http://localhost:4000/api] [--token=<jwt>] [--force] [--restart-runtime]",
      "",
      "Переменные окружения:",
      "  NEXT_PUBLIC_API_URL или RAI_API_URL",
      "  RAI_API_TOKEN для Authorization Bearer",
      "",
      "Поведение:",
      "  prepare  - читает summary/readiness/cutover-packet и сохраняет operational packet",
      "  apply    - при PASS применяет recommended feature flags в .env",
      "  verify   - повторно фиксирует readiness после переключения",
      "  rollback - применяет rollback feature flags в .env",
      "  --restart-runtime - после apply/rollback выполняет pm2 restart rai-api --update-env с явной передачей rapeseed flags в runtime",
    ].join("\n"),
  );
}

async function main() {
  if (hasFlag("help")) {
    printHelp();
    return;
  }

  const action = getArg("action") || "prepare";
  const companyId = getArg("company-id");
  if (!companyId) {
    console.error("Требуется --company-id=<id>");
    process.exit(1);
  }

  const envPath = path.resolve(getArg("env-file") || DEFAULT_ENV_PATH);
  const token = getArg("token") || process.env.RAI_API_TOKEN || "";
  const apiBaseUrl =
    getArg("api-url") ||
    process.env.RAI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api";
  const force = hasFlag("force");
  const restartRuntime = hasFlag("restart-runtime");

  const summary = await requestJson(
    apiBaseUrl,
    withCompanyScope("/tech-map/generation-rollout/summary", companyId),
    token,
  );
  const readiness = await requestJson(
    apiBaseUrl,
    withCompanyScope("/tech-map/generation-rollout/readiness", companyId),
    token,
  );
  const packet = await requestJson(
    apiBaseUrl,
    withCompanyScope("/tech-map/generation-rollout/cutover-packet", companyId),
    token,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    action,
    companyId,
    apiBaseUrl,
    summary,
    readiness,
    packet,
    envChange: null,
    status: "open",
    verdict: "pending",
    nextAction: "проверить readiness и packet",
  };

  if (action === "prepare") {
    report.status =
      readiness.verdict === "PASS" ? "ready_for_cutover" : "cutover_blocked";
    report.verdict = readiness.verdict;
    report.nextAction =
      readiness.verdict === "PASS"
        ? "выполнить apply, затем smoke generation и verify"
        : "закрыть blockers/warnings перед apply";
  } else if (action === "apply") {
    if (!packet.canExecuteCutover && !force) {
      report.status = "apply_blocked";
      report.verdict = readiness.verdict;
      report.nextAction =
        "не применять feature flags до получения PASS или использовать --force осознанно";
    } else {
      report.envChange = applyFeatureFlagsToEnv({
        envPath,
        mode: packet.recommendedFeatureFlags.mode,
        companyFilter: packet.recommendedFeatureFlags.companyFilter,
      });
      if (restartRuntime) {
        report.runtimeRestart = restartRuntimeWithEnv({
          mode: packet.recommendedFeatureFlags.mode,
          companyFilter: packet.recommendedFeatureFlags.companyFilter,
        });
      }
      report.status = "cutover_applied";
      report.verdict = packet.recommendedFeatureFlags.mode;
      report.nextAction =
        restartRuntime
          ? "runtime уже перезапущен с новыми flags, затем выполнить verify и smoke generation"
          : "перезапустить runtime с новым окружением, затем выполнить verify и smoke generation";
    }
  } else if (action === "rollback") {
    const rollbackMode = packet.rollbackCommand
      .split(" ")
      .find((part) => part.startsWith("TECHMAP_RAPESEED_CANONICAL_MODE="))
      ?.split("=")[1] ?? "shadow";
    const rollbackCompanyFilter = packet.rollbackCommand
      .split(" ")
      .find((part) =>
        part.startsWith("TECHMAP_RAPESEED_CANONICAL_COMPANIES="),
      )
      ?.split("=")[1] ?? "";
    report.envChange = applyFeatureFlagsToEnv({
      envPath,
      mode: rollbackMode,
      companyFilter: rollbackCompanyFilter,
    });
    if (restartRuntime) {
      report.runtimeRestart = restartRuntimeWithEnv({
        mode: rollbackMode,
        companyFilter: rollbackCompanyFilter,
      });
    }
    report.status = "rollback_applied";
    report.verdict = "rollback_ready";
    report.nextAction =
      restartRuntime
        ? "runtime уже перезапущен с rollback flags, затем повторить smoke generation и убедиться, что blocker incidents не растут"
        : "перезапустить runtime, затем повторить smoke generation и убедиться, что blocker incidents не растут";
  } else if (action === "verify") {
    report.status =
      readiness.verdict === "PASS" ? "verified_pass" : "verified_blocked";
    report.verdict = readiness.verdict;
    report.nextAction =
      readiness.verdict === "PASS"
        ? "выполнить tenant smoke generation и сохранить evidence packet"
        : "выполнить rollback или закрыть blockers до повторной проверки";
  } else {
    console.error(
      `Неизвестное действие: ${action}. Ожидается prepare|apply|verify|rollback`,
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const suffix = `${sanitizeFileSegment(companyId)}-${sanitizeFileSegment(action)}`;
  const reportJson = path.join(
    OUTPUT_DIR,
    `techmap-rapeseed-cutover-${suffix}.json`,
  );
  const reportMd = path.join(
    OUTPUT_DIR,
    `techmap-rapeseed-cutover-${suffix}.md`,
  );

  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2));
  fs.writeFileSync(reportMd, buildMarkdownReport(report));

  console.log("[techmap-rapeseed-cutover] summary");
  console.log(`- action=${action}`);
  console.log(`- company_id=${companyId}`);
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- report_json=${rel(reportJson)}`);
  console.log(`- report_md=${rel(reportMd)}`);
  if (report.envChange?.backupPath) {
    console.log(`- env_backup=${rel(report.envChange.backupPath)}`);
  }

  if ((action === "apply" && report.status === "apply_blocked") || report.status === "verified_blocked") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[techmap-rapeseed-cutover] error");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

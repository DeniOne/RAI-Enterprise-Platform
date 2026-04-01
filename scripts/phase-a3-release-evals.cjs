#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "ops");
const DATE = new Date().toISOString().slice(0, 10);
const ARTIFACT_DIR = path.join(OUTPUT_DIR, `phase-a3-release-evals-${DATE}`);
const MANIFEST_FILE = path.join(OUTPUT_DIR, `phase-a3-release-eval-manifest-${DATE}.json`);
const SUMMARY_JSON = path.join(OUTPUT_DIR, `phase-a3-release-eval-summary-${DATE}.json`);
const SUMMARY_MD = path.join(OUTPUT_DIR, `phase-a3-release-eval-summary-${DATE}.md`);
const PNPM_CMD = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const NODE_CMD = process.execPath;

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function tryReadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseDrillStdout(stdout) {
  const trimmed = (stdout || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function buildRunDefinitions() {
  return [
    {
      id: "rai_chat_service_spec",
      label: "RaiChatService malicious input / context isolation",
      kind: "jest",
      cmd: PNPM_CMD,
      args: [
        "--dir",
        "apps/api",
        "exec",
        "jest",
        "--runInBand",
        "src/modules/rai-chat/rai-chat.service.spec.ts",
        "--json",
        `--outputFile=${path.join(ARTIFACT_DIR, "rai-chat-service-spec.json")}`,
      ],
      artifactFile: path.join(ARTIFACT_DIR, "rai-chat-service-spec.json"),
    },
    {
      id: "supervisor_agent_spec",
      label: "SupervisorAgent governed tool and evidence tests",
      kind: "jest",
      cmd: PNPM_CMD,
      args: [
        "--dir",
        "apps/api",
        "exec",
        "jest",
        "--runInBand",
        "src/modules/rai-chat/supervisor-agent.service.spec.ts",
        "--json",
        `--outputFile=${path.join(ARTIFACT_DIR, "supervisor-agent-spec.json")}`,
      ],
      artifactFile: path.join(ARTIFACT_DIR, "supervisor-agent-spec.json"),
    },
    {
      id: "runtime_spine_spec",
      label: "Runtime spine governed execution tests",
      kind: "jest",
      cmd: PNPM_CMD,
      args: [
        "--dir",
        "apps/api",
        "exec",
        "jest",
        "--runInBand",
        "src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts",
        "--json",
        `--outputFile=${path.join(ARTIFACT_DIR, "runtime-spine-spec.json")}`,
      ],
      artifactFile: path.join(ARTIFACT_DIR, "runtime-spine-spec.json"),
    },
    {
      id: "advisory_oncall_drill",
      label: "Advisory oncall drill",
      kind: "drill",
      cmd: NODE_CMD,
      args: ["apps/api/scripts/ops/advisory-oncall-drill.mjs"],
      artifactFile: path.join(ARTIFACT_DIR, "advisory-oncall-drill.json"),
    },
    {
      id: "advisory_stage_progression_drill",
      label: "Advisory stage progression drill",
      kind: "drill",
      cmd: NODE_CMD,
      args: ["apps/api/scripts/ops/advisory-stage-progression.mjs"],
      artifactFile: path.join(ARTIFACT_DIR, "advisory-stage-progression-drill.json"),
    },
    {
      id: "advisory_dr_rollback_drill",
      label: "Advisory DR rollback rehearsal",
      kind: "drill",
      cmd: NODE_CMD,
      args: ["apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs"],
      artifactFile: path.join(ARTIFACT_DIR, "advisory-dr-rollback-drill.json"),
    },
  ];
}

function buildClusterDefinitions() {
  return [
    {
      id: "prompt_injection",
      title: "prompt injection / context abuse",
      runIds: ["rai_chat_service_spec"],
      notes:
        "Tier 1 proxy cluster: malicious metadata/companyId injection, secret denylist и fail-open retrieval path.",
    },
    {
      id: "tool_misuse",
      title: "tool misuse",
      runIds: ["supervisor_agent_spec", "runtime_spine_spec"],
      notes:
        "Проверяет, что WRITE/CRITICAL tools не превращаются в свободный execute-path только из-за наличия binding.",
    },
    {
      id: "unsafe_autonomy",
      title: "unsafe autonomy",
      runIds: [
        "supervisor_agent_spec",
        "runtime_spine_spec",
        "advisory_stage_progression_drill",
      ],
      notes:
        "Покрывает runtime blocking, governed progression и отсутствие свободной мутации без policy/HITL path.",
    },
    {
      id: "evidence_bypass",
      title: "evidence bypass",
      runIds: ["supervisor_agent_spec", "runtime_spine_spec"],
      notes:
        "Проверяет no-evidence и pending-evidence ветки, чтобы unsupported answer не маскировался под grounded result.",
    },
    {
      id: "wrong_or_no_evidence_answer",
      title: "wrong-evidence / no-evidence answer",
      runIds: ["rai_chat_service_spec", "supervisor_agent_spec", "runtime_spine_spec"],
      notes:
        "Покрывает denial of secret persistence, uncertainty path и runtime truthfulness accounting.",
    },
    {
      id: "human_in_the_loop_gap",
      title: "human-in-the-loop gap",
      runIds: ["supervisor_agent_spec", "runtime_spine_spec"],
      notes:
        "Подтверждает создание PendingAction и сохранение approval-chain на high-impact flows.",
    },
    {
      id: "direct_crm_exception_boundary",
      title: "direct CRM exception boundary",
      runIds: ["supervisor_agent_spec"],
      notes:
        "Проверяет, что узкое CRM-исключение не расползается в общий bypass governed write-path.",
    },
    {
      id: "quarantine_and_tool_first",
      title: "quarantine and TOOL_FIRST",
      runIds: ["runtime_spine_spec", "advisory_oncall_drill", "advisory_dr_rollback_drill"],
      notes:
        "Покрывает runtime blocking при TOOL_FIRST/QUARANTINE и containment/rollback поверх advisory perimeter.",
    },
  ];
}

function runDefinition(definition) {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const result = spawnSync(definition.cmd, definition.args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env },
    maxBuffer: 32 * 1024 * 1024,
  });
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startedMs;
  const exitCode = result.status ?? 1;
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  let artifact = null;

  if (definition.kind === "jest") {
    artifact = tryReadJson(definition.artifactFile);
  } else if (definition.kind === "drill") {
    artifact = parseDrillStdout(stdout);
    if (artifact) {
      writeJson(definition.artifactFile, artifact);
    }
  }

  return {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    command: [definition.cmd, ...definition.args].join(" "),
    artifactFile: definition.artifactFile,
    startedAt,
    finishedAt,
    durationMs,
    exitCode,
    status: exitCode === 0 ? "PASS" : "FAIL",
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    artifact,
  };
}

function summarizeCommand(result) {
  if (result.kind === "jest" && result.artifact) {
    return {
      totalSuites: result.artifact.numTotalTestSuites ?? null,
      passedSuites: result.artifact.numPassedTestSuites ?? null,
      failedSuites: result.artifact.numFailedTestSuites ?? null,
      totalTests: result.artifact.numTotalTests ?? null,
      passedTests: result.artifact.numPassedTests ?? null,
      failedTests: result.artifact.numFailedTests ?? null,
    };
  }
  if (result.kind === "drill" && result.artifact) {
    return {
      drillStatus: result.artifact.status || null,
      checks: result.artifact.checks || {},
    };
  }
  return null;
}

function renderMarkdown(report) {
  const lines = [
    "# Phase A3 Release Eval Summary",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- date: \`${report.date}\``,
    `- manifest_file: \`${rel(report.manifestFile)}\``,
    `- summary_json: \`${rel(report.summaryJson)}\``,
    `- artifact_dir: \`${rel(report.artifactDir)}\``,
    `- gate_status: \`${report.gateStatus}\``,
    "",
    "## Command Results",
    "",
    "| Run | Kind | Status | Duration ms | Artifact |",
    "|---|---|---|---:|---|",
    ...report.commandResults.map(
      (item) =>
        `| \`${item.id}\` | \`${item.kind}\` | \`${item.status}\` | ${item.durationMs} | \`${item.artifactRel}\` |`,
    ),
    "",
    "## Derived Clusters",
    "",
    "| Cluster | Status | Evidence runs | Notes |",
    "|---|---|---|---|",
    ...report.clusterResults.map(
      (item) =>
        `| \`${item.id}\` | \`${item.status}\` | ${item.runIds.map((runId) => `\`${runId}\``).join(", ")} | ${item.notes} |`,
    ),
    "",
    "## Totals",
    "",
    `- commands_total: \`${report.totals.commandsTotal}\``,
    `- commands_passed: \`${report.totals.commandsPassed}\``,
    `- commands_failed: \`${report.totals.commandsFailed}\``,
    `- clusters_total: \`${report.totals.clustersTotal}\``,
    `- clusters_passed: \`${report.totals.clustersPassed}\``,
    `- clusters_failed: \`${report.totals.clustersFailed}\``,
    "",
  ];

  return lines.join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  ensureDir(OUTPUT_DIR);
  ensureDir(ARTIFACT_DIR);

  const definitions = buildRunDefinitions();
  const clusterDefinitions = buildClusterDefinitions();
  writeJson(MANIFEST_FILE, {
    generatedAt: new Date().toISOString(),
    date: DATE,
    artifactDir: rel(ARTIFACT_DIR),
    runDefinitions: definitions.map((item) => ({
      id: item.id,
      label: item.label,
      kind: item.kind,
      command: [item.cmd, ...item.args].join(" "),
      artifactFile: rel(item.artifactFile),
    })),
    clusterDefinitions,
  });

  const commandResults = definitions.map((definition) => runDefinition(definition));
  const resultMap = new Map(commandResults.map((item) => [item.id, item]));

  const clusterResults = clusterDefinitions.map((cluster) => {
    const statuses = cluster.runIds.map((runId) => resultMap.get(runId)?.status || "FAIL");
    const pass = statuses.every((status) => status === "PASS");
    return {
      id: cluster.id,
      title: cluster.title,
      runIds: cluster.runIds,
      notes: cluster.notes,
      status: pass ? "PASS" : "FAIL",
    };
  });

  const commandsFailed = commandResults.filter((item) => item.status !== "PASS").length;
  const clustersFailed = clusterResults.filter((item) => item.status !== "PASS").length;
  const gateStatus = commandsFailed === 0 && clustersFailed === 0 ? "PASS" : "FAIL";

  const report = {
    generatedAt: new Date().toISOString(),
    date: DATE,
    mode,
    manifestFile: MANIFEST_FILE,
    summaryJson: SUMMARY_JSON,
    artifactDir: ARTIFACT_DIR,
    gateStatus,
    totals: {
      commandsTotal: commandResults.length,
      commandsPassed: commandResults.length - commandsFailed,
      commandsFailed,
      clustersTotal: clusterResults.length,
      clustersPassed: clusterResults.length - clustersFailed,
      clustersFailed,
    },
    commandResults: commandResults.map((item) => ({
      id: item.id,
      label: item.label,
      kind: item.kind,
      status: item.status,
      exitCode: item.exitCode,
      durationMs: item.durationMs,
      artifactRel: rel(item.artifactFile),
      command: item.command,
      summary: summarizeCommand(item),
    })),
    clusterResults,
  };

  writeJson(SUMMARY_JSON, report);
  fs.writeFileSync(SUMMARY_MD, `${renderMarkdown(report)}\n`);

  console.log("[phase-a3-release-evals] summary");
  console.log(`- gate_status=${gateStatus}`);
  console.log(`- commands_passed=${report.totals.commandsPassed}/${report.totals.commandsTotal}`);
  console.log(`- clusters_passed=${report.totals.clustersPassed}/${report.totals.clustersTotal}`);
  console.log(`- manifest=${rel(MANIFEST_FILE)}`);
  console.log(`- summary_json=${rel(SUMMARY_JSON)}`);
  console.log(`- summary_md=${rel(SUMMARY_MD)}`);

  if (mode === "enforce" && gateStatus !== "PASS") {
    process.exit(1);
  }
}

main();

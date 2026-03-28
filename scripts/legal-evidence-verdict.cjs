#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REPORT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const REPORT_MD = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.md");
const REGISTER_FILE = process.env.LEGAL_EVIDENCE_REGISTER_FILE
  ? path.resolve(process.env.LEGAL_EVIDENCE_REGISTER_FILE)
  : path.join(
      ROOT,
      "docs",
      "05_OPERATIONS",
      "EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md",
    );
const STATUS_REPORT_JSON = process.env.LEGAL_EVIDENCE_STATUS_REPORT
  ? path.resolve(process.env.LEGAL_EVIDENCE_STATUS_REPORT)
  : path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const CONDITIONAL_GO_ACCEPTED = [
  "ELP-20260328-01",
  "ELP-20260328-02",
  "ELP-20260328-03",
  "ELP-20260328-04",
  "ELP-20260328-05",
  "ELP-20260328-06",
  "ELP-20260328-08",
  "ELP-20260328-09",
];
const CONDITIONAL_GO_ASSIGNED = ["ELP-20260328-07", "ELP-20260328-10"];
const GO_ACCEPTED = Array.from({ length: 11 }, (_, index) =>
  `ELP-20260328-${String(index + 1).padStart(2, "0")}`,
);

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function parseRegisterRows(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith("| `ELP-")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 9) continue;
    rows.push({
      referenceId: cells[0].replace(/`/g, ""),
      artifact: cells[1],
      status: cells[2].replace(/`/g, ""),
      ownerScope: cells[3],
      namedOwners: cells[4],
      requestedAt: cells[5].replace(/`/g, ""),
      reviewDue: cells[6].replace(/`/g, ""),
      linkedDocs: cells[7],
      nextAction: cells[8],
    });
  }
  return rows;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildAcceptedBlockers(requiredIds, registerMap, statusMap, reason) {
  return requiredIds
    .map((referenceId) => {
      const registerRow = registerMap.get(referenceId);
      const statusItem = statusMap.get(referenceId);
      return {
        referenceId,
        artifact: registerRow ? registerRow.artifact : "<missing>",
        currentStatus: statusItem ? statusItem.status : registerRow ? registerRow.status : "<missing>",
        ownerScope: registerRow ? registerRow.ownerScope : "<missing>",
        namedOwners: registerRow ? registerRow.namedOwners : "<missing>",
        nextAction: registerRow ? registerRow.nextAction : "добавить карточку в register",
        reason,
      };
    })
    .filter((item) => item.currentStatus !== "accepted");
}

function buildAssignmentBlockers(requiredIds, registerMap, statusMap) {
  return requiredIds
    .map((referenceId) => {
      const registerRow = registerMap.get(referenceId);
      const statusItem = statusMap.get(referenceId);
      const hasOwners = registerRow && registerRow.namedOwners && registerRow.namedOwners !== "-";
      const hasSla = registerRow && isValidDate(registerRow.reviewDue);
      const hasStatus = statusItem && statusItem.status;
      return {
        referenceId,
        artifact: registerRow ? registerRow.artifact : "<missing>",
        currentStatus: statusItem ? statusItem.status : registerRow ? registerRow.status : "<missing>",
        ownerScope: registerRow ? registerRow.ownerScope : "<missing>",
        namedOwners: registerRow ? registerRow.namedOwners : "<missing>",
        nextAction: registerRow ? registerRow.nextAction : "добавить карточку в register",
        reason: !registerRow
          ? "карточка отсутствует в register"
          : !hasOwners
            ? "нет named owners"
            : !hasSla
              ? "нет review SLA"
              : !hasStatus
                ? "нет status в status report"
                : "",
      };
    })
    .filter((item) => item.reason);
}

function buildTransitionSummary(name, ready, blockers, assignmentBlockers) {
  return {
    transition: name,
    ready,
    blockerCount: blockers.length + assignmentBlockers.length,
    blockers,
    assignmentBlockers,
  };
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  if (!fs.existsSync(REGISTER_FILE)) {
    console.error(`[legal-evidence-verdict] отсутствует register: ${rel(REGISTER_FILE)}`);
    process.exit(1);
  }
  if (!fs.existsSync(STATUS_REPORT_JSON)) {
    console.error(
      `[legal-evidence-verdict] отсутствует status report: ${rel(STATUS_REPORT_JSON)}; сначала запусти legal-evidence-status`,
    );
    process.exit(1);
  }

  const registerRows = parseRegisterRows(readText(REGISTER_FILE));
  const registerMap = new Map(registerRows.map((row) => [row.referenceId, row]));
  const statusReport = readJson(STATUS_REPORT_JSON);
  const statusMap = new Map((statusReport.items || []).map((item) => [item.referenceId, item]));

  for (const referenceId of GO_ACCEPTED) {
    if (!registerMap.has(referenceId)) {
      issues.push({
        severity: "error",
        type: "missing_register_row",
        referenceId,
      });
    }
  }

  const conditionalAcceptedBlockers = buildAcceptedBlockers(
    CONDITIONAL_GO_ACCEPTED,
    registerMap,
    statusMap,
    "нужен статус accepted для перехода в CONDITIONAL GO",
  );
  const conditionalAssignmentBlockers = buildAssignmentBlockers(
    CONDITIONAL_GO_ASSIGNED,
    registerMap,
    statusMap,
  );
  const goAcceptedBlockers = buildAcceptedBlockers(
    GO_ACCEPTED,
    registerMap,
    statusMap,
    "нужен статус accepted для перехода в GO",
  );

  const conditionalGoReady =
    conditionalAcceptedBlockers.length === 0 && conditionalAssignmentBlockers.length === 0;
  const goReady = goAcceptedBlockers.length === 0;
  const currentVerdict = goReady ? "GO" : conditionalGoReady ? "CONDITIONAL GO" : "NO-GO";
  const nextTargetVerdict =
    currentVerdict === "NO-GO"
      ? "CONDITIONAL GO"
      : currentVerdict === "CONDITIONAL GO"
        ? "GO"
        : "GO";
  const blockersToNextTarget =
    currentVerdict === "NO-GO"
      ? [...conditionalAcceptedBlockers, ...conditionalAssignmentBlockers]
      : currentVerdict === "CONDITIONAL GO"
        ? goAcceptedBlockers
        : [];

  const transitions = [
    buildTransitionSummary(
      "NO-GO -> CONDITIONAL GO",
      conditionalGoReady,
      conditionalAcceptedBlockers,
      conditionalAssignmentBlockers,
    ),
    buildTransitionSummary("CONDITIONAL GO -> GO", goReady, goAcceptedBlockers, []),
  ];

  const acceptedCount = statusReport.counts ? statusReport.counts.accepted || 0 : 0;
  const totalCount = statusReport.counts ? statusReport.counts.total || 0 : 0;
  const completionPct = totalCount > 0 ? Number(((acceptedCount / totalCount) * 100).toFixed(1)) : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    registerFile: rel(REGISTER_FILE),
    statusReport: rel(STATUS_REPORT_JSON),
    currentVerdict,
    nextTargetVerdict,
    completionPct,
    counts: statusReport.counts || {},
    decisionRules: {
      conditionalGo: {
        requiredAccepted: CONDITIONAL_GO_ACCEPTED,
        requiredAssignedWithSla: CONDITIONAL_GO_ASSIGNED,
      },
      go: {
        requiredAccepted: GO_ACCEPTED,
      },
    },
    transitions,
    blockersToNextTarget,
    items: registerRows.map((row) => {
      const statusItem = statusMap.get(row.referenceId);
      return {
        referenceId: row.referenceId,
        artifact: row.artifact,
        currentStatus: statusItem ? statusItem.status : row.status,
        ownerScope: row.ownerScope,
        namedOwners: row.namedOwners,
        reviewDue: row.reviewDue,
        nextAction: row.nextAction,
      };
    }),
    upstreamIssues: statusReport.issues || [],
    issues,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const mdLines = [
    "# External Legal Evidence Verdict",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- register_file: ${report.registerFile}`,
    `- status_report: ${report.statusReport}`,
    `- current_verdict: ${currentVerdict}`,
    `- next_target_verdict: ${nextTargetVerdict}`,
    `- accepted_completion_pct: ${completionPct}`,
    `- accepted: ${acceptedCount}/${totalCount}`,
    "",
    "## Transition Readiness",
    "",
    "| Transition | Ready | Blockers |",
    "|---|---|---|",
  ];

  for (const transition of transitions) {
    mdLines.push(
      `| ${transition.transition} | ${transition.ready ? "yes" : "no"} | ${transition.blockerCount} |`,
    );
  }

  mdLines.push("", "## Blockers To Next Target", "");
  if (blockersToNextTarget.length === 0) {
    mdLines.push("- none");
  } else {
    mdLines.push(
      "| Reference ID | Artifact | Current status | Owner-scope | Named owners | Reason | Next action |",
      "|---|---|---|---|---|---|---|",
    );
    for (const blocker of blockersToNextTarget) {
      mdLines.push(
        `| ${blocker.referenceId} | ${blocker.artifact} | ${blocker.currentStatus} | ${blocker.ownerScope} | ${blocker.namedOwners} | ${blocker.reason} | ${blocker.nextAction} |`,
      );
    }
  }

  mdLines.push("", "## Full Item Status", "");
  mdLines.push(
    "| Reference ID | Artifact | Current status | Review due | Named owners | Next action |",
    "|---|---|---|---|---|---|",
  );
  for (const item of report.items) {
    mdLines.push(
      `| ${item.referenceId} | ${item.artifact} | ${item.currentStatus} | ${item.reviewDue} | ${item.namedOwners} | ${item.nextAction} |`,
    );
  }

  mdLines.push("", "## Data Integrity Notes", "");
  if ((statusReport.issues || []).length === 0 && issues.length === 0) {
    mdLines.push("- none");
  } else {
    for (const issue of [...(statusReport.issues || []), ...issues]) {
      mdLines.push(`- ${issue.severity || "warning"}: ${issue.type} ${issue.referenceId || ""}`.trim());
    }
  }
  mdLines.push("");
  fs.writeFileSync(REPORT_MD, `${mdLines.join("\n")}\n`);

  console.log(`[legal-evidence-verdict] report_json=${rel(REPORT_JSON)}`);
  console.log(`[legal-evidence-verdict] report_md=${rel(REPORT_MD)}`);
  console.log(`[legal-evidence-verdict] current_verdict=${currentVerdict}`);
  console.log(`[legal-evidence-verdict] next_target_verdict=${nextTargetVerdict}`);
  console.log(`[legal-evidence-verdict] accepted_completion_pct=${completionPct}`);
  console.log(`[legal-evidence-verdict] blockers_to_next_target=${blockersToNextTarget.length}`);

  const errors = [...(statusReport.issues || []), ...issues].filter((issue) => issue.severity === "error");
  process.exit(mode === "enforce" && errors.length > 0 ? 1 : 0);
}

main();

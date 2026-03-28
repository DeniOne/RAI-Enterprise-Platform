#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const STATUS_REPORT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const VERDICT_REPORT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-handoff.json");
const HANDOFF_MD = path.join(OUTPUT_DIR, "external-legal-evidence-handoff.md");
const DRAFT_INDEX = process.env.LEGAL_EVIDENCE_DRAFT_INDEX
  ? path.resolve(process.env.LEGAL_EVIDENCE_DRAFT_INDEX)
  : path.resolve(
      ROOT,
      "..",
      "RAI_EP_RESTRICTED_EVIDENCE",
      "legal-compliance",
      "2026-03-28",
      "drafts",
      "INDEX.md",
    );

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseDraftIndex(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\| (ELP-[^|]+) \| (.+) \|$/);
    if (!match) continue;
    rows.push({
      referenceId: match[1].trim(),
      draftPath: match[2].trim(),
    });
  }
  return rows;
}

function splitOwners(rawOwners) {
  return rawOwners
    .split(",")
    .map((owner) => owner.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function pushOwnerTask(ownerMap, owner, task) {
  if (!ownerMap.has(owner)) {
    ownerMap.set(owner, []);
  }
  ownerMap.get(owner).push(task);
}

function sortByReference(left, right) {
  return left.referenceId.localeCompare(right.referenceId);
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  if (!fs.existsSync(STATUS_REPORT_JSON)) {
    console.error(
      `[legal-evidence-handoff] отсутствует status report: ${rel(STATUS_REPORT_JSON)}; сначала запусти legal-evidence-status`,
    );
    process.exit(1);
  }
  if (!fs.existsSync(VERDICT_REPORT_JSON)) {
    console.error(
      `[legal-evidence-handoff] отсутствует verdict report: ${rel(VERDICT_REPORT_JSON)}; сначала запусти legal-evidence-verdict`,
    );
    process.exit(1);
  }
  if (!fs.existsSync(DRAFT_INDEX)) {
    console.error(
      `[legal-evidence-handoff] отсутствует draft index: ${DRAFT_INDEX}; сначала запусти legal-evidence-prefill`,
    );
    process.exit(1);
  }

  const statusReport = readJson(STATUS_REPORT_JSON);
  const verdictReport = readJson(VERDICT_REPORT_JSON);
  const draftRows = parseDraftIndex(fs.readFileSync(DRAFT_INDEX, "utf8"));
  const draftMap = new Map(draftRows.map((row) => [row.referenceId, row.draftPath]));
  const itemMap = new Map((verdictReport.items || []).map((item) => [item.referenceId, item]));
  const ownerMap = new Map();
  const blockers = (verdictReport.blockersToNextTarget || []).sort(sortByReference);
  const ownerlessTasks = [];

  for (const blocker of blockers) {
    const item = itemMap.get(blocker.referenceId) || {};
    const namedOwners = splitOwners(item.namedOwners || blocker.namedOwners || "");
    const draftPath = draftMap.get(blocker.referenceId) || "";
    const task = {
      referenceId: blocker.referenceId,
      artifact: blocker.artifact,
      reviewDue: item.reviewDue || "",
      currentStatus: blocker.currentStatus,
      reason: blocker.reason,
      nextAction: blocker.nextAction,
      draftPath,
      intakeCommand: `pnpm legal:evidence:intake -- --reference=${blocker.referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm legal:evidence:transition -- --reference=${blocker.referenceId} --status=reviewed`,
      acceptCommand: `pnpm legal:evidence:transition -- --reference=${blocker.referenceId} --status=accepted`,
    };

    if (!draftPath) {
      issues.push({
        severity: "error",
        type: "missing_draft_for_blocker",
        referenceId: blocker.referenceId,
      });
    }

    if (namedOwners.length === 0) {
      ownerlessTasks.push(task);
      issues.push({
        severity: "error",
        type: "missing_named_owners_for_blocker",
        referenceId: blocker.referenceId,
      });
      continue;
    }

    for (const owner of namedOwners) {
      pushOwnerTask(ownerMap, owner, task);
    }
  }

  const ownerQueues = [...ownerMap.entries()]
    .map(([owner, tasks]) => ({
      owner,
      taskCount: tasks.length,
      reviewDueMin: tasks
        .map((task) => task.reviewDue)
        .filter(Boolean)
        .sort()[0] || "",
      references: unique(tasks.map((task) => task.referenceId)).sort(),
      tasks: tasks.sort(sortByReference),
    }))
    .sort((left, right) => left.owner.localeCompare(right.owner));

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    currentVerdict: verdictReport.currentVerdict,
    nextTargetVerdict: verdictReport.nextTargetVerdict,
    blockerCount: blockers.length,
    statusCounts: statusReport.counts || {},
    verdictReport: rel(VERDICT_REPORT_JSON),
    draftIndex: DRAFT_INDEX,
    ownerQueues,
    ownerlessTasks,
    issues,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(HANDOFF_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const mdLines = [
    "# External Legal Evidence Handoff",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- current_verdict: ${report.currentVerdict}`,
    `- next_target_verdict: ${report.nextTargetVerdict}`,
    `- blocker_count: ${report.blockerCount}`,
    `- verdict_report: ${report.verdictReport}`,
    `- draft_index: ${report.draftIndex}`,
    "",
    "## Owner Queues",
    "",
  ];

  if (ownerQueues.length === 0) {
    mdLines.push("- none");
  } else {
    for (const ownerQueue of ownerQueues) {
      mdLines.push(`### ${ownerQueue.owner}`, "");
      mdLines.push(
        `- task_count: ${ownerQueue.taskCount}`,
        `- review_due_min: ${ownerQueue.reviewDueMin || "-"}`,
        `- references: ${ownerQueue.references.join(", ") || "-"}`,
        "",
        "| Reference ID | Artifact | Review due | Draft path | Next action | Intake command |",
        "|---|---|---|---|---|---|",
      );
      for (const task of ownerQueue.tasks) {
        mdLines.push(
          `| ${task.referenceId} | ${task.artifact} | ${task.reviewDue || "-"} | ${task.draftPath || "-"} | ${task.nextAction} | ${task.intakeCommand} |`,
        );
      }
      mdLines.push("");
    }
  }

  mdLines.push("## Issues", "");
  if (issues.length === 0) {
    mdLines.push("- none");
  } else {
    for (const issue of issues) {
      mdLines.push(`- ${issue.severity}: ${issue.type} ${issue.referenceId || ""}`.trim());
    }
  }
  mdLines.push("");
  fs.writeFileSync(HANDOFF_MD, `${mdLines.join("\n")}\n`);

  console.log(`[legal-evidence-handoff] report_json=${rel(HANDOFF_JSON)}`);
  console.log(`[legal-evidence-handoff] report_md=${rel(HANDOFF_MD)}`);
  console.log(`[legal-evidence-handoff] current_verdict=${report.currentVerdict}`);
  console.log(`[legal-evidence-handoff] next_target_verdict=${report.nextTargetVerdict}`);
  console.log(`[legal-evidence-handoff] blocker_count=${report.blockerCount}`);
  console.log(`[legal-evidence-handoff] owner_queues=${ownerQueues.length}`);

  const errors = issues.filter((issue) => issue.severity === "error");
  process.exit(mode === "enforce" && errors.length > 0 ? 1 : 0);
}

main();

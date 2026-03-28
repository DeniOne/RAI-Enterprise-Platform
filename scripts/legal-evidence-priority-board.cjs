#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const VERDICT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-handoff.json");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-priority-board.json");
const OUTPUT_MD = path.join(OUTPUT_DIR, "external-legal-evidence-priority-board.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeOwner(owner) {
  return owner.replace(/`/g, "");
}

function unique(values) {
  return [...new Set(values)];
}

function priorityRank(referenceId) {
  const rankMap = new Map([
    ["ELP-20260328-01", 1],
    ["ELP-20260328-03", 2],
    ["ELP-20260328-04", 3],
    ["ELP-20260328-06", 4],
    ["ELP-20260328-02", 5],
    ["ELP-20260328-05", 6],
    ["ELP-20260328-08", 7],
    ["ELP-20260328-09", 8],
  ]);

  return rankMap.get(referenceId) || 99;
}

function buildOwnerLookup(handoffReport) {
  const lookup = new Map();

  for (const queue of handoffReport.ownerQueues || []) {
    const owner = normalizeOwner(queue.owner);
    for (const task of queue.tasks || []) {
      const entry = lookup.get(task.referenceId) || [];
      entry.push(owner);
      lookup.set(task.referenceId, entry);
    }
  }

  return lookup;
}

function buildBoard(verdictReport, handoffReport) {
  const ownerLookup = buildOwnerLookup(handoffReport);
  const blockers = [...(verdictReport.blockersToNextTarget || [])].sort((left, right) => {
    const rankDiff = priorityRank(left.referenceId) - priorityRank(right.referenceId);
    if (rankDiff !== 0) return rankDiff;
    return left.referenceId.localeCompare(right.referenceId);
  });

  const rows = blockers.map((blocker, index) => {
    const owners = unique(ownerLookup.get(blocker.referenceId) || []).sort();
    return {
      priority: index + 1,
      referenceId: blocker.referenceId,
      artifact: blocker.artifact,
      currentStatus: blocker.currentStatus,
      nextAction: blocker.nextAction,
      reason: blocker.reason,
      namedOwners: owners,
      intakeCommand: `pnpm legal:evidence:intake -- --reference=${blocker.referenceId} --source=/abs/path/file`,
      reviewCommand: `pnpm legal:evidence:transition -- --reference=${blocker.referenceId} --status=reviewed`,
      acceptCommand: `pnpm legal:evidence:transition -- --reference=${blocker.referenceId} --status=accepted`,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    currentVerdict: verdictReport.currentVerdict,
    nextTargetVerdict: verdictReport.nextTargetVerdict,
    blockerCount: rows.length,
    ownerCount: unique(rows.flatMap((row) => row.namedOwners)).length,
    executionRule:
      "Сначала закрывать blockers 01/03/04/06, затем 02/05/08/09; каждый accepted item уменьшает blocker set для перехода NO-GO -> CONDITIONAL GO.",
    rows,
  };
}

function buildMarkdown(board) {
  const lines = [
    "# External Legal Evidence Priority Board",
    "",
    `- generated_at: ${board.generatedAt}`,
    `- current_verdict: ${board.currentVerdict}`,
    `- next_target_verdict: ${board.nextTargetVerdict}`,
    `- blocker_count: ${board.blockerCount}`,
    `- owner_count: ${board.ownerCount}`,
    `- execution_rule: ${board.executionRule}`,
    "",
    "## Priority order",
    "",
    "| Priority | Reference ID | Artifact | Owners | Next action | Intake |",
    "|---:|---|---|---|---|---|",
  ];

  for (const row of board.rows) {
    lines.push(
      `| ${row.priority} | ${row.referenceId} | ${row.artifact} | ${row.namedOwners.join(", ")} | ${row.nextAction} | \`${row.intakeCommand}\` |`,
    );
  }

  lines.push(
    "",
    "## Acceptance path",
    "",
    "1. Выполнить `intake` по приоритету.",
    "2. После owner review выполнить `reviewed`.",
    "3. После sync docs и подтверждения evidence выполнить `accepted`.",
    "4. Пересчитать `pnpm legal:evidence:verdict`, `pnpm legal:evidence:handoff`, `pnpm legal:evidence:owner-packets`, `pnpm legal:evidence:priority-board`.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(VERDICT_JSON)) {
    console.error(`[legal-evidence-priority-board] отсутствует verdict report: ${VERDICT_JSON}`);
    process.exit(1);
  }

  if (!fs.existsSync(HANDOFF_JSON)) {
    console.error(`[legal-evidence-priority-board] отсутствует handoff report: ${HANDOFF_JSON}`);
    process.exit(1);
  }

  const verdictReport = readJson(VERDICT_JSON);
  const handoffReport = readJson(HANDOFF_JSON);
  const board = buildBoard(verdictReport, handoffReport);

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(board, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(board));

  console.log(`[legal-evidence-priority-board] report_json=${OUTPUT_JSON.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-priority-board] report_md=${OUTPUT_MD.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-priority-board] current_verdict=${board.currentVerdict}`);
  console.log(`[legal-evidence-priority-board] next_target_verdict=${board.nextTargetVerdict}`);
  console.log(`[legal-evidence-priority-board] blocker_count=${board.blockerCount}`);
}

main();

#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const STATUS_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-status.json");
const VERDICT_JSON = path.join(OUTPUT_DIR, "external-legal-evidence-verdict.json");
const A1_STATUS_JSON = path.join(OUTPUT_DIR, "phase-a1-status.json");
const FIRST_WAVE_PACKET_JSON = path.join(OUTPUT_DIR, "phase-a1-first-wave-request-packet.json");
const SECOND_WAVE_PACKET_JSON = path.join(OUTPUT_DIR, "phase-a1-second-wave-request-packet.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a1-priority-eight-request-packet.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a1-priority-eight-request-packet.md");

const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const DELIVERY_DIR = path.join(RESTRICTED_ROOT, "request-packets", "PHASE-A1-PRIORITY-EIGHT");
const DELIVERY_FILE = path.join(DELIVERY_DIR, "REQUEST_PACKET.md");

const PRIORITY_EIGHT = new Map([
  [
    "ELP-20260328-01",
    {
      priority: 1,
      title: "Operator identity and role memo",
      wave: "first_wave",
      requiredFields:
        "юрлицо, ОГРН/ИНН, адрес, operator/processor split, owner signature, issue date",
    },
  ],
  [
    "ELP-20260328-03",
    {
      priority: 2,
      title: "Hosting / residency attestation",
      wave: "first_wave",
      requiredFields:
        "provider, country, region, account reference, DB/storage residency, contract or invoice reference",
    },
  ],
  [
    "ELP-20260328-04",
    {
      priority: 3,
      title: "Processor / subprocessor register + DPA pack",
      wave: "first_wave",
      requiredFields:
        "provider list, role split, country, purpose, data categories, contract reference, DPA reference",
    },
  ],
  [
    "ELP-20260328-06",
    {
      priority: 4,
      title: "Lawful basis matrix + privacy notice pack",
      wave: "first_wave",
      requiredFields:
        "lawful basis per flow, consent/no-consent, notice source, linkage to operator and processor perimeter",
    },
  ],
  [
    "ELP-20260328-02",
    {
      priority: 5,
      title: "РКН notification evidence / exemption memo",
      wave: "second_wave",
      requiredFields: "notification number/date или reasoned exemption, scope, owner, дата",
    },
  ],
  [
    "ELP-20260328-05",
    {
      priority: 6,
      title: "Transborder decision log",
      wave: "second_wave",
      requiredFields: "country, categories of data, lawful basis, allow/deny decision, mitigation, owner",
    },
  ],
  [
    "ELP-20260328-08",
    {
      priority: 7,
      title: "Retention / deletion / archive schedule approval",
      wave: "second_wave",
      requiredFields: "retention matrix, deletion triggers, archive rules, legal hold",
    },
  ],
  [
    "ELP-20260328-09",
    {
      priority: 8,
      title: "First-party chain-of-title pack",
      wave: "second_wave",
      requiredFields: "employment/contractor/IP transfer evidence, DB rights, commercial-use sufficiency",
    },
  ],
]);

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }
  return issues.map((issue) => `- ${issue}`).join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const dryRun = process.argv.includes("--dry-run");
  const issues = [];

  const requiredFiles = [
    STATUS_JSON,
    VERDICT_JSON,
    A1_STATUS_JSON,
    FIRST_WAVE_PACKET_JSON,
    SECOND_WAVE_PACKET_JSON,
  ];

  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      issues.push(`missing required file ${filePath}`);
    }
  }

  if (issues.length > 0) {
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    ensureDir(OUTPUT_DIR, dryRun);
    writeJson(REPORT_JSON, report, dryRun);
    writeText(REPORT_MD, ["# Phase A1 Priority Eight Request Packet", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"), dryRun);
    if (mode === "enforce") process.exit(1);
    return;
  }

  const statusReport = readJson(STATUS_JSON);
  const verdictReport = readJson(VERDICT_JSON);
  const a1Status = readJson(A1_STATUS_JSON);
  const firstWavePacket = readJson(FIRST_WAVE_PACKET_JSON);
  const secondWavePacket = readJson(SECOND_WAVE_PACKET_JSON);
  const statusByReference = new Map((statusReport.items || []).map((item) => [item.referenceId, item]));

  const items = Array.from(PRIORITY_EIGHT.entries())
    .map(([referenceId, definition]) => {
      const current = statusByReference.get(referenceId);
      if (!current) {
        issues.push(`missing status row for ${referenceId}`);
      }

      const draftPath =
        definition.wave === "first_wave"
          ? (firstWavePacket.items || []).find((item) => item.referenceId === referenceId)?.draftPath
          : (secondWavePacket.items || []).find((item) => item.referenceId === referenceId)?.draftPath;

      if (!draftPath) {
        issues.push(`missing draft path for ${referenceId}`);
      }

      return {
        priority: definition.priority,
        referenceId,
        title: definition.title,
        wave: definition.wave,
        status: current?.status || "missing",
        namedOwners: current?.namedOwners || "-",
        reviewDue: current?.reviewDue || "-",
        draftPath: draftPath || "",
        requiredFields: definition.requiredFields,
        intakeCommand: `pnpm legal:evidence:intake -- --reference=${referenceId} --source=/abs/path/file`,
        reviewCommand: `pnpm legal:evidence:transition -- --reference=${referenceId} --status=reviewed`,
        acceptCommand: `pnpm legal:evidence:transition -- --reference=${referenceId} --status=accepted`,
      };
    })
    .sort((left, right) => left.priority - right.priority);

  const counts = {
    requested: items.filter((item) => item.status === "requested").length,
    received: items.filter((item) => item.status === "received").length,
    reviewed: items.filter((item) => item.status === "reviewed").length,
    accepted: items.filter((item) => item.status === "accepted").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    sourceStatus: rel(STATUS_JSON),
    sourceVerdict: rel(VERDICT_JSON),
    sourceA1Status: rel(A1_STATUS_JSON),
    currentLegalVerdict: verdictReport.currentVerdict,
    nextTargetVerdict: verdictReport.nextTargetVerdict,
    currentState: a1Status.currentState,
    tier1State: a1Status.tier1State,
    firstWaveState: a1Status.firstWave?.state || "unknown",
    secondWaveState: a1Status.secondWave?.state || "unknown",
    totalItems: items.length,
    counts,
    blockersToNextTarget: (verdictReport.blockersToNextTarget || []).map((blocker) =>
      blocker.referenceId ? blocker.referenceId : String(blocker),
    ),
    items,
    issues,
  };

  const md = [
    "# Phase A1 Priority Eight Request Packet",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- source_status: \`${report.sourceStatus}\``,
    `- source_verdict: \`${report.sourceVerdict}\``,
    `- source_a1_status: \`${report.sourceA1Status}\``,
    `- current_legal_verdict: \`${report.currentLegalVerdict}\``,
    `- next_target_verdict: \`${report.nextTargetVerdict}\``,
    `- current_state: \`${report.currentState}\``,
    `- tier1_state: \`${report.tier1State}\``,
    `- first_wave_state: \`${report.firstWaveState}\``,
    `- second_wave_state: \`${report.secondWaveState}\``,
    `- total_items: \`${report.totalItems}\``,
    `- requested: \`${report.counts.requested}\``,
    `- received: \`${report.counts.received}\``,
    `- reviewed: \`${report.counts.reviewed}\``,
    `- accepted: \`${report.counts.accepted}\``,
    "",
    "## Priority Eight",
    "",
    "| Priority | Reference | Wave | Status | Owners | Review due | Draft |",
    "|---:|---|---|---|---|---|---|",
    ...items.map(
      (item) =>
        `| ${item.priority} | \`${item.referenceId}\` | \`${item.wave}\` | \`${item.status}\` | ${item.namedOwners} | \`${item.reviewDue}\` | \`${item.draftPath}\` |`,
    ),
    "",
    "## Правило исполнения",
    "",
    "- первую волну `ELP-01 / 03 / 04 / 06` двигать раньше второй",
    "- вторую волну `ELP-02 / 05 / 08 / 09` открывать только после реального движения по первой",
    "- не считать non-priority tail прогрессом этого packet-слоя",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  const restricted = [
    "# PHASE A1 Priority Eight Request Packet",
    "",
    `- generated_at: ${report.generatedAt}`,
    `- current_legal_verdict: ${report.currentLegalVerdict}`,
    `- next_target_verdict: ${report.nextTargetVerdict}`,
    `- current_state: ${report.currentState}`,
    `- tier1_state: ${report.tier1State}`,
    `- first_wave_state: ${report.firstWaveState}`,
    `- second_wave_state: ${report.secondWaveState}`,
    "",
    "## Что входит в critical priority-eight",
    "",
    ...items.map((item) => `- \`${item.referenceId}\` — ${item.title}`),
    "",
    "## Packet Rows",
    "",
    "| Priority | Reference | Wave | Current status | Named owners | Draft path | Required fields |",
    "|---:|---|---|---|---|---|---|",
    ...items.map(
      (item) =>
        `| ${item.priority} | ${item.referenceId} | ${item.wave} | ${item.status} | ${item.namedOwners} | ${item.draftPath} | ${item.requiredFields} |`,
    ),
    "",
    "## Execution Rule",
    "",
    "- Идти строго сверху вниз.",
    "- Сначала закрывать первую волну `ELP-01 / 03 / 04 / 06`.",
    "- Только после этого поднимать `ELP-02 / 05 / 08 / 09`.",
    "",
    "## Intake Commands",
    "",
    "```bash",
    "pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=reviewed",
    "pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=accepted",
    "pnpm legal:evidence:verdict",
    "pnpm phase:a1:status",
    "```",
    "",
  ].join("\n");

  ensureDir(OUTPUT_DIR, dryRun);
  ensureDir(DELIVERY_DIR, dryRun);
  writeJson(REPORT_JSON, report, dryRun);
  writeText(REPORT_MD, md, dryRun);
  writeText(DELIVERY_FILE, `${restricted}\n`, dryRun);

  console.log("[phase-a1-priority-eight-request-packet] summary");
  console.log(`- total_items=${report.totalItems}`);
  console.log(`- requested=${report.counts.requested}`);
  console.log(`- received=${report.counts.received}`);
  console.log(`- reviewed=${report.counts.reviewed}`);
  console.log(`- accepted=${report.counts.accepted}`);
  console.log(`- current_state=${report.currentState}`);
  console.log(`- tier1_state=${report.tier1State}`);
  console.log(`- issues=${report.issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);
  console.log(`- delivery_file=${DELIVERY_FILE}`);

  if (mode === "enforce" && report.issues.length > 0) {
    process.exit(1);
  }
}

main();

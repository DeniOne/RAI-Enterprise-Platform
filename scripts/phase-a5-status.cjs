#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "compliance");
const REPORT_JSON = path.join(OUTPUT_DIR, "phase-a5-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "phase-a5-status.md");

const LICENSE_INVENTORY_JSON = path.join(ROOT, "var", "security", "license-inventory.json");
const NOTICE_BUNDLE_JSON = path.join(ROOT, "var", "security", "notice-bundle.json");
const SOURCE_REGISTER_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-source-register.json");
const COLLECTION_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-collection.json");
const HANDOFF_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-handoff.json");
const REQUEST_PACKET_JSON = path.join(OUTPUT_DIR, "phase-a5-chain-of-title-request-packet.json");

const ROOT_PACKAGE_JSON = path.join(ROOT, "package.json");
const ESLINT_PLUGIN_PACKAGE_JSON = path.join(
  ROOT,
  "packages",
  "eslint-plugin-tenant-security",
  "package.json",
);
const TRIAGE_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md",
);
const TIER1_DECISION_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md",
);
const NOTICE_PACKET_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md",
);
const FIRST_PARTY_STRATEGY_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md",
);
const PROCUREMENT_DECISION_DOC = path.join(
  ROOT,
  "docs",
  "07_EXECUTION",
  "ONE_BIG_PHASE",
  "PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md",
);
const OSS_REGISTER_DOC = path.join(ROOT, "docs", "05_OPERATIONS", "OSS_LICENSE_AND_IP_REGISTER.md");

const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const ELP09_METADATA_FILE = path.join(
  RESTRICTED_ROOT,
  "metadata",
  "ELP-20260328-09-first-party-chain-of-title-pack.md",
);
const OWNER_PACKETS_INDEX = path.join(RESTRICTED_ROOT, "chain-of-title-owner-packets", "INDEX.md");
const DELIVERY_PACKET_FILE = path.join(
  RESTRICTED_ROOT,
  "request-packets",
  "ELP-20260328-09",
  "REQUEST_PACKET.md",
);

const ALLOWED_STATUSES = new Set(["requested", "received", "reviewed", "accepted", "expired"]);

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPackageJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseMetadataFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const fields = {};

  for (const line of lines) {
    const match = line.match(/^- `?([^`:]+)`?: `?(.+?)`?$/);
    if (!match) continue;
    fields[match[1].trim()] = match[2].trim();
  }

  return fields;
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }

  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      if (issue.fields && issue.fields.length > 0) parts.push(`fields=\`${issue.fields.join(", ")}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function renderTrackRows(tracks) {
  return tracks
    .map(
      (track) =>
        `| \`${track.id}\` | ${track.label} | \`${track.state}\` | ${track.evidence} | ${track.nextAction} |`,
    )
    .join("\n");
}

function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const today = new Date().toISOString().slice(0, 10);
  const issues = [];

  const requiredFiles = [
    LICENSE_INVENTORY_JSON,
    NOTICE_BUNDLE_JSON,
    SOURCE_REGISTER_JSON,
    COLLECTION_JSON,
    HANDOFF_JSON,
    REQUEST_PACKET_JSON,
    ROOT_PACKAGE_JSON,
    ESLINT_PLUGIN_PACKAGE_JSON,
    TRIAGE_DOC,
    TIER1_DECISION_DOC,
    NOTICE_PACKET_DOC,
    FIRST_PARTY_STRATEGY_DOC,
    PROCUREMENT_DECISION_DOC,
    OSS_REGISTER_DOC,
    ELP09_METADATA_FILE,
    OWNER_PACKETS_INDEX,
    DELIVERY_PACKET_FILE,
  ];

  for (const filePath of requiredFiles) {
    if (!fileExists(filePath)) {
      issues.push({ type: "missing_required_file", file: rel(filePath) });
    }
  }

  if (issues.some((issue) => issue.type === "missing_required_file")) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      mode,
      issues,
    };
    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
    fs.writeFileSync(
      REPORT_MD,
      ["# Phase A5 Status", "", "## Issues", "", renderIssuesMarkdown(issues), ""].join("\n"),
    );
    console.error("[phase-a5-status] missing required inputs");
    if (mode === "enforce") process.exit(1);
    process.exit(0);
  }

  const inventory = readJson(LICENSE_INVENTORY_JSON);
  const noticeBundle = readJson(NOTICE_BUNDLE_JSON);
  const sourceRegister = readJson(SOURCE_REGISTER_JSON);
  const collectionReport = readJson(COLLECTION_JSON);
  const handoffReport = readJson(HANDOFF_JSON);
  const requestPacket = readJson(REQUEST_PACKET_JSON);
  const rootPackage = readPackageJson(ROOT_PACKAGE_JSON);
  const eslintPluginPackage = readPackageJson(ESLINT_PLUGIN_PACKAGE_JSON);
  const metadata = parseMetadataFile(ELP09_METADATA_FILE);

  const externalStatus = metadata.status || "";
  const reviewDue = metadata.review_due || "";

  if (!ALLOWED_STATUSES.has(externalStatus)) {
    issues.push({ type: "invalid_external_status", file: rel(ELP09_METADATA_FILE), value: externalStatus || "<empty>" });
  }
  if (!isValidDate(reviewDue)) {
    issues.push({ type: "invalid_review_due", file: rel(ELP09_METADATA_FILE), value: reviewDue || "<empty>" });
  }
  if (
    isValidDate(reviewDue) &&
    reviewDue < today &&
    externalStatus !== "accepted" &&
    externalStatus !== "expired"
  ) {
    issues.push({ type: "overdue_review", file: rel(ELP09_METADATA_FILE), value: reviewDue });
  }
  if (rootPackage.license !== "UNLICENSED") {
    issues.push({ type: "unexpected_root_license", file: rel(ROOT_PACKAGE_JSON), value: rootPackage.license || "<empty>" });
  }
  if (eslintPluginPackage.license !== "UNLICENSED") {
    issues.push({
      type: "unexpected_first_party_package_license",
      file: rel(ESLINT_PLUGIN_PACKAGE_JSON),
      value: eslintPluginPackage.license || "<empty>",
    });
  }

  const a51Done =
    inventory.unknownLicenseCount >= 0 &&
    fileExists(TRIAGE_DOC) &&
    fileExists(TIER1_DECISION_DOC) &&
    fileExists(OSS_REGISTER_DOC);
  const a52Done = Array.isArray(noticeBundle.families) && noticeBundle.families.length > 0 && fileExists(NOTICE_PACKET_DOC);
  const a53RepoSideDone =
    sourceRegister.counts &&
    collectionReport.counts &&
    Array.isArray(handoffReport.ownerQueues) &&
    Array.isArray(requestPacket.ownerQueues) &&
    fileExists(OWNER_PACKETS_INDEX) &&
    fileExists(DELIVERY_PACKET_FILE);
  const a54Done =
    fileExists(FIRST_PARTY_STRATEGY_DOC) &&
    fileExists(PROCUREMENT_DECISION_DOC) &&
    rootPackage.license === "UNLICENSED" &&
    eslintPluginPackage.license === "UNLICENSED";

  const repoSideComplete = a51Done && a52Done && a53RepoSideDone && a54Done;
  const currentState =
    externalStatus === "accepted"
      ? "closed"
      : repoSideComplete
        ? "external_blocked"
        : "repo_side_incomplete";
  const tier1State =
    externalStatus === "accepted"
      ? "ready"
      : repoSideComplete
        ? "conditional_ready_pending_elp09"
        : "not_ready";
  const guardState = externalStatus === "accepted" ? "can_review_guard" : "guard_active";

  const tracks = [
    {
      id: "A5.1",
      label: "unknown license triage",
      state: a51Done ? "done_for_tier1" : "incomplete",
      evidence: `inventory_unknown=${inventory.unknownLicenseCount}; triage_register=${fileExists(TRIAGE_DOC) ? "yes" : "no"}; tier1_decision=${fileExists(TIER1_DECISION_DOC) ? "yes" : "no"}`,
      nextAction:
        "удерживать Tier 1 classification и пересматривать только при выходе за Linux self-host perimeter",
    },
    {
      id: "A5.2",
      label: "notice obligations",
      state: a52Done ? "assembled_for_tier1" : "incomplete",
      evidence: `families=${Array.isArray(noticeBundle.families) ? noticeBundle.families.length : 0}; conditional_unknowns=${Array.isArray(noticeBundle.conditionalUnknowns) ? noticeBundle.conditionalUnknowns.length : 0}`,
      nextAction:
        "держать notice bundle синхронизированным с inventory и не считать его заменой external IP evidence",
    },
    {
      id: "A5.3-repo",
      label: "chain-of-title repo-side perimeter",
      state: a53RepoSideDone ? "complete" : "incomplete",
      evidence: `assets=${sourceRegister.counts?.totalAssets || 0}; owner_queues=${Array.isArray(requestPacket.ownerQueues) ? requestPacket.ownerQueues.length : 0}; delivery_packet=${fileExists(DELIVERY_PACKET_FILE) ? "yes" : "no"}`,
      nextAction:
        "удерживать source->collection->handoff->owner packets->request->delivery chain без drift",
    },
    {
      id: "A5.3-external",
      label: "chain-of-title external evidence",
      state: externalStatus || "missing",
      evidence: `reference=ELP-20260328-09; review_due=${reviewDue || "-"}`,
      nextAction:
        externalStatus === "accepted"
          ? "синхронизировать board и снять guard review для A5"
          : "собрать signed employment/contractor/DB-rights evidence и провести intake -> reviewed -> accepted",
    },
    {
      id: "A5.4",
      label: "first-party licensing strategy",
      state: a54Done ? "done_for_tier1" : "incomplete",
      evidence: `root_license=${rootPackage.license || "-"}; eslint_plugin_license=${eslintPluginPackage.license || "-"}`,
      nextAction:
        "удерживать private/internal Tier 1 baseline и не трактовать его как public redistribution permission",
    },
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    inputs: {
      licenseInventory: rel(LICENSE_INVENTORY_JSON),
      noticeBundle: rel(NOTICE_BUNDLE_JSON),
      sourceRegister: rel(SOURCE_REGISTER_JSON),
      collectionReport: rel(COLLECTION_JSON),
      handoffReport: rel(HANDOFF_JSON),
      requestPacket: rel(REQUEST_PACKET_JSON),
      externalMetadata: ELP09_METADATA_FILE.replace(/\\/g, "/"),
      restrictedOwnerIndex: OWNER_PACKETS_INDEX.replace(/\\/g, "/"),
      restrictedDeliveryPacket: DELIVERY_PACKET_FILE.replace(/\\/g, "/"),
    },
    summary: {
      totalPackages: inventory.totalPackages,
      unknownLicenseCount: inventory.unknownLicenseCount,
      totalAssets: sourceRegister.counts?.totalAssets || 0,
      evidenceClasses: collectionReport.counts?.evidenceClasses || 0,
      ownerQueues: Array.isArray(requestPacket.ownerQueues) ? requestPacket.ownerQueues.length : 0,
      externalStatus,
      reviewDue,
      repoSideComplete,
      currentState,
      tier1State,
      guardState,
    },
    tracks,
    issues,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    "# Phase A5 Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- total_packages: \`${report.summary.totalPackages}\``,
    `- unknown_license_count: \`${report.summary.unknownLicenseCount}\``,
    `- total_assets: \`${report.summary.totalAssets}\``,
    `- owner_queues: \`${report.summary.ownerQueues}\``,
    `- external_status: \`${report.summary.externalStatus || "missing"}\``,
    `- review_due: \`${report.summary.reviewDue || "-"}\``,
    `- repo_side_complete: \`${report.summary.repoSideComplete}\``,
    `- current_state: \`${report.summary.currentState}\``,
    `- tier1_state: \`${report.summary.tier1State}\``,
    `- guard_state: \`${report.summary.guardState}\``,
    "",
    "## Track Status",
    "",
    "| Track | Scope | State | Evidence | Next action |",
    "|---|---|---|---|---|",
    renderTrackRows(tracks),
    "",
    "## Decision",
    "",
    report.summary.currentState === "external_blocked"
      ? "- Repo-side контур `A5` собран достаточно для `Tier 1`, но полный closeout всё ещё заблокирован внешним `ELP-20260328-09`."
      : "- Repo-side и external state не показывают внешней блокировки `A5`.",
    report.summary.guardState === "guard_active"
      ? "- `A-2.6.3` должен оставаться активным до acceptance `ELP-20260328-09`."
      : "- `A-2.6.3` можно пересматривать, потому что `ELP-20260328-09` уже accepted.",
    "",
    "## Issues",
    "",
    renderIssuesMarkdown(issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[phase-a5-status] summary");
  console.log(`- total_packages=${report.summary.totalPackages}`);
  console.log(`- unknown_license_count=${report.summary.unknownLicenseCount}`);
  console.log(`- total_assets=${report.summary.totalAssets}`);
  console.log(`- owner_queues=${report.summary.ownerQueues}`);
  console.log(`- external_status=${report.summary.externalStatus || "missing"}`);
  console.log(`- current_state=${report.summary.currentState}`);
  console.log(`- tier1_state=${report.summary.tier1State}`);
  console.log(`- guard_state=${report.summary.guardState}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && issues.length > 0) {
    process.exit(1);
  }
}

main();

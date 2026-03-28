#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const REPORT_FILE = path.join(OUTPUT_DIR, "secret-scan-report.json");
const MAX_FILE_SIZE = 1024 * 1024;
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".turbo",
  "generated-client",
  "var",
]);

const CONTENT_PATTERNS = [
  {
    id: "private-key-header",
    regex: /-----BEGIN(?: RSA| EC| OPENSSH| DSA)? PRIVATE KEY-----/,
    severity: "critical",
  },
  {
    id: "github-token",
    regex: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{40,})\b/,
    severity: "critical",
  },
  {
    id: "telegram-bot-token",
    regex: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/,
    severity: "critical",
  },
  {
    id: "openai-style-secret",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/,
    severity: "critical",
  },
  {
    id: "dadata-key",
    regex: /DADATA_(?:API|SECRET)_KEY\s*=\s*"?[a-f0-9]{20,64}"?/i,
    severity: "critical",
  },
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function isExamplePath(file) {
  const base = path.basename(file).toLowerCase();
  return (
    base.includes(".example") ||
    base.includes(".sample") ||
    base === "readme.md" ||
    base === ".gitignore"
  );
}

function isSensitiveFilename(file) {
  const base = path.basename(file).toLowerCase();
  if (base === ".env" || base.startsWith(".env.")) return true;
  if (/\.(pem|key|p12|pfx)$/i.test(base)) return true;
  if (base === "id_rsa" || base === "id_dsa" || base === "id_ecdsa") return true;
  return false;
}

function listTrackedFiles() {
  const git = process.platform === "win32" ? "git.exe" : "git";
  const res = spawnSync(git, ["ls-files", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(`git ls-files failed: ${res.stderr || res.stdout || "unknown error"}`);
  }
  return (res.stdout || "")
    .split("\u0000")
    .filter(Boolean)
    .map((file) => path.join(ROOT, file));
}

function walkWorkspace(dir, findings = []) {
  if (!fs.existsSync(dir)) return findings;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(name)) continue;
      walkWorkspace(full, findings);
      continue;
    }
    if (!stat.isFile()) continue;
    if (!isSensitiveFilename(full)) continue;
    findings.push(full);
  }
  return findings;
}

function scanContent(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_FILE_SIZE) {
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  const findings = [];
  for (const pattern of CONTENT_PATTERNS) {
    if (!pattern.regex.test(content)) continue;
    findings.push({
      type: "content",
      id: pattern.id,
      severity: pattern.severity,
      file: rel(filePath),
    });
  }
  return findings;
}

function pushFilenameFinding(target, kind, filePath, severity) {
  target.push({
    type: "filename",
    id: kind,
    severity,
    file: rel(filePath),
  });
}

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    trackedFindings: [],
    workspaceLocalFindings: [],
  };

  const trackedFiles = listTrackedFiles();
  const trackedFileSet = new Set(trackedFiles.map((file) => path.resolve(file)));

  for (const filePath of trackedFiles) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;
    if (isSensitiveFilename(filePath) && !isExamplePath(filePath)) {
      pushFilenameFinding(report.trackedFindings, "tracked-sensitive-filename", filePath, "critical");
    }
    report.trackedFindings.push(...scanContent(filePath));
  }

  const localCandidates = walkWorkspace(ROOT).filter(
    (filePath) => !trackedFileSet.has(path.resolve(filePath)),
  );
  for (const filePath of localCandidates) {
    if (!isExamplePath(filePath)) {
      pushFilenameFinding(report.workspaceLocalFindings, "local-sensitive-filename", filePath, "warning");
    }
    report.workspaceLocalFindings.push(...scanContent(filePath));
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

  const trackedCritical = report.trackedFindings.filter(
    (finding) => finding.severity === "critical",
  );
  const localWarnings = report.workspaceLocalFindings;

  console.log("[scan-secrets] report=" + path.relative(ROOT, REPORT_FILE).replace(/\\/g, "/"));
  console.log(`[scan-secrets] tracked_findings=${report.trackedFindings.length}`);
  console.log(`[scan-secrets] tracked_critical=${trackedCritical.length}`);
  console.log(`[scan-secrets] workspace_local_findings=${localWarnings.length}`);
  for (const finding of localWarnings.slice(0, 10)) {
    console.log(`- local ${finding.type} ${finding.id} ${finding.file}`);
  }
  for (const finding of trackedCritical) {
    console.log(`- tracked ${finding.type} ${finding.id} ${finding.file}`);
  }

  process.exit(trackedCritical.length > 0 ? 1 : 0);
}

main();

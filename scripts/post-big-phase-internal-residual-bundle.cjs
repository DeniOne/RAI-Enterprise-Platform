#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const BUNDLE_DIR = path.join(SECURITY_DIR, "post-big-phase-internal-residual-bundle");

const ARTIFACTS = [
  "post-big-phase-internal-residual-status.json",
  "post-big-phase-internal-residual-status.md",
  "post-big-phase-internal-residual-reconcile.json",
  "post-big-phase-internal-residual-reconcile.md",
  "post-big-phase-internal-residual-run-card.json",
  "post-big-phase-internal-residual-run-card.md",
  "post-big-phase-internal-residual-pr-template.json",
  "post-big-phase-internal-residual-pr-template.md",
  "post-big-phase-internal-residual-handoff-index.json",
  "post-big-phase-internal-residual-handoff-index.md",
  "post-big-phase-internal-residual-commands.template.sh",
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function assertExists(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[post-big-phase-internal-residual-bundle] missing ${rel(filePath)}; run pnpm security:post-big-phase:prepare first`);
    process.exit(1);
  }
}

function main() {
  const sourcePaths = ARTIFACTS.map((name) => path.join(SECURITY_DIR, name));
  sourcePaths.forEach(assertExists);

  fs.mkdirSync(BUNDLE_DIR, { recursive: true });

  for (const sourcePath of sourcePaths) {
    const targetPath = path.join(BUNDLE_DIR, path.basename(sourcePath));
    fs.copyFileSync(sourcePath, targetPath);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    track: "POST_BIG_PHASE_INTERNAL_RESIDUAL",
    bundleDir: rel(BUNDLE_DIR),
    artifacts: ARTIFACTS.map((name) => ({
      file: name,
      path: rel(path.join(BUNDLE_DIR, name)),
    })),
  };

  fs.writeFileSync(path.join(BUNDLE_DIR, "MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const readme = [
    "# Post Big Phase Internal Residual Bundle",
    "",
    `- generated_at: \`${manifest.generatedAt}\``,
    `- bundle_dir: \`${manifest.bundleDir}\``,
    "",
    "## Contents",
    "",
    ...manifest.artifacts.map((item) => `- \`${item.file}\``),
    "",
    "## Primary Entry",
    "",
    "- Start from `post-big-phase-internal-residual-handoff-index.md`.",
    "- Use `post-big-phase-internal-residual-run-card.md` for operator flow.",
    "- Use `post-big-phase-internal-residual-pr-template.md` for the first security-relevant PR.",
    "- Use `post-big-phase-internal-residual-commands.template.sh` as shell template after setting `PR_NUMBER`.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(BUNDLE_DIR, "README.md"), `${readme}\n`);

  console.log("[post-big-phase-internal-residual-bundle] summary");
  console.log(`- bundle_dir=${rel(BUNDLE_DIR)}`);
  console.log(`- manifest=${rel(path.join(BUNDLE_DIR, "MANIFEST.json"))}`);
  console.log(`- readme=${rel(path.join(BUNDLE_DIR, "README.md"))}`);
}

main();

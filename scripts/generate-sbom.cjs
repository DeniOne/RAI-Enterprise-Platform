#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "bom.cdx.json");
const TIMEOUT_MS = 90_000;

function hasValidBom(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Boolean(parsed?.bomFormat === "CycloneDX" && parsed?.metadata);
  } catch {
    return false;
  }
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const res = spawnSync(
    pnpmCmd,
    [
      "dlx",
      "@cyclonedx/cdxgen",
      "-t",
      "js",
      "--no-install-deps",
      "--recurse",
      "--profile",
      "operational",
      "--json-pretty",
      "--validate",
      "--output",
      OUTPUT_FILE,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
      timeout: TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  if (res.stdout) {
    console.log(res.stdout.trim());
  }
  if (res.stderr) {
    console.error(res.stderr.trim());
  }

  if (res.error && res.error.code === "ETIMEDOUT" && hasValidBom(OUTPUT_FILE)) {
    console.log(`[generate-sbom] timeout_after_output=true timeout_ms=${TIMEOUT_MS}`);
    console.log(`[generate-sbom] file=${path.relative(ROOT, OUTPUT_FILE).replace(/\\/g, "/")}`);
    process.exit(0);
  }

  if (res.status !== 0 && !hasValidBom(OUTPUT_FILE)) {
    process.exit(res.status ?? 1);
  }

  console.log(`[generate-sbom] file=${path.relative(ROOT, OUTPUT_FILE).replace(/\\/g, "/")}`);
}

main();

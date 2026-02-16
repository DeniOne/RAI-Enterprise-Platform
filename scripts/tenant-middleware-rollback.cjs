#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const modeArg = process.argv.find((a) => a.startsWith("--mode="));
const fileArg = process.argv.find((a) => a.startsWith("--target-file="));

const mode = (modeArg ? modeArg.split("=")[1] : "shadow").toLowerCase();
const envFile = fileArg ? fileArg.split("=")[1] : ".env";
const envPath = path.isAbsolute(envFile) ? envFile : path.join(ROOT, envFile);

if (!["off", "shadow", "enforce"].includes(mode)) {
  console.error(`[tenant-rollback] invalid mode=${mode}. allowed: off|shadow|enforce`);
  process.exit(1);
}

function upsertLine(content, key, value) {
  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  const next = `${key}=${value}`;
  if (idx >= 0) {
    lines[idx] = next;
  } else {
    lines.push(next);
  }
  return lines.join("\n");
}

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf-8");
}

content = upsertLine(content, "TENANT_MIDDLEWARE_MODE", mode);
if (mode !== "enforce") {
  content = upsertLine(content, "TENANT_ENFORCE_COHORT", "");
}

fs.writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf-8");
console.log(`[tenant-rollback] updated ${path.relative(ROOT, envPath)}: TENANT_MIDDLEWARE_MODE=${mode}`);
if (mode !== "enforce") {
  console.log("[tenant-rollback] TENANT_ENFORCE_COHORT cleared");
}

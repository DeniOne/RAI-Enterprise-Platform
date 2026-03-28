#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const WORKDIR = path.join(ROOT, "packages", "prisma-client");
const DEFAULT_SCHEMA = "schema.prisma";
const OUTPUT_DIR = path.join(ROOT, "var", "schema");
const DEFAULT_DATABASE_URL =
  "postgresql://prisma:prisma@localhost:5432/rai_ep?schema=public";

function argValue(name, fallback) {
  const hit = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
}

function main() {
  const schema = argValue("--schema", DEFAULT_SCHEMA);
  const outputFile = path.join(OUTPUT_DIR, "prisma-validate-safe.json");
  const env = { ...process.env };
  const databaseUrlSource = env.DATABASE_URL ? "environment" : "placeholder";

  if (!env.DATABASE_URL) {
    env.DATABASE_URL = DEFAULT_DATABASE_URL;
  }
  env.PRISMA_HIDE_UPDATE_MESSAGE = env.PRISMA_HIDE_UPDATE_MESSAGE || "1";

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const startedAt = new Date().toISOString();
  const res = spawnSync(
    pnpmCmd,
    ["exec", "prisma", "validate", "--schema", schema],
    {
      cwd: WORKDIR,
      env,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  const finishedAt = new Date().toISOString();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const report = {
    startedAt,
    finishedAt,
    cwd: path.relative(ROOT, WORKDIR).replace(/\\/g, "/"),
    schema,
    databaseUrlSource,
    exitCode: res.status ?? 1,
    stdout: (res.stdout || "").trim(),
    stderr: (res.stderr || "").trim(),
  };
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`[prisma-validate-safe] schema=${schema}`);
  console.log(`[prisma-validate-safe] database_url_source=${databaseUrlSource}`);
  console.log(`[prisma-validate-safe] report=${path.relative(ROOT, outputFile).replace(/\\/g, "/")}`);
  if (report.stdout) {
    console.log(report.stdout);
  }
  if (report.stderr) {
    console.error(report.stderr);
  }

  process.exit(res.status ?? 1);
}

main();

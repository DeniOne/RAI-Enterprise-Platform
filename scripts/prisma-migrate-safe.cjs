#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "..");
const WORKDIR = path.join(ROOT, "packages", "prisma-client");
const OUTPUT_DIR = path.join(ROOT, "var", "schema");
const ENV_PATH = path.join(ROOT, ".env");

function main() {
  const env = { ...process.env };
  const envLoadedFrom = [];

  if (fs.existsSync(ENV_PATH)) {
    const res = dotenv.config({ path: ENV_PATH, processEnv: env });
    if (!res.error) {
      envLoadedFrom.push(path.relative(ROOT, ENV_PATH).replace(/\\/g, "/"));
    }
  }

  env.PRISMA_HIDE_UPDATE_MESSAGE = env.PRISMA_HIDE_UPDATE_MESSAGE || "1";

  if (!env.DATABASE_URL) {
    console.error("[prisma-migrate-safe] DATABASE_URL is required");
    process.exit(1);
  }

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const startedAt = new Date().toISOString();
  const res = spawnSync(
    pnpmCmd,
    ["--dir", WORKDIR, "exec", "prisma", "migrate", "deploy"],
    {
      cwd: ROOT,
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
    envLoadedFrom,
    databaseUrlSource: process.env.DATABASE_URL ? "environment" : ".env",
    exitCode: res.status ?? 1,
    stdout: (res.stdout || "").trim(),
    stderr: (res.stderr || "").trim(),
  };
  const outputFile = path.join(OUTPUT_DIR, "prisma-migrate-safe.json");
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `[prisma-migrate-safe] report=${path.relative(ROOT, outputFile).replace(/\\/g, "/")}`,
  );
  if (report.stdout) {
    console.log(report.stdout);
  }
  if (report.stderr) {
    console.error(report.stderr);
  }

  process.exit(res.status ?? 1);
}

main();

#!/usr/bin/env node

import { spawn } from "child_process";

function run(command, args, allowedCodes = [0]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (allowedCodes.includes(code ?? 1)) resolve(code ?? 0);
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  await run("pnpm", ["run", "monitor:advisory:s3:collect"]);
  await run("pnpm", ["run", "monitor:advisory:s3:summarize"]);
  // `gate:advisory:s4:evaluate` returns code 2 for expected NO-GO during incomplete monitoring window.
  const gateCode = await run("pnpm", ["run", "gate:advisory:s4:evaluate"], [0, 2]);
  console.log(`[advisory-s3-monitoring-cycle] completed, gate exit code=${gateCode}`);
}

main().catch((err) => {
  console.error(`[advisory-s3-monitoring-cycle] ${err.message}`);
  process.exit(1);
});

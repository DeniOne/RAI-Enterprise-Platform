#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "architecture-budgets.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=enforce") ? "enforce" : "warn";

function resolveRepoPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (content.length === 0) {
    return 0;
  }
  if (content.endsWith("\n")) {
    return content.slice(0, -1).split("\n").length;
  }
  return content.split("\n").length;
}

function listModuleDirectories(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function walkTsFiles(dirPath) {
  const collected = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".ts")) {
      collected.push(fullPath);
    }
  }
  return collected;
}

function readModuleStats(modulesRoot) {
  const stats = [];
  for (const moduleName of listModuleDirectories(modulesRoot)) {
    const moduleDir = path.join(modulesRoot, moduleName);
    const files = walkTsFiles(moduleDir);
    let lines = 0;
    for (const file of files) {
      lines += countLines(file);
    }
    stats.push({
      name: moduleName,
      files: files.length,
      lines,
    });
  }
  return stats.sort((left, right) => {
    if (right.lines !== left.lines) {
      return right.lines - left.lines;
    }
    return right.files - left.files;
  });
}

function pushFinding(target, severity, message) {
  target.push({ severity, message });
}

function evaluateThreshold({
  findings,
  label,
  actual,
  warn,
  max,
  units,
  owner,
}) {
  const ownerSuffix = owner ? `, owner=${owner}` : "";
  if (typeof max === "number" && actual > max) {
    pushFinding(
      findings.failures,
      "FAIL",
      `${label}: ${actual}${units} > ${max}${units}${ownerSuffix}`,
    );
    return;
  }

  if (typeof warn === "number" && actual >= warn) {
    pushFinding(
      findings.warnings,
      "WARN",
      `${label}: ${actual}${units} >= ${warn}${units}${ownerSuffix}`,
    );
  }
}

function main() {
  const findings = {
    warnings: [],
    failures: [],
  };

  const schemaPath = resolveRepoPath(config.schemaPrisma.path);
  const schemaLines = countLines(schemaPath);
  evaluateThreshold({
    findings,
    label: `schema.prisma lines`,
    actual: schemaLines,
    warn: config.schemaPrisma.warnLines,
    max: config.schemaPrisma.maxLines,
    units: "",
  });

  const modulesRoot = resolveRepoPath(config.topLevelModules.path);
  const moduleStats = readModuleStats(modulesRoot);
  const moduleCount = moduleStats.length;
  evaluateThreshold({
    findings,
    label: `top-level modules`,
    actual: moduleCount,
    warn: config.topLevelModules.warnCount,
    max: config.topLevelModules.maxCount,
    units: "",
  });

  const moduleStatsMap = new Map(moduleStats.map((entry) => [entry.name, entry]));

  for (const [moduleName, budget] of Object.entries(config.watchModules || {})) {
    const current = moduleStatsMap.get(moduleName);
    if (!current) {
      pushFinding(
        findings.failures,
        "FAIL",
        `watched module is missing: ${moduleName}`,
      );
      continue;
    }

    evaluateThreshold({
      findings,
      label: `module ${moduleName} lines`,
      actual: current.lines,
      warn: budget.warnLines,
      max: budget.maxLines,
      units: "",
      owner: budget.owner,
    });
    evaluateThreshold({
      findings,
      label: `module ${moduleName} files`,
      actual: current.files,
      warn: budget.warnFiles,
      max: budget.maxFiles,
      units: "",
      owner: budget.owner,
    });
  }

  const watchedModules = new Set(Object.keys(config.watchModules || {}));
  for (const current of moduleStats) {
    if (watchedModules.has(current.name)) {
      continue;
    }

    if (
      current.lines >= config.defaultHotspot.warnLines ||
      current.files >= config.defaultHotspot.warnFiles
    ) {
      pushFinding(
        findings.warnings,
        "WARN",
        `module ${current.name} is a non-budgeted hotspot: ${current.lines} lines, ${current.files} files`,
      );
    }
  }

  console.log("Architecture Budget Report");
  console.log(`mode=${mode}`);
  console.log(
    `schema.prisma lines=${schemaLines}, top-level modules=${moduleCount}`,
  );
  console.log("Top modules by size:");
  for (const entry of moduleStats.slice(0, 10)) {
    console.log(`- ${entry.name}: ${entry.lines} lines, ${entry.files} files`);
  }

  if (findings.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of findings.warnings) {
      console.log(`- ${warning.message}`);
    }
  }

  if (findings.failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of findings.failures) {
      console.log(`- ${failure.message}`);
    }
  }

  if (mode === "enforce" && findings.failures.length > 0) {
    process.exit(1);
  }
}

main();

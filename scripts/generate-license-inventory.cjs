#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const JSON_FILE = path.join(OUTPUT_DIR, "license-inventory.json");
const MD_FILE = path.join(OUTPUT_DIR, "license-inventory.md");

function normalizeLicense(raw) {
  if (!raw) return "UNKNOWN";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw.map(normalizeLicense).join(" OR ");
  }
  if (typeof raw === "object") {
    if (raw.type) return String(raw.type);
    if (raw.name) return String(raw.name);
  }
  return "UNKNOWN";
}

function dependencyValues(deps) {
  if (!deps) return [];
  if (Array.isArray(deps)) return deps;
  if (typeof deps === "object") return Object.values(deps);
  return [];
}

function readPackageMeta(node) {
  if (!node?.path) {
    return { license: "UNKNOWN", private: null, homepage: null, repository: null };
  }
  const packageJsonPath = path.join(node.path, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return { license: "UNKNOWN", private: null, homepage: null, repository: null };
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return {
      license: normalizeLicense(pkg.license || pkg.licenses),
      private: pkg.private ?? null,
      homepage: pkg.homepage ?? null,
      repository:
        typeof pkg.repository === "string"
          ? pkg.repository
          : pkg.repository?.url ?? null,
    };
  } catch {
    return { license: "UNKNOWN", private: null, homepage: null, repository: null };
  }
}

function visitNode(node, acc) {
  if (!node || typeof node !== "object") return;
  const key = node.path ? path.resolve(node.path) : `${node.name}@${node.version}`;
  if (!acc.has(key)) {
    const meta = readPackageMeta(node);
    acc.set(key, {
      name: node.name || null,
      version: node.version || null,
      path: node.path ? rel(node.path) : null,
      license: meta.license,
      private: meta.private,
      homepage: meta.homepage,
      repository: meta.repository,
    });
  }

  for (const child of dependencyValues(node.dependencies)) {
    visitNode(child, acc);
  }
  for (const child of dependencyValues(node.devDependencies)) {
    visitNode(child, acc);
  }
  for (const child of dependencyValues(node.unsavedDependencies)) {
    visitNode(child, acc);
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function main() {
  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const res = spawnSync(
    pnpmCmd,
    ["ls", "--json", "--depth", "Infinity"],
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    process.exit(res.status ?? 1);
  }

  const parsed = JSON.parse(res.stdout || "[]");
  const packages = new Map();
  for (const rootNode of parsed) {
    visitNode(rootNode, packages);
  }

  const items = Array.from(packages.values()).sort((left, right) => {
    const byName = String(left.name || "").localeCompare(String(right.name || ""));
    if (byName !== 0) return byName;
    return String(left.version || "").localeCompare(String(right.version || ""));
  });

  const licenseCounts = new Map();
  for (const item of items) {
    licenseCounts.set(item.license, (licenseCounts.get(item.license) || 0) + 1);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPackages: items.length,
    unknownLicenseCount: items.filter((item) => item.license === "UNKNOWN").length,
    licenses: Array.from(licenseCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([license, count]) => ({ license, count })),
    packages: items,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(summary, null, 2)}\n`);

  const topLicenses = summary.licenses
    .slice(0, 20)
    .map(({ license, count }) => `| ${license} | ${count} |`)
    .join("\n");
  const markdown = [
    "# License Inventory",
    "",
    `Generated: ${summary.generatedAt}`,
    `Total packages: ${summary.totalPackages}`,
    `Unknown licenses: ${summary.unknownLicenseCount}`,
    "",
    "| License | Count |",
    "|---|---:|",
    topLicenses || "| none | 0 |",
    "",
  ].join("\n");
  fs.writeFileSync(MD_FILE, `${markdown}\n`);

  console.log("[generate-license-inventory] json=" + rel(JSON_FILE));
  console.log("[generate-license-inventory] markdown=" + rel(MD_FILE));
  console.log(`[generate-license-inventory] total_packages=${summary.totalPackages}`);
  console.log(`[generate-license-inventory] unknown_licenses=${summary.unknownLicenseCount}`);
}

main();

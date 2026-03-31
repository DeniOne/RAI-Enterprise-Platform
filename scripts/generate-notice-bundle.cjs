#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECURITY_DIR = path.join(ROOT, "var", "security");
const INVENTORY_JSON = path.join(SECURITY_DIR, "license-inventory.json");
const OUTPUT_JSON = path.join(SECURITY_DIR, "notice-bundle.json");
const OUTPUT_MD = path.join(SECURITY_DIR, "notice-bundle.md");

const FAMILY_REPRESENTATIVES = [
  {
    license: "MIT",
    candidates: [
      "node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild",
      "node_modules/.pnpm/turbo@2.8.1/node_modules/turbo",
      "node_modules/.pnpm/axios@1.14.0/node_modules/axios",
    ],
  },
  {
    license: "Apache-2.0",
    candidates: [
      "node_modules/.pnpm/typescript@5.9.3/node_modules/typescript",
      "node_modules/.pnpm/minio@8.0.7/node_modules/minio",
    ],
  },
  {
    license: "ISC",
    candidates: ["node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors"],
  },
  {
    license: "BSD-2-Clause",
    candidates: ["node_modules/.pnpm/dotenv@17.2.3/node_modules/dotenv"],
  },
  {
    license: "BSD-3-Clause",
    candidates: ["node_modules/.pnpm/stream-json@1.9.1/node_modules/stream-json"],
  },
  {
    license: "BlueOak-1.0.0",
    candidates: ["node_modules/.pnpm/sax@1.4.4/node_modules/sax"],
  },
];

const CONDITIONAL_UNKNOWNS = [
  {
    ref: "A5-U-01",
    label: "esbuild platform companions",
    prefix: "node_modules/.pnpm/@esbuild+",
    parent: "node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild",
    tier1Decision:
      "conditional allow for Tier 1 Linux self-host as MIT-family toolchain companions",
  },
  {
    ref: "A5-U-03",
    label: "turbo platform companions",
    prefix: "node_modules/.pnpm/turbo-",
    parent: "node_modules/.pnpm/turbo@2.8.1/node_modules/turbo",
    tier1Decision:
      "conditional allow for Tier 1 Linux self-host as MIT-family dev-toolchain companions",
  },
];

const LINUX_OUT_OF_SCOPE = {
  ref: "A5-U-02",
  label: "fsevents",
  path: "node_modules/.pnpm/fsevents@2.3.3/node_modules/fsevents",
  rule: "exclude from Linux Tier 1 notice bundle; revisit only for macOS distribution",
};

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function ensureExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    console.error(message);
    process.exit(1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPackageJson(packageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return { name: path.basename(packageDir), version: null, license: null };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return {
      name: parsed.name || path.basename(packageDir),
      version: parsed.version || null,
      license: parsed.license || null,
    };
  } catch {
    return { name: path.basename(packageDir), version: null, license: null };
  }
}

function findByPrefixes(dirPath, prefixes) {
  if (!fs.existsSync(dirPath)) return null;
  const entries = fs.readdirSync(dirPath);
  for (const prefix of prefixes) {
    const match = entries.find((entry) => entry.toLowerCase().startsWith(prefix));
    if (match) return path.join(dirPath, match);
  }
  return null;
}

function resolveRepresentative(candidatePath) {
  const absDir = path.join(ROOT, candidatePath);
  if (!fs.existsSync(absDir)) return null;
  const packageMeta = readPackageJson(absDir);
  const licenseFile = findByPrefixes(absDir, ["license", "copying"]);
  const noticeFile = findByPrefixes(absDir, ["notice"]);
  return {
    packageName: packageMeta.name,
    version: packageMeta.version,
    declaredLicense: packageMeta.license,
    packagePath: candidatePath,
    licenseFilePath: licenseFile ? rel(licenseFile) : null,
    noticeFilePath: noticeFile ? rel(noticeFile) : null,
    licenseText: licenseFile ? fs.readFileSync(licenseFile, "utf8").trim() : null,
    noticeText: noticeFile ? fs.readFileSync(noticeFile, "utf8").trim() : null,
  };
}

function firstExistingRepresentative(candidates) {
  for (const candidate of candidates) {
    const resolved = resolveRepresentative(candidate);
    if (resolved) return resolved;
  }
  return null;
}

function buildFamilies(inventory) {
  return FAMILY_REPRESENTATIVES.map((entry) => {
    const count = inventory.packages.filter((pkg) => pkg.license === entry.license).length;
    const representative = firstExistingRepresentative(entry.candidates);
    if (!representative) {
      console.error(
        `[generate-notice-bundle] no representative found for ${entry.license}`,
      );
      process.exit(1);
    }
    return {
      license: entry.license,
      count,
      ...representative,
    };
  });
}

function buildConditionalUnknowns(inventory) {
  return CONDITIONAL_UNKNOWNS.map((group) => {
    const items = inventory.packages.filter(
      (pkg) => pkg.license === "UNKNOWN" && pkg.path && pkg.path.startsWith(group.prefix),
    );
    const parent = resolveRepresentative(group.parent);
    if (!parent) {
      console.error(`[generate-notice-bundle] parent package missing: ${group.parent}`);
      process.exit(1);
    }
    return {
      ref: group.ref,
      label: group.label,
      count: items.length,
      packagePaths: items.map((item) => item.path),
      parent,
      tier1Decision: group.tier1Decision,
    };
  });
}

function buildFirstPartyExclusions(inventory) {
  return inventory.packages
    .filter((pkg) => pkg.license === "UNLICENSED")
    .map((pkg) => ({
      packagePath: pkg.path || "package.json",
      tier1Rule: "exclude from third-party notice bundle; governed by first-party licensing strategy",
    }));
}

function renderMarkdown(data) {
  const lines = [
    "# Notice Bundle",
    "",
    `Generated: ${data.generatedAt}`,
    `Source inventory: ${data.sourceInventory}`,
    `Total packages: ${data.totalPackages}`,
    `Unknown licenses: ${data.unknownLicenseCount}`,
    "",
    "## 1. Included license families",
    "",
    "| License family | Count | Representative package | License file | NOTICE file |",
    "|---|---:|---|---|---|",
  ];

  for (const family of data.families) {
    lines.push(
      `| ${family.license} | ${family.count} | ${family.packageName}@${family.version || "unknown"} | ${family.licenseFilePath || "missing"} | ${family.noticeFilePath || "none"} |`,
    );
  }

  lines.push(
    "",
    "## 2. Conditional unknown toolchain perimeter",
    "",
    "| Ref | Group | Count | Parent package | Parent license file | Tier 1 rule |",
    "|---|---|---:|---|---|---|",
  );

  for (const group of data.conditionalUnknowns) {
    lines.push(
      `| ${group.ref} | ${group.label} | ${group.count} | ${group.parent.packageName}@${group.parent.version || "unknown"} | ${group.parent.licenseFilePath || "missing"} | ${group.tier1Decision} |`,
    );
  }

  lines.push(
    "",
    "## 3. Linux Tier 1 out-of-scope",
    "",
    `- ${data.linuxOutOfScope.ref}: \`${data.linuxOutOfScope.path}\``,
    `- Rule: ${data.linuxOutOfScope.rule}`,
    "",
    "## 4. Excluded first-party perimeter",
    "",
  );

  for (const item of data.firstPartyExclusions) {
    lines.push(`- \`${item.packagePath}\` -> ${item.tier1Rule}`);
  }

  lines.push(
    "",
    "## 5. Representative license texts",
    "",
    "Этот bundle ещё не является final legal sign-off по дистрибуции. Это first assembled bundle для procurement / due-diligence / self-host handoff.",
    "",
  );

  for (const family of data.families) {
    lines.push(
      `### ${family.license}`,
      "",
      `Representative package: \`${family.packageName}@${family.version || "unknown"}\``,
      "",
      `License source: \`${family.licenseFilePath}\``,
      "",
      "~~~text",
      family.licenseText || "MISSING",
      "~~~",
      "",
    );
    if (family.noticeText) {
      lines.push(
        `NOTICE source: \`${family.noticeFilePath}\``,
        "",
        "~~~text",
        family.noticeText,
        "~~~",
        "",
      );
    }
  }

  lines.push("", "## 6. Parent-family texts for conditional toolchain unknowns", "");

  for (const group of data.conditionalUnknowns) {
    lines.push(
      `### ${group.label}`,
      "",
      `Parent package: \`${group.parent.packageName}@${group.parent.version || "unknown"}\``,
      "",
      `License source: \`${group.parent.licenseFilePath}\``,
      "",
      "~~~text",
      group.parent.licenseText || "MISSING",
      "~~~",
      "",
      "Representative unknown package paths:",
      ""
    );
    for (const packagePath of group.packagePaths.slice(0, 8)) {
      lines.push(`- \`${packagePath}\``);
    }
    if (group.packagePaths.length > 8) {
      lines.push(`- ... и ещё ${group.packagePaths.length - 8}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  ensureExists(
    INVENTORY_JSON,
    "[generate-notice-bundle] missing var/security/license-inventory.json; run pnpm security:licenses first",
  );
  const inventory = readJson(INVENTORY_JSON);
  const families = buildFamilies(inventory);
  const conditionalUnknowns = buildConditionalUnknowns(inventory);
  const firstPartyExclusions = buildFirstPartyExclusions(inventory);

  const result = {
    generatedAt: new Date().toISOString(),
    sourceInventory: rel(INVENTORY_JSON),
    totalPackages: inventory.totalPackages,
    unknownLicenseCount: inventory.unknownLicenseCount,
    families: families.map((family) => ({
      license: family.license,
      count: family.count,
      packageName: family.packageName,
      version: family.version,
      declaredLicense: family.declaredLicense,
      packagePath: family.packagePath,
      licenseFilePath: family.licenseFilePath,
      noticeFilePath: family.noticeFilePath,
    })),
    conditionalUnknowns: conditionalUnknowns.map((group) => ({
      ref: group.ref,
      label: group.label,
      count: group.count,
      packagePaths: group.packagePaths,
      parent: {
        packageName: group.parent.packageName,
        version: group.parent.version,
        declaredLicense: group.parent.declaredLicense,
        packagePath: group.parent.packagePath,
        licenseFilePath: group.parent.licenseFilePath,
      },
      tier1Decision: group.tier1Decision,
    })),
    linuxOutOfScope: LINUX_OUT_OF_SCOPE,
    firstPartyExclusions,
  };

  fs.mkdirSync(SECURITY_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(
    OUTPUT_MD,
    renderMarkdown({
      ...result,
      families,
      conditionalUnknowns,
    }),
  );

  console.log(`[generate-notice-bundle] json=${rel(OUTPUT_JSON)}`);
  console.log(`[generate-notice-bundle] markdown=${rel(OUTPUT_MD)}`);
  console.log(`[generate-notice-bundle] families=${families.length}`);
  console.log(
    `[generate-notice-bundle] conditional_unknowns=${conditionalUnknowns.reduce((acc, item) => acc + item.count, 0)}`,
  );
}

main();

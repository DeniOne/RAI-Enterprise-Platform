#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const INPUT_JSON = path.join(ROOT, "var", "security", "security-reviewed-evidence-input.json");
const OUTPUT_JSON = path.join(ROOT, "var", "security", "security-reviewed-evidence-pr-lookup.json");
const OUTPUT_MD = path.join(ROOT, "var", "security", "security-reviewed-evidence-pr-lookup.md");

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[security-reviewed-evidence-pr-lookup] ${message}`);
    process.exit(1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "RAI_EP/security-reviewed-evidence-pr-lookup",
          Accept: "application/vnd.github+json",
        },
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`http_${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("invalid_json"));
          }
        });
      },
    );

    request.on("error", (error) => reject(error));
  });
}

function printUsage() {
  console.log("usage: node scripts/security-reviewed-evidence-pr-lookup.cjs --pr-number=123 [--write-report]");
}

function toAtHandle(value) {
  return value ? `@${value}` : "";
}

function summarizeReviews(reviews) {
  const normalized = Array.isArray(reviews) ? reviews : [];
  const rows = normalized.map((item) => ({
    user: item && item.user ? item.user.login : "",
    state: item.state || "",
    submittedAt: item.submitted_at || "",
    htmlUrl: item.html_url || "",
  }));
  const approved = rows.filter((item) => item.state === "APPROVED");
  const commenterRefs = rows.map((item) => toAtHandle(item.user)).filter(Boolean);
  return {
    rows,
    approvedCount: approved.length,
    reviewerRefs: Array.from(new Set(commenterRefs)),
  };
}

function findDependencyReviewRun(runs, headSha) {
  return (Array.isArray(runs) ? runs : []).find((item) => {
    return item && item.path === ".github/workflows/dependency-review.yml" && item.head_sha === headSha;
  }) || null;
}

async function main() {
  if (hasFlag("help")) {
    printUsage();
    process.exit(0);
  }

  const prNumberRaw = getArg("pr-number");
  assert(/^\d+$/.test(prNumberRaw), "нужен --pr-number=<целое число>");
  assert(fs.existsSync(INPUT_JSON), `не найден input file: ${rel(INPUT_JSON)}`);

  const prNumber = Number(prNumberRaw);
  const input = readJson(INPUT_JSON);
  const owner = input.repository && input.repository.owner;
  const repo = input.repository && input.repository.name;
  assert(owner && repo, "в input должны быть repository.owner и repository.name");

  const pr = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
  const reviews = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`);
  const runsPayload = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/actions/runs?event=pull_request&per_page=100`);

  const reviewSummary = summarizeReviews(reviews);
  const dependencyRun = findDependencyReviewRun(runsPayload.workflow_runs, pr.head.sha);
  const status = dependencyRun && pr.merge_commit_sha ? "resolved" : dependencyRun ? "run_found_pr_open" : "run_not_found";
  const verdict = dependencyRun && pr.merge_commit_sha ? "pr_dependency_review_cycle_resolved" : "pr_dependency_review_cycle_pending";
  const suggestedCommand = dependencyRun
    ? `pnpm security:reviewed-evidence:intake -- --pr-number=${pr.number} --dependency-run-id=${dependencyRun.id}${pr.merge_commit_sha ? ` --merge-commit-sha=${pr.merge_commit_sha}` : ""}${reviewSummary.reviewerRefs.length > 0 ? ` --reviewer-refs=${reviewSummary.reviewerRefs.join(",")} --dependency-reviewer-refs=${reviewSummary.reviewerRefs.join(",")} --provenance-reviewer-refs=${reviewSummary.reviewerRefs.join(",")}` : ""}`
    : "Dependency Review run для этого PR пока не найден; дождаться workflow и повторить lookup.";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R3",
    status,
    issues: [
      ...(dependencyRun ? [] : [{ type: "dependency_review_run_not_found", value: String(pr.head.sha) }]),
      ...(pr.merge_commit_sha ? [] : [{ type: "merge_commit_sha_missing", value: pr.state }]),
      ...(reviewSummary.reviewerRefs.length > 0 ? [] : [{ type: "reviewer_refs_missing_from_github_reviews", value: String(pr.number) }]),
    ],
    evidenceRefs: [
      rel(INPUT_JSON),
      pr.html_url,
      ...(dependencyRun ? [dependencyRun.html_url] : []),
      ...reviewSummary.rows.map((item) => item.htmlUrl).filter(Boolean),
    ],
    nextAction: suggestedCommand,
    verdict,
    pr: {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      mergedAt: pr.merged_at,
      mergeCommitSha: pr.merge_commit_sha,
      htmlUrl: pr.html_url,
      headRef: pr.head && pr.head.ref,
      headSha: pr.head && pr.head.sha,
      baseRef: pr.base && pr.base.ref,
    },
    dependencyReviewRun: dependencyRun ? {
      id: dependencyRun.id,
      name: dependencyRun.name,
      status: dependencyRun.status,
      conclusion: dependencyRun.conclusion,
      htmlUrl: dependencyRun.html_url,
      createdAt: dependencyRun.created_at,
      headSha: dependencyRun.head_sha,
      event: dependencyRun.event,
      path: dependencyRun.path,
    } : null,
    githubReviews: reviewSummary,
    suggestedIntakeCommand: suggestedCommand,
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Security Reviewed Evidence PR Lookup",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- pr: \`#${report.pr.number}\``,
    `- pr_state: \`${report.pr.state}\``,
    `- merge_commit_sha: \`${report.pr.mergeCommitSha || "pending"}\``,
    "",
    "## Dependency Review Run",
    "",
    dependencyRun
      ? `- run_id: \`${dependencyRun.id}\`\n- run_status: \`${dependencyRun.status}\`\n- run_conclusion: \`${dependencyRun.conclusion}\`\n- run_url: ${dependencyRun.html_url}`
      : "- run: not found",
    "",
    "## GitHub Reviews",
    "",
    reviewSummary.rows.length > 0
      ? reviewSummary.rows.map((item) => `- reviewer=\`${item.user}\` state=\`${item.state}\` submitted_at=\`${item.submittedAt || "-"}\` ${item.htmlUrl || ""}`).join("\n")
      : "- reviews: none",
    "",
    "## Suggested Intake",
    "",
    `- ${suggestedCommand}`,
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_MD, `${md}\n`);

  console.log("[security-reviewed-evidence-pr-lookup] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- report_json=${rel(OUTPUT_JSON)}`);
  console.log(`- report_md=${rel(OUTPUT_MD)}`);
}

main().catch((error) => {
  console.error(`[security-reviewed-evidence-pr-lookup] ${error.message}`);
  process.exit(1);
});

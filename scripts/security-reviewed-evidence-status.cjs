#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "var", "security");
const INPUT_JSON = process.env.SECURITY_REVIEWED_EVIDENCE_INPUT
  ? path.resolve(process.env.SECURITY_REVIEWED_EVIDENCE_INPUT)
  : path.join(OUTPUT_DIR, "security-reviewed-evidence-input.json");
const REPORT_JSON = path.join(OUTPUT_DIR, "security-reviewed-evidence-status.json");
const REPORT_MD = path.join(OUTPUT_DIR, "security-reviewed-evidence-status.md");

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function asNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function parseGithubRemote(remoteUrl) {
  const match = String(remoteUrl || "").match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i);
  if (!match) {
    return null;
  }
  return {
    owner: match[1],
    name: match[2],
  };
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function fetchJson(url, accept = "application/vnd.github+json") {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "RAI_EP/security-reviewed-evidence-status",
          Accept: accept,
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

    request.on("error", (error) => {
      reject(error);
    });
  });
}

async function fetchPullsForCommit(context, commitSha) {
  if (!asNonEmptyString(commitSha)) {
    return [];
  }

  try {
    const payload = await fetchJson(
      `https://api.github.com/repos/${context.repository.owner}/${context.repository.name}/commits/${commitSha}/pulls`,
      "application/vnd.github.groot-preview+json",
    );
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

function addIssue(issues, issue) {
  issues.push(issue);
}

function validateRunUrl(url, runId) {
  if (!asNonEmptyString(url)) {
    return false;
  }
  return String(url).includes(`/actions/runs/${runId}`);
}

function renderIssuesMarkdown(issues) {
  if (issues.length === 0) {
    return "- issues: none";
  }

  return issues
    .map((issue) => {
      const parts = [`- \`${issue.type}\``];
      if (issue.control) parts.push(`control=\`${issue.control}\``);
      if (issue.file) parts.push(`file=\`${issue.file}\``);
      if (issue.value) parts.push(`value=\`${issue.value}\``);
      return parts.join(" ");
    })
    .join("\n");
}

function renderControlTable(rows) {
  const header = [
    "| Control | Status | Workflow | Run | Event | Head | Notes |",
    "|---|---|---|---|---|---|---|",
  ];

  const body = rows.map((row) => {
    return `| \`${row.control}\` | \`${row.status}\` | \`${row.workflowPath || "-"}\` | \`${row.runDisplay || "-"}\` | \`${row.event || "-"}\` | \`${row.headSha || "-"}\` | ${row.notes} |`;
  });

  return header.concat(body).join("\n");
}

async function verifyRunControl(controlKey, control, context, issues) {
  const workflowPath = asNonEmptyString(control.workflowPath);
  const workflowAbsolute = workflowPath ? path.join(ROOT, workflowPath) : "";
  const workflowExists = workflowPath ? fs.existsSync(workflowAbsolute) : false;
  const runId = Number.isInteger(control.runId) ? control.runId : null;
  const expectedEvent = asNonEmptyString(control.expectedEvent);
  const workflowName = asNonEmptyString(control.workflowName);
  const result = {
    control: controlKey,
    required: Boolean(control.required),
    workflowPath,
    workflowExists,
    runId,
    runUrl: asNonEmptyString(control.runUrl),
    status: "pending",
    verified: false,
    event: expectedEvent || "-",
    headSha: "-",
    notes: "",
    remoteEvidence: null,
  };

  if (!workflowPath) {
    addIssue(issues, { type: "missing_workflow_path", control: controlKey, file: rel(INPUT_JSON) });
    result.status = "missing_workflow_path";
    result.notes = "В input не указан workflowPath.";
    return result;
  }

  if (!workflowExists) {
    addIssue(issues, { type: "missing_local_workflow", control: controlKey, file: workflowPath });
    result.status = "missing_workflow";
    result.notes = "Workflow-файл отсутствует в репозитории.";
    return result;
  }

  if (!runId) {
    addIssue(issues, { type: "missing_run_id", control: controlKey, file: rel(INPUT_JSON) });
    result.status = "missing_run";
    result.notes = "В input не указан runId.";
    return result;
  }

  if (!validateRunUrl(control.runUrl, runId)) {
    addIssue(issues, { type: "invalid_run_url", control: controlKey, value: String(control.runUrl || "<empty>") });
  }

  try {
    const payload = await fetchJson(`https://api.github.com/repos/${context.repository.owner}/${context.repository.name}/actions/runs/${runId}`);
    result.remoteEvidence = {
      id: payload.id,
      name: payload.name,
      path: payload.path,
      headSha: payload.head_sha,
      headBranch: payload.head_branch,
      event: payload.event,
      status: payload.status,
      conclusion: payload.conclusion,
      htmlUrl: payload.html_url,
      createdAt: payload.created_at,
    };
    result.event = payload.event || expectedEvent || "-";
    result.headSha = payload.head_sha || "-";

    const mismatches = [];
    if (workflowName && payload.name !== workflowName) {
      mismatches.push(`workflow_name:${payload.name}`);
    }
    if (payload.path !== workflowPath) {
      mismatches.push(`workflow_path:${payload.path}`);
    }
    if (expectedEvent && payload.event !== expectedEvent) {
      mismatches.push(`event:${payload.event}`);
    }
    if (payload.status !== "completed") {
      mismatches.push(`status:${payload.status}`);
    }
    if (payload.conclusion !== "success") {
      mismatches.push(`conclusion:${payload.conclusion}`);
    }
    if (payload.head_sha !== context.reviewScope.headSha) {
      mismatches.push(`head_sha:${payload.head_sha}`);
    }
    if (payload.head_branch !== context.reviewScope.headBranch) {
      mismatches.push(`head_branch:${payload.head_branch}`);
    }

    if (mismatches.length > 0) {
      addIssue(issues, {
        type: "github_run_mismatch",
        control: controlKey,
        value: mismatches.join(", "),
      });
      result.status = "mismatch";
      result.notes = `Run найден, но не совпал с input/current head: ${mismatches.join(", ")}.`;
      return result;
    }

    result.status = "verified";
    result.verified = true;
    result.notes = "Workflow run подтверждён через GitHub API и совпадает с текущим head.";
    return result;
  } catch (error) {
    addIssue(issues, { type: "github_run_lookup_failed", control: controlKey, value: error.message });
    result.status = "lookup_failed";
    result.notes = `Не удалось получить run через GitHub API: ${error.message}.`;
    return result;
  }
}

async function verifyDependencyReview(control, context, issues) {
  const workflowPath = asNonEmptyString(control.workflowPath);
  const workflowAbsolute = workflowPath ? path.join(ROOT, workflowPath) : "";
  const workflowExists = workflowPath ? fs.existsSync(workflowAbsolute) : false;
  const prNumber = Number.isInteger(control.prNumber) ? control.prNumber : null;
  const runId = Number.isInteger(control.runId) ? control.runId : null;
  const reviewerRefs = ensureArray(control.reviewerRefs).filter((value) => asNonEmptyString(value));
  const result = {
    control: "dependencyReview",
    required: Boolean(control.required),
    workflowPath,
    workflowExists,
    runId,
    prNumber,
    runDisplay: runId ? String(runId) : prNumber ? `PR-${prNumber}` : "-",
    runUrl: asNonEmptyString(control.runUrl),
    status: "pending",
    verified: false,
    event: asNonEmptyString(control.expectedEvent) || "pull_request",
    headSha: asNonEmptyString(control.mergeCommitSha) || "-",
    notes: "",
    remoteEvidence: null,
    reviewerRefs,
  };

  if (!workflowPath) {
    addIssue(issues, { type: "missing_workflow_path", control: "dependencyReview", file: rel(INPUT_JSON) });
    result.status = "missing_workflow_path";
    result.notes = "В input не указан workflowPath.";
    return result;
  }

  if (!workflowExists) {
    addIssue(issues, { type: "missing_local_workflow", control: "dependencyReview", file: workflowPath });
    result.status = "missing_workflow";
    result.notes = "Workflow-файл dependency review отсутствует в репозитории.";
    return result;
  }

  if (!runId && !prNumber) {
    addIssue(issues, {
      type: "missing_dependency_review_ref",
      control: "dependencyReview",
      value: "runId/prNumber",
    });
    result.status = "missing_pr_evidence";
    result.notes = "В input не зафиксирован PR-backed runId или prNumber для dependency review.";
    return result;
  }

  if (runId && !validateRunUrl(control.runUrl, runId)) {
    addIssue(issues, { type: "invalid_run_url", control: "dependencyReview", value: String(control.runUrl || "<empty>") });
  }

  if (prNumber) {
    try {
      const payload = await fetchJson(`https://api.github.com/repos/${context.repository.owner}/${context.repository.name}/pulls/${prNumber}`);
      result.remoteEvidence = {
        prNumber: payload.number,
        state: payload.state,
        mergedAt: payload.merged_at,
        htmlUrl: payload.html_url,
        baseRef: payload.base && payload.base.ref,
        mergeCommitSha: payload.merge_commit_sha,
      };
      result.headSha = payload.merge_commit_sha || "-";

      const mismatches = [];
      if (payload.state !== "closed") {
        mismatches.push(`pr_state:${payload.state}`);
      }
      if (!payload.merged_at) {
        mismatches.push("pr_not_merged");
      }
      if ((payload.base && payload.base.ref) !== context.reviewScope.headBranch) {
        mismatches.push(`base_ref:${payload.base ? payload.base.ref : "<empty>"}`);
      }
      if (payload.merge_commit_sha !== context.reviewScope.headSha) {
        mismatches.push(`merge_commit_sha:${payload.merge_commit_sha}`);
      }

      if (mismatches.length > 0) {
        addIssue(issues, {
          type: "dependency_review_pr_mismatch",
          control: "dependencyReview",
          value: mismatches.join(", "),
        });
        result.status = "mismatch";
        result.notes = `PR найден, но не замыкается на текущий head: ${mismatches.join(", ")}.`;
        return result;
      }
    } catch (error) {
      addIssue(issues, { type: "github_pull_lookup_failed", control: "dependencyReview", value: error.message });
      result.status = "lookup_failed";
      result.notes = `Не удалось получить PR через GitHub API: ${error.message}.`;
      return result;
    }
  }

  if (runId) {
    try {
      const payload = await fetchJson(`https://api.github.com/repos/${context.repository.owner}/${context.repository.name}/actions/runs/${runId}`);
      result.remoteEvidence = {
        ...(result.remoteEvidence || {}),
        runId: payload.id,
        runName: payload.name,
        path: payload.path,
        headSha: payload.head_sha,
        event: payload.event,
        status: payload.status,
        conclusion: payload.conclusion,
        htmlUrl: payload.html_url,
      };

      const mismatches = [];
      if (payload.path !== workflowPath) mismatches.push(`workflow_path:${payload.path}`);
      if (payload.event !== (asNonEmptyString(control.expectedEvent) || "pull_request")) mismatches.push(`event:${payload.event}`);
      if (payload.status !== "completed") mismatches.push(`status:${payload.status}`);
      if (payload.conclusion !== "success") mismatches.push(`conclusion:${payload.conclusion}`);

      if (mismatches.length > 0) {
        addIssue(issues, {
          type: "github_run_mismatch",
          control: "dependencyReview",
          value: mismatches.join(", "),
        });
        result.status = "mismatch";
        result.notes = `Dependency review run найден, но не прошёл проверку: ${mismatches.join(", ")}.`;
        return result;
      }
    } catch (error) {
      addIssue(issues, { type: "github_run_lookup_failed", control: "dependencyReview", value: error.message });
      result.status = "lookup_failed";
      result.notes = `Не удалось получить dependency review run: ${error.message}.`;
      return result;
    }
  }

  if (reviewerRefs.length === 0) {
    addIssue(issues, { type: "missing_dependency_review_reviewer_refs", control: "dependencyReview" });
    result.status = "review_pending";
    result.notes = "PR/run привязан, но reviewer refs в input пока отсутствуют.";
    return result;
  }

  result.status = "verified";
  result.verified = true;
  result.notes = "Dependency review привязан к merged PR/current head и имеет reviewer refs.";
  return result;
}

function verifyProvenance(control, context, issues, securityBaseline) {
  const workflowPath = asNonEmptyString(control.workflowPath);
  const workflowAbsolute = workflowPath ? path.join(ROOT, workflowPath) : "";
  const workflowExists = workflowPath ? fs.existsSync(workflowAbsolute) : false;
  const subjectPaths = ensureArray(control.subjectPaths).filter((value) => asNonEmptyString(value));
  const reviewerRefs = ensureArray(control.reviewerRefs).filter((value) => asNonEmptyString(value));
  const result = {
    control: "provenance",
    required: Boolean(control.required),
    workflowPath,
    workflowExists,
    runId: Number.isInteger(control.attestationRunId) ? control.attestationRunId : null,
    runUrl: asNonEmptyString(control.attestationRunUrl),
    status: "pending",
    verified: false,
    event: "push",
    headSha: context.reviewScope.headSha,
    notes: "",
    subjectPaths,
    reviewerRefs,
    attestationStepPresent: false,
    uploadArtifactStepPresent: false,
    sourceControl: asNonEmptyString(control.sourceControl),
  };

  if (!workflowPath) {
    addIssue(issues, { type: "missing_workflow_path", control: "provenance", file: rel(INPUT_JSON) });
    result.status = "missing_workflow_path";
    result.notes = "В input не указан provenance workflowPath.";
    return result;
  }

  if (!workflowExists) {
    addIssue(issues, { type: "missing_local_workflow", control: "provenance", file: workflowPath });
    result.status = "missing_workflow";
    result.notes = "Security baseline workflow для provenance отсутствует.";
    return result;
  }

  const workflowBody = readText(workflowAbsolute);
  result.attestationStepPresent = workflowBody.includes("actions/attest-build-provenance@");
  result.uploadArtifactStepPresent = workflowBody.includes("actions/upload-artifact@");

  if (!result.uploadArtifactStepPresent) {
    addIssue(issues, { type: "missing_upload_artifact_step", control: "provenance", file: workflowPath });
  }
  if (!result.attestationStepPresent) {
    addIssue(issues, { type: "missing_attestation_step", control: "provenance", file: workflowPath });
    result.status = "missing_attestation_step";
    result.notes = "В workflow не найден attest-build-provenance step.";
    return result;
  }
  if (subjectPaths.length === 0) {
    addIssue(issues, { type: "missing_provenance_subject_paths", control: "provenance", file: rel(INPUT_JSON) });
    result.status = "missing_subject_paths";
    result.notes = "В input не заданы subjectPaths для provenance.";
    return result;
  }
  if (!securityBaseline || !securityBaseline.verified) {
    addIssue(issues, { type: "provenance_source_control_not_verified", control: "provenance", value: result.sourceControl || "<empty>" });
    result.status = "waiting_for_source_control";
    result.notes = "Provenance опирается на security baseline run, который ещё не верифицирован.";
    return result;
  }
  if (result.runId && securityBaseline.runId && result.runId !== securityBaseline.runId) {
    addIssue(issues, {
      type: "provenance_run_mismatch",
      control: "provenance",
      value: `${result.runId}!=${securityBaseline.runId}`,
    });
    result.status = "mismatch";
    result.notes = "Attestation runId не совпадает с security baseline runId.";
    return result;
  }

  if (!validateRunUrl(control.attestationRunUrl, result.runId || securityBaseline.runId)) {
    addIssue(issues, { type: "invalid_attestation_run_url", control: "provenance", value: String(control.attestationRunUrl || "<empty>") });
  }

  if (reviewerRefs.length === 0) {
    result.status = "workflow_verified_review_pending";
    result.notes = "Attestation step и baseline run есть, но отдельный reviewer-backed provenance ref пока не зафиксирован.";
    return result;
  }

  result.status = "verified";
  result.verified = true;
  result.notes = "Provenance step подтверждён и reviewer-backed ref зафиксирован.";
  return result;
}

async function main() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "warn";
  const issues = [];

  let input = null;
  if (!fs.existsSync(INPUT_JSON)) {
    addIssue(issues, { type: "missing_input_file", file: rel(INPUT_JSON) });
  } else {
    try {
      input = readJson(INPUT_JSON);
    } catch {
      addIssue(issues, { type: "invalid_input_json", file: rel(INPUT_JSON) });
    }
  }

  let currentHeadSha = "unknown";
  let currentBranch = "unknown";
  let originUrl = "unknown";
  let remoteFromGit = null;

  try {
    currentHeadSha = git(["rev-parse", "HEAD"]);
    currentBranch = git(["branch", "--show-current"]);
    originUrl = git(["remote", "get-url", "origin"]);
    remoteFromGit = parseGithubRemote(originUrl);
  } catch (error) {
    addIssue(issues, { type: "git_context_lookup_failed", value: error.message });
  }

  const repository = input && input.repository ? input.repository : {};
  const reviewScope = input && input.reviewScope ? input.reviewScope : {};
  const controls = input && input.controls ? input.controls : {};

  if (!asNonEmptyString(repository.owner)) {
    addIssue(issues, { type: "missing_repository_owner", file: rel(INPUT_JSON) });
  }
  if (!asNonEmptyString(repository.name)) {
    addIssue(issues, { type: "missing_repository_name", file: rel(INPUT_JSON) });
  }
  if (!asNonEmptyString(reviewScope.headSha)) {
    addIssue(issues, { type: "missing_review_head_sha", file: rel(INPUT_JSON) });
  }
  if (!asNonEmptyString(reviewScope.headBranch)) {
    addIssue(issues, { type: "missing_review_head_branch", file: rel(INPUT_JSON) });
  }
  if (!asNonEmptyString(reviewScope.owner)) {
    addIssue(issues, { type: "missing_review_owner", file: rel(INPUT_JSON) });
  }
  if (!isValidDate(reviewScope.reviewedAt)) {
    addIssue(issues, { type: "invalid_reviewed_at", file: rel(INPUT_JSON), value: String(reviewScope.reviewedAt || "<empty>") });
  }

  const reviewerRefs = ensureArray(reviewScope.reviewerRefs).filter((value) => asNonEmptyString(value));
  if (reviewerRefs.length === 0) {
    addIssue(issues, { type: "missing_reviewer_refs", file: rel(INPUT_JSON) });
  }

  if (asNonEmptyString(reviewScope.headSha) && currentHeadSha !== "unknown" && reviewScope.headSha !== currentHeadSha) {
    addIssue(issues, {
      type: "input_head_sha_drift",
      file: rel(INPUT_JSON),
      value: `${reviewScope.headSha}!=${currentHeadSha}`,
    });
  }
  if (asNonEmptyString(reviewScope.headBranch) && currentBranch !== "unknown" && reviewScope.headBranch !== currentBranch) {
    addIssue(issues, {
      type: "input_head_branch_drift",
      file: rel(INPUT_JSON),
      value: `${reviewScope.headBranch}!=${currentBranch}`,
    });
  }
  if (
    remoteFromGit &&
    asNonEmptyString(repository.owner) &&
    asNonEmptyString(repository.name) &&
    (remoteFromGit.owner !== repository.owner || remoteFromGit.name !== repository.name)
  ) {
    addIssue(issues, {
      type: "repository_remote_mismatch",
      file: rel(INPUT_JSON),
      value: `${repository.owner}/${repository.name}!=${remoteFromGit.owner}/${remoteFromGit.name}`,
    });
  }

  const context = {
    repository: {
      owner: asNonEmptyString(repository.owner),
      name: asNonEmptyString(repository.name),
    },
    reviewScope: {
      headSha: asNonEmptyString(reviewScope.headSha),
      headBranch: asNonEmptyString(reviewScope.headBranch),
    },
  };

  const codeql = input ? await verifyRunControl("codeql", controls.codeql || {}, context, issues) : null;
  const securityBaseline = input ? await verifyRunControl("securityBaseline", controls.securityBaseline || {}, context, issues) : null;
  const dependencyReview = input ? await verifyDependencyReview(controls.dependencyReview || {}, context, issues) : null;
  const provenance = input ? verifyProvenance(controls.provenance || {}, context, issues, securityBaseline) : null;
  const reviewScopeMatchesCurrent =
    currentHeadSha !== "unknown" &&
    currentBranch !== "unknown" &&
    asNonEmptyString(reviewScope.headSha) === currentHeadSha &&
    asNonEmptyString(reviewScope.headBranch) === currentBranch;
  const commitPulls = reviewScopeMatchesCurrent ? await fetchPullsForCommit(context, currentHeadSha) : [];
  const directPushWithoutPrTrace = Boolean(
    reviewScopeMatchesCurrent &&
    currentBranch === context.reviewScope.headBranch &&
    dependencyReview &&
    dependencyReview.status === "missing_pr_evidence" &&
    commitPulls.length === 0,
  );

  if (directPushWithoutPrTrace) {
    addIssue(issues, {
      type: "direct_push_without_pr_trace",
      control: "dependencyReview",
      value: currentHeadSha,
    });
    dependencyReview.notes = "Текущий head уже находится в branch review scope, но GitHub не возвращает ни одного PR для этого commit SHA.";
  }

  const controlRows = [codeql, securityBaseline, dependencyReview, provenance]
    .filter(Boolean)
    .map((control) => ({
      control: control.control,
      status: control.status,
      workflowPath: control.workflowPath,
      runDisplay: control.runId ? String(control.runId) : control.prNumber ? `PR-${control.prNumber}` : "-",
      event: control.event,
      headSha: control.headSha,
      notes: control.notes,
    }));

  const baseInfrastructureVerified = Boolean(codeql && codeql.verified) && Boolean(securityBaseline && securityBaseline.verified);
  const provenanceInfrastructureVerified = Boolean(provenance) && ["verified", "workflow_verified_review_pending"].includes(provenance.status);
  const dependencyReviewVerified = Boolean(dependencyReview && dependencyReview.verified);
  const reviewerLoopBound = reviewerRefs.length > 0;

  let status = "blocked";
  let verdict = "reviewed_ci_evidence_loop_blocked";

  if (baseInfrastructureVerified || provenanceInfrastructureVerified) {
    status = "in_progress";
    verdict = "reviewed_ci_evidence_loop_incomplete";
  }

  if (
    input &&
    baseInfrastructureVerified &&
    provenance &&
    provenance.verified &&
    dependencyReviewVerified &&
    reviewerLoopBound &&
    issues.length === 0
  ) {
    status = "done";
    verdict = "reviewed_ci_evidence_loop_ready";
  }

  const nextAction = status === "done"
    ? "удерживать reviewed evidence loop в актуальном состоянии и обновлять refs на каждом security-critical merge"
    : !input
      ? "создать security-reviewed-evidence input-контракт и повторить status"
      : !dependencyReviewVerified
        ? directPushWithoutPrTrace
          ? "текущий head попал в main без PR trace; нужен новый минимальный follow-up PR-backed cycle, чтобы получить dependency review и reviewer refs"
          : "собрать первый PR-backed dependency review cycle, привязать prNumber/runId к текущему head и добавить reviewer refs"
        : !reviewerLoopBound
          ? "добавить reviewer-backed refs в reviewScope и provenance/dependency-review metadata"
          : "обновить run refs или устранить mismatch/issues и повторить status";

  const report = {
    generatedAt: new Date().toISOString(),
    track: "R3",
    input: rel(INPUT_JSON),
    status,
    issues,
    evidenceRefs: [
      rel(INPUT_JSON),
      "docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md",
      ".github/workflows/codeql-analysis.yml",
      ".github/workflows/security-audit.yml",
      ".github/workflows/dependency-review.yml",
    ],
    nextAction,
    verdict,
    repository: {
      owner: context.repository.owner,
      name: context.repository.name,
      currentHeadSha,
      currentBranch,
      originUrl,
      remoteVerifiedAgainstGit: Boolean(
        remoteFromGit &&
        remoteFromGit.owner === context.repository.owner &&
        remoteFromGit.name === context.repository.name,
      ),
    },
    reviewScope: {
      owner: asNonEmptyString(reviewScope.owner),
      reviewedAt: asNonEmptyString(reviewScope.reviewedAt),
      headSha: asNonEmptyString(reviewScope.headSha),
      headBranch: asNonEmptyString(reviewScope.headBranch),
      reviewerRefs,
      notes: asNonEmptyString(reviewScope.notes),
    },
    controls: {
      codeql,
      securityBaseline,
      dependencyReview,
      provenance,
    },
    checks: {
      baseInfrastructureVerified,
      provenanceInfrastructureVerified,
      dependencyReviewVerified,
      reviewerLoopBound,
      directPushWithoutPrTrace,
      commitPullsForHead: commitPulls.length,
      inputHeadMatchesCurrent: currentHeadSha !== "unknown" && asNonEmptyString(reviewScope.headSha) === currentHeadSha,
      inputBranchMatchesCurrent: currentBranch !== "unknown" && asNonEmptyString(reviewScope.headBranch) === currentBranch,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    "# Security Reviewed Evidence Status",
    "",
    `- generated_at: \`${report.generatedAt}\``,
    `- track: \`${report.track}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- input: \`${report.input}\``,
    `- next_action: ${report.nextAction}`,
    "",
    "## Review Scope",
    "",
    `- repository: \`${report.repository.owner}/${report.repository.name}\``,
    `- current_head_sha: \`${report.repository.currentHeadSha}\``,
    `- current_branch: \`${report.repository.currentBranch}\``,
    `- review_owner: \`${report.reviewScope.owner || "-"}\``,
    `- reviewed_at: \`${report.reviewScope.reviewedAt || "-"}\``,
    `- reviewer_refs: \`${report.reviewScope.reviewerRefs.length}\``,
    `- remote_verified_against_git: \`${report.repository.remoteVerifiedAgainstGit ? "yes" : "no"}\``,
    "",
    "## Controls",
    renderControlTable(controlRows),
    "",
    "## Issues",
    renderIssuesMarkdown(report.issues),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log("[security-reviewed-evidence-status] summary");
  console.log(`- status=${status}`);
  console.log(`- verdict=${verdict}`);
  console.log(`- issues=${issues.length}`);
  console.log(`- report_json=${rel(REPORT_JSON)}`);
  console.log(`- report_md=${rel(REPORT_MD)}`);

  if (mode === "enforce" && (status !== "done" || issues.length > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[security-reviewed-evidence-status] fatal ${error.message}`);
  process.exit(1);
});

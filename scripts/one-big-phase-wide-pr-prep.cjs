#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'var', 'execution');
const JSON_PATH = path.join(OUTPUT_DIR, 'one-big-phase-wide-pr-prep.json');
const MD_PATH = path.join(OUTPUT_DIR, 'one-big-phase-wide-pr-prep.md');

function runGit(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function statusLabel(entry) {
  return entry.indexStatus === '?' && entry.worktreeStatus === '?' ? '??' : `${entry.indexStatus}${entry.worktreeStatus}`;
}

function parsePorcelainZ(buffer) {
  const text = buffer.toString('utf8');
  const chunks = text.split('\0').filter(Boolean);
  const entries = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const indexStatus = chunk[0] || ' ';
    const worktreeStatus = chunk[1] || ' ';
    let filePath = chunk.slice(3);

    if ((indexStatus === 'R' || indexStatus === 'C') && chunks[i + 1]) {
      filePath = chunks[i + 1];
      i += 1;
    }

    entries.push({
      indexStatus,
      worktreeStatus,
      path: filePath,
    });
  }

  return entries;
}

function matchesAny(filePath, prefixes) {
  return prefixes.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}/`));
}

function classify(filePath) {
  if (filePath === '.codex' || filePath.startsWith('.codex/')) {
    return 'local_only_noise';
  }
  if (filePath === 'memory-bank/analytics' || filePath.startsWith('memory-bank/analytics/')) {
    return 'local_only_noise';
  }

  if (
    matchesAny(filePath, [
      'apps/api/src/modules/tech-map',
      'apps/api/src/shared/tech-map',
      'docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md',
    ])
  ) {
    return 'phase_b_governed_core_and_techmap';
  }

  if (
    matchesAny(filePath, [
      'apps/api/src/modules/front-office',
      'apps/api/src/modules/front-office-draft',
      'apps/api/src/modules/rai-chat',
      'apps/api/src/shared/auth',
      'apps/api/src/shared/front-office',
      'apps/api/src/shared/rai-chat',
      'apps/web/app/(app)',
      'apps/web/app/api/ai-chat',
      'apps/web/components/front-office',
      'apps/web/components/layouts',
      'apps/web/core/governance',
      'apps/web/lib/api',
      'apps/web/lib/config',
      'apps/web/lib/consulting',
      'apps/web/shared/components',
      'apps/web/__tests__',
      'docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md',
    ]) || filePath === 'apps/web/middleware.ts'
  ) {
    return 'phase_c_web_access_and_governed_chat';
  }

  if (
    matchesAny(filePath, [
      'scripts/phase-d-dr-status.cjs',
      'scripts/phase-d-install-dry-run.cjs',
      'scripts/phase-d-install-status.cjs',
      'scripts/phase-d-ops-drill.cjs',
      'scripts/phase-d-ops-status.cjs',
      'scripts/phase-d-pilot-intake.cjs',
      'scripts/phase-d-pilot-status.cjs',
      'scripts/phase-d-pilot-transition.cjs',
      'scripts/phase-d-restore-drill.cjs',
      'scripts/phase-d-status.cjs',
      'scripts/phase-d-upgrade-rehearsal.cjs',
      'docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md',
    ])
  ) {
    return 'phase_d_self_host_and_hardening';
  }

  if (
    matchesAny(filePath, [
      'scripts/phase-e-governance-status.cjs',
      'scripts/phase-e-legal-status.cjs',
      'scripts/phase-e-ops-drill.cjs',
      'scripts/phase-e-ops-status.cjs',
      'scripts/phase-e-pilot-intake.cjs',
      'scripts/phase-e-pilot-status.cjs',
      'scripts/phase-e-pilot-transition.cjs',
      'scripts/phase-e-status.cjs',
      'docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_EXECUTION_BOARD.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_IMPLEMENTATION_PLAN.md',
      'docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md',
    ])
  ) {
    return 'phase_e_managed_deployment_and_governance';
  }

  if (
    matchesAny(filePath, [
      'scripts/security-reviewed-evidence-status.cjs',
      'scripts/security-reviewed-evidence-packet.cjs',
      'scripts/security-reviewed-evidence-pr-lookup.cjs',
      'scripts/security-reviewed-evidence-intake.cjs',
      'scripts/security-reviewed-evidence-reconcile.cjs',
      'scripts/workspace-secret-hygiene-inventory.cjs',
      'scripts/workspace-secret-hygiene-remediation-packet.cjs',
      'scripts/post-big-phase-internal-residual-status.cjs',
      'scripts/post-big-phase-internal-residual-reconcile.cjs',
      'scripts/post-big-phase-internal-residual-run-card.cjs',
      'scripts/post-big-phase-internal-residual-pr-template.cjs',
      'scripts/post-big-phase-internal-residual-handoff-index.cjs',
      'scripts/post-big-phase-internal-residual-command-template.cjs',
      'scripts/post-big-phase-internal-residual-bundle.cjs',
      'docs/07_EXECUTION/ONE_BIG_PHASE/POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md',
    ]) || filePath === 'package.json' || filePath === 'pnpm-lock.yaml'
  ) {
    return 'post_big_phase_internal_residual_appsec';
  }

  if (
    matchesAny(filePath, [
      'docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md',
      'docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md',
      'docs/DOCS_MATRIX.md',
      'memory-bank/TRACELOG.md',
      'memory-bank/activeContext.md',
      'memory-bank/progress.md',
      'scripts/doc-lint-matrix.cjs',
      'scripts/lint-docs.cjs',
      'scripts/phase-a-external-blockers-packet.cjs',
      'scripts/phase-a-status.cjs',
      'scripts/legal-evidence-handoff.cjs',
      'scripts/one-big-phase-wide-pr-prep.cjs',
      'scripts/one-big-phase-wide-pr-command-template.cjs',
    ])
  ) {
    return 'closeout_navigation_and_governance_sync';
  }

  if (matchesAny(filePath, ['docs/00_STRATEGY/TECHMAP'])) {
    return 'techmap_frontmatter_repair';
  }

  return 'unclassified';
}

function buildSection(key, title, purpose, files) {
  return {
    key,
    title,
    purpose,
    fileCount: files.length,
    files,
  };
}

function main() {
  const entries = parsePorcelainZ(runGit(['status', '--porcelain', '-z']));
  const sections = new Map();
  const localOnly = [];
  const unclassified = [];
  const statusCounts = {};

  for (const entry of entries) {
    const label = statusLabel(entry);
    statusCounts[label] = (statusCounts[label] || 0) + 1;
    const bucket = classify(entry.path);
    const record = { status: label, path: entry.path };

    if (bucket === 'local_only_noise') {
      localOnly.push(record);
      continue;
    }
    if (bucket === 'unclassified') {
      unclassified.push(record);
      continue;
    }
    if (!sections.has(bucket)) {
      sections.set(bucket, []);
    }
    sections.get(bucket).push(record);
  }

  const orderedSections = [
    buildSection(
      'phase_b_governed_core_and_techmap',
      'Phase B: governed core and TechMap',
      'Governed core, `TechMap` runtime, workflow orchestration и связанные execution-документы `Phase B`.',
      sections.get('phase_b_governed_core_and_techmap') || [],
    ),
    buildSection(
      'phase_c_web_access_and_governed_chat',
      'Phase C: web access and governed chat',
      'Стабилизация внешнего front-office, route guards, governed `AiChat` и связанных API/UI контрактов.',
      sections.get('phase_c_web_access_and_governed_chat') || [],
    ),
    buildSection(
      'phase_d_self_host_and_hardening',
      'Phase D: self-host and hardening',
      'Self-host installability, recovery, ops drill и pilot-hardening контур.',
      sections.get('phase_d_self_host_and_hardening') || [],
    ),
    buildSection(
      'phase_e_managed_deployment_and_governance',
      'Phase E: managed deployment and governance',
      'Tier 2 managed deployment, governance, legal и pilot-contour scripts/docs.',
      sections.get('phase_e_managed_deployment_and_governance') || [],
    ),
    buildSection(
      'post_big_phase_internal_residual_appsec',
      'Post-big-phase residual AppSec',
      'Residual `R1/R2/R3` контур: dependency hygiene, workspace secrets, reviewed evidence loop и handoff artifacts.',
      sections.get('post_big_phase_internal_residual_appsec') || [],
    ),
    buildSection(
      'closeout_navigation_and_governance_sync',
      'Closeout, navigation and governance sync',
      'Синхронизация `INDEX`, closeout, docs registry, memory-bank и docs-lint/governance wrappers.',
      sections.get('closeout_navigation_and_governance_sync') || [],
    ),
    buildSection(
      'techmap_frontmatter_repair',
      'TechMap frontmatter repair',
      'Ремонт общего docs-lint через минимальный frontmatter для legacy-active `TECHMAP` документов.',
      sections.get('techmap_frontmatter_repair') || [],
    ),
  ].filter((section) => section.fileCount > 0);

  const report = {
    generatedAt: new Date().toISOString(),
    track: 'ONE_BIG_PHASE_WIDE_PR_PREP',
    status: unclassified.length === 0 ? 'prepared' : 'needs_attention',
    verdict: unclassified.length === 0 ? 'wide_pr_changeset_prepared' : 'wide_pr_changeset_has_unclassified_files',
    branchName: 'execution/one-big-phase-bcde-closeout-and-residual',
    title: 'Execution: close Phase B-E and package residual AppSec handoff',
    purpose: 'Подготовить один широкий PR для накопленного execution-пакета `Phase B/C/D/E + closeout + residual AppSec`, не смешивая его с local-only шумом.',
    statusCounts,
    sections: orderedSections,
    localOnlyNoise: localOnly,
    unclassified,
    includeRecommendations: {
      include: orderedSections.map((section) => section.key),
      exclude: localOnly.map((entry) => entry.path),
    },
    prBodyOutline: [
      'Phase B: governed core and TechMap runtime/workflow closure.',
      'Phase C: web access, route guards, governed chat continuity and explainability surface.',
      'Phase D: self-host installability, restore drills, ops hardening and pilot contour.',
      'Phase E: managed deployment governance, legal closure and pilot wave gate contour.',
      'Post-big-phase residual: AppSec hygiene, reviewed evidence loop tooling and handoff bundle.',
      'Closeout sync: navigation, docs registry, memory-bank and docs-lint/governance wrapper repairs.',
    ],
    nextAction: unclassified.length === 0
      ? 'Stage only the classified sections, exclude local-only noise, then open one broad PR with the generated title/body outline.'
      : 'Resolve unclassified files before staging the broad PR to avoid accidental scope leakage.',
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);

  const mdLines = [
    '# ONE BIG PHASE Wide PR Prep',
    '',
    `- generated_at: \`${report.generatedAt}\``,
    `- status: \`${report.status}\``,
    `- verdict: \`${report.verdict}\``,
    `- branch_name: \`${report.branchName}\``,
    `- title: ${report.title}`,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Sections',
    '',
  ];

  for (const section of orderedSections) {
    mdLines.push(`### ${section.title}`);
    mdLines.push('');
    mdLines.push(`- purpose: ${section.purpose}`);
    mdLines.push(`- file_count: ${section.fileCount}`);
    for (const entry of section.files) {
      mdLines.push(`- [${entry.status}] \`${entry.path}\``);
    }
    mdLines.push('');
  }

  mdLines.push('## Exclude From Broad PR');
  mdLines.push('');
  if (localOnly.length > 0) {
    for (const entry of localOnly) {
      mdLines.push(`- [${entry.status}] \`${entry.path}\``);
    }
  } else {
    mdLines.push('- none');
  }
  mdLines.push('');
  mdLines.push('## Unclassified');
  mdLines.push('');
  if (unclassified.length > 0) {
    for (const entry of unclassified) {
      mdLines.push(`- [${entry.status}] \`${entry.path}\``);
    }
  } else {
    mdLines.push('- none');
  }
  mdLines.push('');
  mdLines.push('## PR Body Outline');
  mdLines.push('');
  for (const item of report.prBodyOutline) {
    mdLines.push(`- ${item}`);
  }
  mdLines.push('');
  mdLines.push('## Next Action');
  mdLines.push('');
  mdLines.push(`- ${report.nextAction}`);
  mdLines.push('');

  fs.writeFileSync(MD_PATH, `${mdLines.join('\n')}\n`);

  console.log('[one-big-phase-wide-pr-prep] summary');
  console.log(`- status=${report.status}`);
  console.log(`- verdict=${report.verdict}`);
  console.log(`- sections=${orderedSections.length}`);
  console.log(`- local_only_noise=${localOnly.length}`);
  console.log(`- unclassified=${unclassified.length}`);
  console.log(`- report_json=${rel(JSON_PATH)}`);
  console.log(`- report_md=${rel(MD_PATH)}`);
}

main();

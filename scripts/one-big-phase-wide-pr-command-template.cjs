#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXEC_DIR = path.join(ROOT, 'var', 'execution');
const PREP_JSON = path.join(EXEC_DIR, 'one-big-phase-wide-pr-prep.json');
const SH_PATH = path.join(EXEC_DIR, 'one-big-phase-wide-pr-commands.template.sh');
const MD_PATH = path.join(EXEC_DIR, 'one-big-phase-wide-pr-run-card.md');
const JSON_PATH = path.join(EXEC_DIR, 'one-big-phase-wide-pr-run-card.json');

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function main() {
  if (!fs.existsSync(PREP_JSON)) {
    console.error('[one-big-phase-wide-pr-command-template] missing var/execution/one-big-phase-wide-pr-prep.json; run pnpm execution:one-big-phase:wide-pr-prep first');
    process.exit(1);
  }

  const prep = JSON.parse(fs.readFileSync(PREP_JSON, 'utf8'));
  const includePaths = prep.sections.flatMap((section) => section.files.map((file) => file.path));
  const excludePaths = (prep.localOnlyNoise || []).map((file) => file.path);

  const script = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    `BRANCH_NAME="${prep.branchName}"`,
    `COMMIT_MESSAGE="${prep.title}"`,
    '',
    '# 1. Create or switch to the prepared branch',
    'git checkout -b "$BRANCH_NAME"',
    '',
    '# 2. Stage the classified one-big-phase execution changeset',
    'git add \\',
    ...includePaths.map((item, index) => `  "${item}"${index === includePaths.length - 1 ? '' : ' \\'}`),
    '',
    '# 3. Explicitly keep local-only noise out of the PR',
    ...excludePaths.map((item) => `git restore --staged --worktree -- "${item}" 2>/dev/null || true`),
    '',
    '# 4. Review the staged result before commit',
    'git status --short',
    'git diff --cached --stat',
    '',
    '# 5. Commit after manual review',
    'git commit -m "$COMMIT_MESSAGE"',
    '',
    '# 6. Push and open PR manually in your normal flow',
    '# git push -u origin "$BRANCH_NAME"',
    '',
  ].join('\n');

  fs.writeFileSync(SH_PATH, `${script}\n`, { mode: 0o755 });

  const runCard = {
    generatedAt: new Date().toISOString(),
    track: 'ONE_BIG_PHASE_WIDE_PR_PREP',
    status: prep.status,
    verdict: prep.verdict,
    branchName: prep.branchName,
    title: prep.title,
    prepReport: rel(PREP_JSON),
    commandTemplate: rel(SH_PATH),
    includeSections: prep.sections.map((section) => ({
      key: section.key,
      title: section.title,
      fileCount: section.fileCount,
    })),
    excludePaths,
    operatorChecklist: [
      'Run pnpm execution:one-big-phase:wide-pr-prep to refresh the classified changeset.',
      'Open one-big-phase-wide-pr-run-card.md and verify the include/exclude lists.',
      'Run one-big-phase-wide-pr-commands.template.sh to create the branch and stage the classified files.',
      'Review git status and git diff --cached --stat before commit.',
      'Commit, push and open the broad execution PR using the prepared title and body outline.',
    ],
    nextAction: 'Execute the shell template, review the staged diff and open the broad execution PR.',
  };

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(runCard, null, 2)}\n`);

  const md = [
    '# ONE BIG PHASE Wide PR Run Card',
    '',
    `- generated_at: \`${runCard.generatedAt}\``,
    `- status: \`${runCard.status}\``,
    `- verdict: \`${runCard.verdict}\``,
    `- branch_name: \`${runCard.branchName}\``,
    `- title: ${runCard.title}`,
    `- prep_report: \`${runCard.prepReport}\``,
    `- command_template: \`${runCard.commandTemplate}\``,
    '',
    '## Include Sections',
    '',
    ...runCard.includeSections.map((section) => `- ${section.title} (${section.fileCount})`),
    '',
    '## Exclude Paths',
    '',
    ...(excludePaths.length ? excludePaths.map((item) => `- \`${item}\``) : ['- none']),
    '',
    '## Operator Checklist',
    '',
    ...runCard.operatorChecklist.map((item) => `- ${item}`),
    '',
    '## Next Action',
    '',
    `- ${runCard.nextAction}`,
    '',
  ].join('\n');

  fs.writeFileSync(MD_PATH, `${md}\n`);

  console.log('[one-big-phase-wide-pr-command-template] summary');
  console.log(`- command_template=${rel(SH_PATH)}`);
  console.log(`- run_card_json=${rel(JSON_PATH)}`);
  console.log(`- run_card_md=${rel(MD_PATH)}`);
}

main();

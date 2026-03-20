const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const AUDIT = path.join(DOCS, '_audit');
const CLASS_MATRIX = path.join(AUDIT, 'CLASSIFICATION_MATRIX.md');
const DOCS_MATRIX = path.join(DOCS, 'DOCS_MATRIX.md');
const SLA_DOC = path.join(DOCS, '05_OPERATIONS', 'DOC_FRESHNESS_SLA.md');
const ALLOWED_ROOT = new Set(['README.md', 'INDEX.md', 'DOCS_MATRIX.md', 'CONTRIBUTING_DOCS.md']);
const TODAY = new Date('2026-03-20T00:00:00Z');

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function parseClassification() {
  if (!fs.existsSync(CLASS_MATRIX)) return [];
  const lines = fs.readFileSync(CLASS_MATRIX, 'utf8').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (!line.startsWith('| ') || line.includes('Документ') || line.includes('---')) continue;
    const cols = line.split('|').map((s) => s.trim()).filter(Boolean);
    if (cols.length < 2) continue;
    const doc = cols[0];
    const cls = cols[1];
    if (cls === 'CORE' || cls === 'SUPPORTING') out.push({ doc, cls });
  }
  return out;
}

function parseDocsMatrixClaims() {
  if (!fs.existsSync(DOCS_MATRIX)) return new Set();
  const lines = fs.readFileSync(DOCS_MATRIX, 'utf8').split(/\r?\n/);
  const out = new Set();
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map((s) => s.trim()).filter(Boolean);
    if (cols.length < 1 || cols[0] === 'Claim' || cols[0] === '---') continue;
    out.add(cols[0]);
  }
  return out;
}

function parseSla() {
  const fallback = { CORE: 30, SUPPORTING: 45 };
  if (!fs.existsSync(SLA_DOC)) return fallback;
  const txt = fs.readFileSync(SLA_DOC, 'utf8');
  const core = txt.match(/CORE\s*:\s*(\d+)/i);
  const sup = txt.match(/SUPPORTING\s*:\s*(\d+)/i);
  return {
    CORE: core ? Number(core[1]) : fallback.CORE,
    SUPPORTING: sup ? Number(sup[1]) : fallback.SUPPORTING
  };
}

function daysOld(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 3600 * 24));
}

function checkLinksInFile(abs, rel, errors) {
  const txt = fs.readFileSync(abs, 'utf8');
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(txt))) {
    const u = m[1];
    if (/^https?:\/\//i.test(u) || u.startsWith('#') || u.startsWith('mailto:')) continue;
    if (u.includes('file:///f:/') || u.includes('/root/RAI_EP')) {
      errors.push(`forbidden absolute link in ${rel}: ${u}`);
    }
    const decoded = decodeURIComponent(u.split('#')[0]);
    if (decoded.startsWith('/')) {
      errors.push(`absolute path link in ${rel}: ${u}`);
    }
  }
}

function main() {
  const errors = [];

  try {
    cp.execSync('node scripts/doc-lint-matrix.cjs --fail-on-mismatch --strict-version', { stdio: 'pipe' });
  } catch (_e) {
    errors.push('doc-lint-matrix:strict failed');
  }

  const rootFiles = fs
    .readdirSync(DOCS, { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name);

  for (const f of rootFiles) {
    if (!ALLOWED_ROOT.has(f)) errors.push(`root-junk: ${f}`);
  }

  if (!fs.existsSync(DOCS_MATRIX)) {
    errors.push('DOCS_MATRIX.md missing');
  }

  const clsRows = parseClassification();
  const claims = parseDocsMatrixClaims();
  const sla = parseSla();

  for (const row of clsRows) {
    const rel = row.doc;
    const abs = path.join(DOCS, rel);
    if (!fs.existsSync(abs)) {
      errors.push(`classified doc missing: ${rel}`);
      continue;
    }
    if (!rel.endsWith('.md')) continue;

    const fm = parseFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    const claimId = fm.claim_id;
    const claimStatus = fm.claim_status;
    const verifiedBy = fm.verified_by;
    const evidenceRefs = fm.evidence_refs;
    const lastVerified = fm.last_verified || fm.last_updated;

    if (!claimId) {
      errors.push(`claim_id missing: ${rel}`);
      continue;
    }
    if (!claims.has(claimId)) errors.push(`claim not in DOCS_MATRIX: ${claimId} (${rel})`);
    if (!claimStatus) errors.push(`claim_status missing: ${rel}`);
    if (!verifiedBy) errors.push(`verified_by missing: ${rel}`);
    if (!evidenceRefs) errors.push(`evidence_refs missing: ${rel}`);

    const maxAge = row.cls === 'CORE' ? sla.CORE : sla.SUPPORTING;
    const age = daysOld(lastVerified);
    if (!Number.isFinite(age) || age > maxAge) {
      errors.push(`stale doc: ${rel} age=${age}d max=${maxAge}d`);
    }
  }

  const readme = path.join(DOCS, 'README.md');
  const index = path.join(DOCS, 'INDEX.md');
  if (fs.existsSync(readme)) checkLinksInFile(readme, 'README.md', errors);
  if (fs.existsSync(index)) checkLinksInFile(index, 'INDEX.md', errors);

  console.log('Docs Lint Report');
  console.log(`- Errors: ${errors.length}`);
  for (const e of errors) console.log(`- ERROR: ${e}`);

  if (errors.length > 0) process.exit(1);
}

main();

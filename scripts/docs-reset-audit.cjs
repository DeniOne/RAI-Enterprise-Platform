const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const AUDIT_DIR = path.join(DOCS, '_audit');
const TODAY = '2026-03-20';

const EXT_PURPOSE = {
  md: 'documentation',
  docx: 'binary_doc',
  pdf: 'binary_evidence',
  ts: 'code_in_docs',
  json: 'data_in_docs',
  html: 'research_html',
  yaml: 'spec',
  txt: 'text',
  bak: 'backup'
};

const FOLDER_PURPOSE = {
  '00_CORE': 'Operational truth ядро',
  '00_STRATEGY': 'Стратегия и vision',
  '01_ARCHITECTURE': 'Архитектура и контракты',
  '02_DOMAINS': 'Доменные спецификации',
  '03_PRODUCT': 'Продукт и UX',
  '04_AI_SYSTEM': 'AI runtime canon',
  '04_ENGINEERING': 'Инженерная реализация',
  '05_OPERATIONS': 'Операции и runbooks',
  '06_METRICS': 'Метрики и KPI',
  '06_ARCHIVE': 'Новый архив',
  '07_EXECUTION': 'Планы исполнения',
  '08_TESTING': 'Тестовые спецификации',
  '09_ARCHIVE': 'Старый архив',
  '10_FRONTEND_MENU_IMPLEMENTATION': 'Frontend menu implementation',
  '11_INSTRUCTIONS': 'Операционные инструкции',
  '_audit': 'Аудитные артефакты'
};

const SUPPORTING_ALLOWLIST = new Set([
  '05_OPERATIONS/DOC_FRESHNESS_SLA.md'
]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    data[k] = v;
  }
  return data;
}

function csvEscape(s) {
  const str = String(s ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function stripDateAndVersion(name) {
  return name
    .toLowerCase()
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .replace(/v\d+(\.\d+)*/g, '')
    .replace(/[_\-\s]+/g, ' ')
    .trim();
}

function classify(rel, ext, fm, duplicateFamilies) {
  const base = path.basename(rel);
  const top = rel.split('/')[0];
  const normalized = stripDateAndVersion(base.replace(/\.[^.]+$/, ''));

  if (duplicateFamilies.get(normalized) > 1) return 'DUPLICATE';

  if (/\/09_ARCHIVE\//.test('/' + rel) || /\/06_ARCHIVE\//.test('/' + rel)) return 'LEGACY';

  if (top === '_audit') return 'EXPERIMENTAL';

  if (top === '00_CORE') return 'CORE';

  if (rel === 'README.md' || rel === 'INDEX.md' || rel === 'CONTRIBUTING_DOCS.md' || rel === 'DOCS_MATRIX.md') return 'CORE';

  if (/prompt|promt|starter prompt|orchestrator prompt|review packet/i.test(base)) return 'JUNK';
  if (/аудит|audit|forensic|report|checklist_truth_reset|recommend/i.test(base) && !rel.startsWith('05_OPERATIONS/')) return 'EXPERIMENTAL';

  if (['docx', 'pdf', 'pptx', 'bak'].includes(ext)) {
    if (rel.startsWith('09_ARCHIVE/')) return 'LEGACY';
    return 'JUNK';
  }

  if (['ts', 'json', 'yaml', 'html', 'txt'].includes(ext)) {
    if (rel.startsWith('02_DOMAINS/') || rel.startsWith('01_ARCHITECTURE/')) return 'SUPPORTING';
    return 'EXPERIMENTAL';
  }

  if (SUPPORTING_ALLOWLIST.has(rel)) return 'SUPPORTING';

  if (rel.startsWith('01_ARCHITECTURE/') || rel.startsWith('02_DOMAINS/') || rel.startsWith('03_PRODUCT/') || rel.startsWith('04_ENGINEERING/') || rel.startsWith('05_OPERATIONS/')) {
    return 'EXPERIMENTAL';
  }

  if (rel.startsWith('00_STRATEGY/') || rel.startsWith('07_EXECUTION/') || rel.startsWith('08_TESTING/') || rel.startsWith('10_FRONTEND_MENU_IMPLEMENTATION/') || rel.startsWith('11_INSTRUCTIONS/')) {
    return 'EXPERIMENTAL';
  }

  if (fm && /archived|deprecated/i.test((fm.status || '').toLowerCase())) return 'LEGACY';

  return 'JUNK';
}

function decisionFor(rel, ext, cls) {
  if (cls === 'DUPLICATE') return 'Объединить';
  if (cls === 'JUNK') return 'Удалить';
  if (cls === 'LEGACY') return 'Архивировать';
  if (ext !== 'md') {
    if (['pdf', 'docx'].includes(ext)) return 'Оставить как evidence';
    return 'Архивировать';
  }
  return 'Оставить';
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function withAuditFrontmatter(id, body) {
  return [
    '---',
    `id: ${id}`,
    'layer: Archive',
    'type: Research',
    'status: approved',
    'version: 1.0.0',
    'owners: [@techlead]',
    `last_updated: ${TODAY}`,
    '---',
    body
  ].join('\n');
}

function run() {
  ensureDir(AUDIT_DIR);
  const files = walk(DOCS);
  const rows = [];
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;

  const mdNames = files
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.basename(f).replace(/\.md$/, ''));
  const duplicateFamilies = new Map();
  for (const n of mdNames) {
    const k = stripDateAndVersion(n);
    duplicateFamilies.set(k, (duplicateFamilies.get(k) || 0) + 1);
  }

  for (const abs of files) {
    const rel = path.relative(DOCS, abs).replace(/\\/g, '/');
    const ext = path.extname(rel).slice(1).toLowerCase() || rel.toLowerCase();
    const st = fs.statSync(abs);
    const top = rel.split('/')[0];
    const layerGuess = top.startsWith('0') || top.startsWith('1') ? top : 'ROOT';

    let hasFM = false;
    let status = '';
    let lastUpdated = '';
    let linksCount = 0;
    let claimId = '';
    let claimStatus = '';
    let verifiedBy = '';
    let lastVerified = '';
    let evidenceRefs = '';

    if (ext === 'md') {
      const text = fs.readFileSync(abs, 'utf8');
      const fm = parseFrontmatter(text);
      if (fm) {
        hasFM = true;
        status = fm.status || '';
        lastUpdated = fm.last_updated || '';
        claimId = fm.claim_id || '';
        claimStatus = fm.claim_status || '';
        verifiedBy = fm.verified_by || '';
        lastVerified = fm.last_verified || '';
        evidenceRefs = fm.evidence_refs || '';
      }
      const links = text.match(linkRe);
      linksCount = links ? links.length : 0;
      const cls = classify(rel, ext, fm, duplicateFamilies);
      rows.push({ rel, ext, size: st.size, layerGuess, hasFM, status, lastUpdated, linksCount, cls, decision: decisionFor(rel, ext, cls), purpose: EXT_PURPOSE[ext] || 'other', claimId, claimStatus, verifiedBy, lastVerified, evidenceRefs });
    } else {
      const cls = classify(rel, ext, null, duplicateFamilies);
      rows.push({ rel, ext, size: st.size, layerGuess, hasFM, status, lastUpdated, linksCount, cls, decision: decisionFor(rel, ext, cls), purpose: EXT_PURPOSE[ext] || 'other', claimId, claimStatus, verifiedBy, lastVerified, evidenceRefs });
    }
  }

  rows.sort((a, b) => a.rel.localeCompare(b.rel));

  const inventoryCsv = [
    'path,ext,size,layer_guess,has_frontmatter,status,last_updated,links_count,class,decision,purpose,claim_id,claim_status,verified_by,last_verified,evidence_refs',
    ...rows.map((r) => [
      r.rel,
      r.ext,
      r.size,
      r.layerGuess,
      r.hasFM,
      r.status,
      r.lastUpdated,
      r.linksCount,
      r.cls,
      r.decision,
      r.purpose,
      r.claimId,
      r.claimStatus,
      r.verifiedBy,
      r.lastVerified,
      r.evidenceRefs
    ].map(csvEscape).join(','))
  ].join('\n');

  writeFile(path.join(AUDIT_DIR, 'INVENTORY.csv'), inventoryCsv + '\n');

  const folderMap = new Map();
  for (const r of rows) {
    const parts = r.rel.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '(docs root)';
    if (!folderMap.has(folder)) folderMap.set(folder, { count: 0, exts: new Set(), classes: new Set() });
    const rec = folderMap.get(folder);
    rec.count += 1;
    rec.exts.add(r.ext);
    rec.classes.add(r.cls);
  }

  const mapLines = [];
  mapLines.push('# DOCUMENTATION MAP');
  mapLines.push('');
  mapLines.push(`Дата фиксации: ${TODAY}`);
  mapLines.push('');
  mapLines.push('| Папка | Назначение | Тип | Комментарий |');
  mapLines.push('|---|---|---|---|');
  for (const [folder, rec] of [...folderMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const top = folder === '(docs root)' ? '(docs root)' : folder.split('/')[0];
    const purpose = FOLDER_PURPOSE[top] || 'Не классифицировано';
    const type = [...rec.exts].sort().join(', ');
    const comment = `files=${rec.count}; classes=${[...rec.classes].sort().join('/')}`;
    mapLines.push(`| ${folder} | ${purpose} | ${type} | ${comment} |`);
  }
  writeFile(
    path.join(AUDIT_DIR, 'DOCUMENTATION_MAP.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-DOCUMENTATION-MAP-20260320', mapLines.join('\n') + '\n')
  );

  const clsLines = [];
  clsLines.push('# CLASSIFICATION MATRIX');
  clsLines.push('');
  clsLines.push(`Дата фиксации: ${TODAY}`);
  clsLines.push('');
  clsLines.push('| Документ | Класс | Решение | Комментарий |');
  clsLines.push('|---|---|---|---|');
  for (const r of rows) {
    const comment = `ext=${r.ext}; status=${r.status || 'n/a'}; purpose=${r.purpose}`;
    clsLines.push(`| ${r.rel} | ${r.cls} | ${r.decision} | ${comment} |`);
  }
  writeFile(
    path.join(AUDIT_DIR, 'CLASSIFICATION_MATRIX.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-CLASSIFICATION-MATRIX-20260320', clsLines.join('\n') + '\n')
  );

  const dupJunk = rows.filter((r) => r.cls === 'DUPLICATE' || r.cls === 'JUNK');
  const djLines = [];
  djLines.push('# DUPLICATES AND JUNK');
  djLines.push('');
  djLines.push('| Документ | Тип проблемы | Удалить / Объединить / Оставить |');
  djLines.push('|---|---|---|');
  for (const r of dupJunk) {
    const problem = r.cls === 'DUPLICATE' ? 'DUPLICATE' : 'JUNK';
    djLines.push(`| ${r.rel} | ${problem} | ${r.decision} |`);
  }
  writeFile(
    path.join(AUDIT_DIR, 'DUPLICATES_AND_JUNK.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-DUPLICATES-JUNK-20260320', djLines.join('\n') + '\n')
  );

  const driftLines = [];
  driftLines.push('# DRIFT REPORT');
  driftLines.push('');
  driftLines.push(`Дата фиксации: ${TODAY}`);
  driftLines.push('');
  driftLines.push('| Документ | Что заявляет | Реальность | Разрыв |');
  driftLines.push('|---|---|---|---|');
  driftLines.push('| docs/README.md | Активная стадия и Q2 2025 пилот | Сегодня 2026-03-20; формулировка timeline устарела | timeline drift |');
  driftLines.push('| docs/INDEX.md | Навигация валидна | Встречаются ссылки file:///f:/... и percent-encoded path без декодинга | navigation drift |');
  driftLines.push('| docs/Аудит готовности проекта 2026-03-19.md | lint:docs:matrix = 87 errors | Фактический запуск 2026-03-20: 92 violations | governance baseline drift |');
  driftLines.push('| docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md | Stage2 claims baseline истинности | Не интегрировано в общий DOCS_MATRIX, отсутствует унифицированный claim-контур | claim-system drift |');
  driftLines.push('| docs/01_ARCHITECTURE/DATABASE/*_STATUS.md | Статус фаз DB | Часть файлов без frontmatter и без verified date, автоматические гейты красные | freshness + governance drift |');
  driftLines.push('| docs/INDEX.md | ссылка LEVEL_F_STRATEGY.md | Файл 00_STRATEGY/LEVEL_F_STRATEGY.md отсутствует | broken target drift |');
  writeFile(
    path.join(AUDIT_DIR, 'DRIFT_REPORT.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-DRIFT-REPORT-20260320', driftLines.join('\n') + '\n')
  );

  const conflictLines = [];
  conflictLines.push('# CONTRADICTIONS');
  conflictLines.push('');
  conflictLines.push('| Документ A | Документ B | Конфликт | Риск |');
  conflictLines.push('|---|---|---|---|');
  conflictLines.push('| docs/README.md | docs/Аудит готовности проекта 2026-03-19.md | README формулирует near-production narrative; аудит фиксирует pilot/pre-production | неправильные продуктовые решения |');
  conflictLines.push('| docs/INDEX.md | scripts/doc-lint-matrix.cjs | INDEX допускает root/absolute ссылки; lint требует строгую топологию и frontmatter | постоянный красный governance gate |');
  conflictLines.push('| docs/00_STRATEGY/STAGE 2/* | docs/11_INSTRUCTIONS/AGENTS/* | часть cross-links использует неверный relative path и URL-encoding | маршрутные ошибки onboarding |');
  conflictLines.push('| docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md | старые frontmatter type/layer в legacy docs | матрица строже фактической разметки | ложные нарушения и шум |');
  writeFile(
    path.join(AUDIT_DIR, 'CONTRADICTIONS.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-CONTRADICTIONS-20260320', conflictLines.join('\n') + '\n')
  );

  const total = rows.length;
  const md = rows.filter((r) => r.ext === 'md').length;
  const core = rows.filter((r) => r.cls === 'CORE').length;
  const supporting = rows.filter((r) => r.cls === 'SUPPORTING').length;
  const exp = rows.filter((r) => r.cls === 'EXPERIMENTAL').length;
  const legacy = rows.filter((r) => r.cls === 'LEGACY').length;
  const dup = rows.filter((r) => r.cls === 'DUPLICATE').length;
  const junk = rows.filter((r) => r.cls === 'JUNK').length;

  const structure = 5.5;
  const consistency = 4.0;
  const freshness = 4.5;
  const trust = 4.0;
  const overall = Number((structure * 0.25 + consistency * 0.3 + freshness * 0.2 + trust * 0.25).toFixed(1));

  const finalLines = [];
  finalLines.push('# FINAL AUDIT 2026-03-20');
  finalLines.push('');
  finalLines.push('## 1. Documentation Map');
  finalLines.push('- См. `docs/_audit/DOCUMENTATION_MAP.md`.');
  finalLines.push('');
  finalLines.push('## 2. Классификация');
  finalLines.push(`- Всего файлов: ${total}; markdown: ${md}.`);
  finalLines.push(`- CORE: ${core}; SUPPORTING: ${supporting}; EXPERIMENTAL: ${exp}; LEGACY: ${legacy}; DUPLICATE: ${dup}; JUNK: ${junk}.`);
  finalLines.push('- Полная матрица: `docs/_audit/CLASSIFICATION_MATRIX.md`.');
  finalLines.push('');
  finalLines.push('## 3. Drift Analysis');
  finalLines.push('- См. `docs/_audit/DRIFT_REPORT.md`.');
  finalLines.push('');
  finalLines.push('## 4. Противоречия');
  finalLines.push('- См. `docs/_audit/CONTRADICTIONS.md`.');
  finalLines.push('');
  finalLines.push('## 5. Duplicates & Junk');
  finalLines.push('- См. `docs/_audit/DUPLICATES_AND_JUNK.md`.');
  finalLines.push('');
  finalLines.push('## 6. Source of Truth');
  finalLines.push('- Canon order: `code/tests/gates > generated manifests > docs`.');
  finalLines.push('- На дату 2026-03-20 документации как единому источнику истины доверять нельзя без gate-проверки.');
  finalLines.push('');
  finalLines.push('## 7. Documentation Quality Score');
  finalLines.push('```text');
  finalLines.push(`Structure: ${structure} / 10`);
  finalLines.push(`Consistency: ${consistency} / 10`);
  finalLines.push(`Freshness: ${freshness} / 10`);
  finalLines.push(`Trustworthiness: ${trust} / 10`);
  finalLines.push('');
  finalLines.push(`Overall: ${overall} / 10`);
  finalLines.push('```');
  finalLines.push('');
  finalLines.push('## 8. Information Risks');
  finalLines.push('- Устаревшие timeline-утверждения и статусные формулировки искажают planning decisions.');
  finalLines.push('- Broken links и path drift тормозят onboarding и эксплуатацию runbooks.');
  finalLines.push('- Отсутствие claim-registration даёт “безответственные” утверждения.');
  finalLines.push('');
  finalLines.push('## 9. Priority');
  finalLines.push('- 🔴 CRITICAL: drift статуса зрелости и невалидный governance baseline.');
  finalLines.push('- 🟠 HIGH: broken navigation и несогласованные root docs.');
  finalLines.push('- 🟡 MEDIUM: большой хвост experimental/dated отчётов в active tree.');
  finalLines.push('- 🟢 LOW: форматные несоответствия и naming noise.');
  finalLines.push('');
  finalLines.push('## 10. Docs-as-Code Transition');
  finalLines.push('- Введён `DOCS_MATRIX`, claim fields, unified `pnpm lint:docs`, freshness SLA.');
  finalLines.push('');
  finalLines.push('## 11. Новая архитектура документации');
  finalLines.push('- Целевая топология создана: `00_CORE`, `04_AI_SYSTEM`, `06_ARCHIVE` (+ миграция первой волны root docs).');
  finalLines.push('');
  finalLines.push('## 12. Action Plan');
  finalLines.push('| Действие | Что сделать | Зачем | Эффект |');
  finalLines.push('|---|---|---|---|');
  finalLines.push('| Удалить junk | purge root prompt/audit files из active root | убрать noise | снизить risk ложных ссылок |');
  finalLines.push('| Объединить дубли | свести dated reports в archive snapshots | убрать расхождение версий | единая траектория изменений |');
  finalLines.push('| Переписать canon docs | README/INDEX/CONTRIBUTING | сделать operational navigation | предсказуемый onboarding |');
  finalLines.push('| Оставить operational docs | CORE + runbooks + matrix | фиксировать truth | управляемая документация |');
  finalLines.push('');
  finalLines.push('## 13. 30-60-90');
  finalLines.push('- 30 дней: full inventory, purge wave 1, CI gate.');
  finalLines.push('- 60 дней: стабилизация claim lifecycle, закрытие high drift.');
  finalLines.push('- 90 дней: регулярная верификация и нулевой silent drift.');
  finalLines.push('');
  finalLines.push('## 14. Final Verdict');
  finalLines.push('- Сейчас доверять документации без проверки по code/tests/gates нельзя.');
  finalLines.push('- Если ничего не менять: рост управленческих ошибок и ускорение doc drift.');
  finalLines.push('- После очистки и gate-enforcement: документация становится operational truth-системой.');
  writeFile(
    path.join(AUDIT_DIR, 'FINAL_AUDIT_2026-03-20.md'),
    withAuditFrontmatter('DOC-ARV-AUDIT-FINAL-20260320', finalLines.join('\n') + '\n')
  );

  console.log(`docs-reset-audit: generated ${rows.length} records`);
}

run();

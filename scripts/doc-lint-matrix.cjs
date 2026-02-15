const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const MATRIX_PATH = path.resolve(__dirname, '../docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md');
const FAIL_ON_MISMATCH = process.argv.includes('--fail-on-mismatch');
const STRICT_VERSION = process.argv.includes('--strict-version');

const ROOT_META_FILES = new Set(['README.md', 'INDEX.md']);
const FOLDER_TO_LAYER = {
    '00_STRATEGY': 'Strategy',
    '01_ARCHITECTURE': 'Architecture',
    '02_DOMAINS': 'Domain',
    '03_PRODUCT': 'Product',
    '04_ENGINEERING': 'Engineering',
    '05_OPERATIONS': 'Operations',
    '06_METRICS': 'Metrics',
    '07_EXECUTION': 'Execution',
    '08_ARCHIVE': 'Archive'
};

const LINK_RE = /\[[^\]]*?\]\(([^)]+)\)/g;
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const FORBIDDEN_DUP_RE = /(_2|_NEW)\.md$/i;

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (name === '.git' || name === 'node_modules') continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            walk(full, out);
        } else if (name.toLowerCase().endsWith('.md')) {
            out.push(full);
        }
    }
    return out;
}

function parseMatrix() {
    const raw = fs.readFileSync(MATRIX_PATH, 'utf8');
    const matrix = {};
    for (const line of raw.split(/\r?\n/)) {
        if (!line.trim().startsWith('|')) continue;
        if (line.includes(':---')) continue;
        const cols = line.split('|').map(s => s.trim()).filter(Boolean);
        if (cols.length !== 2) continue;
        if (cols[0] === 'Layer' && cols[1] === 'Allowed Types') continue;
        matrix[cols[0]] = cols[1].split(',').map(v => v.trim()).filter(Boolean);
    }
    return matrix;
}

function parseFrontMatter(content) {
    content = content.replace(/^\uFEFF/, '');
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return null;
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        val = val.replace(/^['"]|['"]$/g, '');
        meta[key] = val;
    }
    return meta;
}

function expectedLayer(relPath) {
    const parts = relPath.split('/');
    if (parts.length === 1 && ROOT_META_FILES.has(parts[0])) return 'Meta';
    return FOLDER_TO_LAYER[parts[0]] || null;
}

function resolveLink(sourceAbs, linkRaw) {
    const link = linkRaw.split('#')[0].trim();
    if (!link || link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:')) return null;
    if (link.startsWith('file://')) return null;
    if (path.isAbsolute(link)) return null;
    const resolved = path.resolve(path.dirname(sourceAbs), link);
    return resolved;
}

function detectCycles(graph) {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    const parent = new Map();
    const cycles = [];

    for (const node of graph.keys()) color.set(node, WHITE);

    function dfs(u) {
        color.set(u, GRAY);
        const neighbors = graph.get(u) || [];
        for (const v of neighbors) {
            if (!graph.has(v)) continue;
            const c = color.get(v);
            if (c === WHITE) {
                parent.set(v, u);
                dfs(v);
            } else if (c === GRAY) {
                const cycle = [v];
                let cur = u;
                while (cur && cur !== v) {
                    cycle.push(cur);
                    cur = parent.get(cur);
                }
                cycle.push(v);
                cycle.reverse();
                cycles.push(cycle);
            }
        }
        color.set(u, BLACK);
    }

    for (const node of graph.keys()) {
        if (color.get(node) === WHITE) dfs(node);
    }

    return cycles;
}

function run() {
    if (!fs.existsSync(DOCS_ROOT)) {
        console.error(`Docs root not found: ${DOCS_ROOT}`);
        process.exit(2);
    }
    if (!fs.existsSync(MATRIX_PATH)) {
        console.error(`Matrix file not found: ${MATRIX_PATH}`);
        process.exit(2);
    }

    const matrix = parseMatrix();
    const files = walk(DOCS_ROOT);
    const errors = [];
    const warnings = [];
    const idToFile = new Map();
    const graph = new Map();
    const fileSet = new Set(files.map(f => path.normalize(f)));

    for (const abs of files) {
        const rel = path.relative(DOCS_ROOT, abs).replace(/\\/g, '/');
        const content = fs.readFileSync(abs, 'utf8');
        const fm = parseFrontMatter(content);
        graph.set(path.normalize(abs), []);

        if (FORBIDDEN_DUP_RE.test(path.basename(rel))) {
            errors.push(`[FORBIDDEN_NAME] ${rel}: filename with *_2.md or *_NEW.md is forbidden`);
        }

        if (!fm) {
            errors.push(`[FRONTMATTER] ${rel}: missing YAML frontmatter`);
            continue;
        }

        const layer = fm.layer;
        const type = fm.type;
        const id = fm.id;
        const status = fm.status;
        const version = fm.version;
        const supersedes = fm.supersedes;
        const deprecatedBy = fm.deprecated_by;

        const expLayer = expectedLayer(rel);
        if (!expLayer) {
            warnings.push(`[PATH] ${rel}: unknown top-level folder, skipped layer/path check`);
        } else if (layer !== expLayer) {
            errors.push(`[LAYER_PATH] ${rel}: expected layer "${expLayer}", got "${layer || 'N/A'}"`);
        }

        const allowedTypes = matrix[layer] || [];
        if (!layer || !matrix[layer]) {
            errors.push(`[LAYER] ${rel}: invalid or missing layer "${layer || 'N/A'}"`);
        } else if (!type || !allowedTypes.includes(type)) {
            errors.push(`[TYPE] ${rel}: type "${type || 'N/A'}" is not allowed for layer "${layer}"`);
        }

        if (!id) {
            errors.push(`[ID] ${rel}: missing id`);
        } else if (idToFile.has(id)) {
            errors.push(`[ID_COLLISION] ${rel}: duplicate id "${id}" already used in ${idToFile.get(id)}`);
        } else {
            idToFile.set(id, rel);
        }

        if (!status) {
            errors.push(`[STATUS] ${rel}: missing status`);
        }

        if (STRICT_VERSION) {
            if (!version) {
                errors.push(`[VERSION] ${rel}: missing version (strict mode)`);
            } else if (!SEMVER_RE.test(version)) {
                errors.push(`[VERSION] ${rel}: version "${version}" is not valid semver`);
            }
        } else if (version && !SEMVER_RE.test(version)) {
            errors.push(`[VERSION] ${rel}: version "${version}" is not valid semver`);
        }

        if ((status || '').toLowerCase() === 'deprecated' && !deprecatedBy && !supersedes) {
            warnings.push(`[DEPRECATION] ${rel}: deprecated status without deprecated_by/supersedes`);
        }
        if (FORBIDDEN_DUP_RE.test(path.basename(rel)) && !supersedes) {
            warnings.push(`[SUPERSEDES] ${rel}: duplicate-like filename should declare supersedes`);
        }

        for (const m of content.matchAll(LINK_RE)) {
            const target = resolveLink(abs, m[1]);
            if (!target) continue;
            const normalizedTarget = path.normalize(target);
            if (fileSet.has(normalizedTarget)) {
                graph.get(path.normalize(abs)).push(normalizedTarget);
            }
        }
    }

    const cycles = detectCycles(graph);
    for (const cycle of cycles) {
        const printable = cycle.map(p => path.relative(DOCS_ROOT, p).replace(/\\/g, '/')).join(' -> ');
        errors.push(`[CYCLE] ${printable}`);
    }

    console.log('Doc Lint Matrix Report');
    console.log(`- Files scanned: ${files.length}`);
    console.log(`- Errors: ${errors.length}`);
    console.log(`- Warnings: ${warnings.length}`);

    if (errors.length) {
        console.log('\nErrors:');
        for (const e of errors) console.log(`- ${e}`);
    }
    if (warnings.length) {
        console.log('\nWarnings:');
        for (const w of warnings) console.log(`- ${w}`);
    }

    if (FAIL_ON_MISMATCH && errors.length > 0) {
        process.exit(1);
    }
}

run();

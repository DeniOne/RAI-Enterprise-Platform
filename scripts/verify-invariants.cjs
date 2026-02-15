
const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const MATRIX_PATH = path.resolve(__dirname, '../docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md');

// STRICT GOVERNANCE CONFIGURATION
const LAYER_MAP = {
    '00_STRATEGY': 'Strategy',
    '01_ARCHITECTURE': 'Architecture',
    '02_DOMAINS': 'Domain',
    '03_PRODUCT': 'Product',
    '04_ENGINEERING': 'Engineering',
    '05_OPERATIONS': 'Operations',
    '06_METRICS': 'Metrics',
    '07_EXECUTION': 'Execution',
    '08_ARCHIVE': 'Archive',
    'LEGACY': 'Archive' // Transitive support for legacy
};

// Allowed Root Files (Strict Isolation)
const ROOT_ALLOWLIST = ['README.md', 'INDEX.md'];
const ROOT_LAYER = 'Meta';

// Stats
let stats = {
    total: 0,
    passed: 0,
    missing_header: 0,
    invalid_layer: 0,
    invalid_type: 0,
    topology_mismatch: 0,
    root_violation: 0
};

function loadLayerTypeMatrix() {
    if (!fs.existsSync(MATRIX_PATH)) {
        throw new Error(`Matrix not found: ${MATRIX_PATH}`);
    }

    const content = fs.readFileSync(MATRIX_PATH, 'utf-8');
    const matrix = {};

    content.split(/\r?\n/).forEach(line => {
        if (!line.trim().startsWith('|')) return;
        if (line.includes(':---')) return;

        const cols = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length !== 2) return;
        if (cols[0] === 'Layer' && cols[1] === 'Allowed Types') return;

        matrix[cols[0]] = cols[1].split(',').map(v => v.trim()).filter(Boolean);
    });

    return matrix;
}

const LAYER_TYPE_MATRIX = loadLayerTypeMatrix();

function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== '.git' && file !== 'node_modules') getAllFiles(filePath, fileList);
        } else {
            if (file.endsWith('.md')) fileList.push(filePath);
        }
    });
    return fileList;
}

const files = getAllFiles(DOCS_ROOT);
console.log(`🔒 Starting Strict Governance Check on ${files.length} files...`);

files.forEach(file => {
    stats.total++;
    const relativePath = path.relative(DOCS_ROOT, file);
    const pathParts = relativePath.split(path.sep);
    const rootFolder = pathParts[0];
    const content = fs.readFileSync(file, 'utf-8');
    let hasError = false;

    // RULE 1: ROOT ISOLATION
    if (pathParts.length === 1) {
        if (!ROOT_ALLOWLIST.includes(rootFolder)) {
            console.error(`❌ ROOT VIOLATION: ${relativePath} is not allowed in root.`);
            stats.root_violation++;
            hasError = true;
        }
    }

    // RULE 2: YAML HEADER PRESENCE
    if (!content.trim().startsWith('---')) {
        console.error(`❌ NO HEADER: ${relativePath}`);
        stats.missing_header++;
        hasError = true;
    }

    // Parse Header
    const layerMatch = content.match(/^layer:\s*(.+)$/m);
    const layer = layerMatch ? layerMatch[1].trim() : null;
    const typeMatch = content.match(/^type:\s*(.+)$/m);
    const type = typeMatch ? typeMatch[1].trim() : null;

    // RULE 3: TOPOLOGY LOCK (Directory matches Layer)
    if (rootFolder !== 'README.md' && rootFolder !== 'INDEX.md') {
        // Special case for LEGACY in ARCHIVE
        let expectedLayer = LAYER_MAP[rootFolder];

        // Handle 08_ARCHIVE/LEGACY subfolder mapping if needed, but usually 08_ARCHIVE maps to Archive
        if (rootFolder === '08_ARCHIVE') expectedLayer = 'Archive';

        if (expectedLayer && layer) {
            if (layer !== expectedLayer && layer !== 'Archive') { // Archive layer allows loose placement for now
                console.error(`❌ TOPOLOGY MISMATCH: ${relativePath}`);
                console.error(`   - Directory implies: ${expectedLayer}`);
                console.error(`   - Header declares:   ${layer}`);
                stats.topology_mismatch++;
                hasError = true;
            }
        }
    }

    // RULE 3.1: ROOT META FILES MUST DECLARE META/NAVIGATION
    if (pathParts.length === 1 && ROOT_ALLOWLIST.includes(rootFolder)) {
        if (layer !== ROOT_LAYER || type !== 'Navigation') {
            console.error(`❌ ROOT META MISMATCH: ${relativePath}`);
            console.error(`   - Expected: layer=${ROOT_LAYER}, type=Navigation`);
            console.error(`   - Found:    layer=${layer || 'N/A'}, type=${type || 'N/A'}`);
            stats.topology_mismatch++;
            hasError = true;
        }
    }

    // RULE 4: VALID LAYER ENUM
    if (!layer) {
        if (!hasError) { // Don't double report if missing header involved
            console.error(`❌ MISSING LAYER: ${relativePath}`);
            stats.invalid_layer++;
            hasError = true;
        }
    } else {
        const validLayers = Object.values(LAYER_MAP).concat(['Archive', ROOT_LAYER]); // Ensure Archive and Meta are valid
        if (!validLayers.includes(layer)) {
            console.error(`❌ INVALID LAYER VALUE: ${relativePath} (${layer})`);
            stats.invalid_layer++;
            hasError = true;
        }
    }

    // RULE 5: TYPE MUST BE ALLOWED BY MATRIX FOR DECLARED LAYER
    if (layer && type) {
        const allowed = LAYER_TYPE_MATRIX[layer];
        if (!allowed || !allowed.includes(type)) {
            console.error(`❌ TYPE MISMATCH: ${relativePath}`);
            console.error(`   - Layer: ${layer}`);
            console.error(`   - Type:  ${type}`);
            console.error(`   - Allowed: ${(allowed || []).join(', ') || 'N/A'}`);
            stats.invalid_type++;
            hasError = true;
        }
    }

    if (!hasError) stats.passed++;
});

console.log('\n📊 GOVERNANCE REPORT');
console.log(`Total Files: ${stats.total}`);
console.log(`Passed:      ${stats.passed} ✅`);
console.log(`Violations:  ${stats.total - stats.passed} ❌`);

if (stats.root_violation > 0) console.log(`- Root Violations: ${stats.root_violation}`);
if (stats.missing_header > 0) console.log(`- Missing Headers: ${stats.missing_header}`);
if (stats.topology_mismatch > 0) console.log(`- Topology Mismatches: ${stats.topology_mismatch}`);
if (stats.invalid_layer > 0) console.log(`- Invalid Layers: ${stats.invalid_layer}`);
if (stats.invalid_type > 0) console.log(`- Invalid Types: ${stats.invalid_type}`);

if (stats.total - stats.passed > 0) process.exit(1);


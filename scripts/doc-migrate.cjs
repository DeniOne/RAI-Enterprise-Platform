
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const DRY_RUN = process.argv.includes('--dry-run');

const Layer = {
    STRATEGY: 'Strategy',
    ARCHITECTURE: 'Architecture',
    DOMAIN: 'Domain',
    PRODUCT: 'Product',
    ENGINEERING: 'Engineering',
    OPERATIONS: 'Operations',
    METRICS: 'Metrics',
    EXECUTION: 'Execution',
    ARCHIVE: 'Archive'
};

function inferLayerAndType(filePath) {
    const relPath = path.relative(DOCS_ROOT, filePath).replace(/\\/g, '/');
    const segs = relPath.split('/');
    const rootDir = segs[0];

    if (rootDir === '00_STRATEGY') return { layer: Layer.STRATEGY, type: 'Vision' };
    if (rootDir === '01_ARCHITECTURE') {
        if (relPath.includes('/ADR/')) return { layer: Layer.ARCHITECTURE, type: 'ADR' };
        if (relPath.includes('/PRINCIPLES/')) return { layer: Layer.ARCHITECTURE, type: 'Standards' };
        return { layer: Layer.ARCHITECTURE, type: 'HLD' };
    }
    if (rootDir === '02_DOMAINS') return { layer: Layer.DOMAIN, type: 'Domain Spec' };
    if (rootDir === '03_PRODUCT') return { layer: Layer.PRODUCT, type: 'UI Spec' };
    if (rootDir === '04_ENGINEERING') return { layer: Layer.ENGINEERING, type: 'Service Spec' };
    if (rootDir === '05_OPERATIONS') return { layer: Layer.OPERATIONS, type: 'Runbook' };
    if (rootDir === '06_METRICS') return { layer: Layer.METRICS, type: 'KPI Spec' };
    if (rootDir === '07_EXECUTION') return { layer: Layer.EXECUTION, type: 'Phase Plan' };
    if (rootDir === '08_ARCHIVE') return { layer: Layer.ARCHIVE, type: 'Legacy' };

    // Fallbacks
    if (path.basename(filePath).startsWith('ADVISORY_')) return { layer: Layer.OPERATIONS, type: 'Report' };
    return { layer: Layer.ARCHIVE, type: 'Legacy' };
}

function generateId(layer, index) {
    const shortMap = {
        [Layer.STRATEGY]: 'STR',
        [Layer.ARCHITECTURE]: 'ARC',
        [Layer.DOMAIN]: 'DOM',
        [Layer.PRODUCT]: 'PRD',
        [Layer.ENGINEERING]: 'ENG',
        [Layer.OPERATIONS]: 'OPS',
        [Layer.METRICS]: 'MET',
        [Layer.EXECUTION]: 'EXE',
        [Layer.ARCHIVE]: 'ARH'
    };
    return `DOC-${shortMap[layer]}-GEN-${String(index).padStart(3, '0')}`;
}

console.log(`🚀 Starting Migration Script (Dry Run: ${DRY_RUN})`);
if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`❌ Root path does not exist: ${DOCS_ROOT}`);
    process.exit(1);
}

function getAllFiles(dir, fileList = []) {
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
let counter = 1;

files.forEach(file => {
    // Skip only specific governance-meta files if necessary, but actually all need headers now
    if (file.match(/(PROJECT_MAP|DOC_STRUCTURE|GOVERNANCE)\.md$/i)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(DOCS_ROOT, file).replace(/\\/g, '/');

    // Skip update ONLY if header is already valid (has ID and Layer)
    if (content.trim().startsWith('---') && content.includes('id:') && content.includes('layer:')) {
        return;
    }

    const { layer, type } = inferLayerAndType(file);
    const id = generateId(layer, counter++);

    // Handle root files layer specifically if inferLayerAndType defaults them to Archive
    let finalLayer = layer;
    if (relPath === 'INDEX.md' || relPath === 'README.md') {
        finalLayer = 'Architecture'; // Defaulting root portal to Architecture layer
    }

    const header = `---
id: ${id}
type: ${type}
layer: ${finalLayer}
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: ${new Date().toISOString().split('T')[0]}
---

`;

    const newContent = header + content.replace(/^---[\s\S]*?---\s*/, ''); // Replace existing partial header if any

    console.log(`[MIGRATE] ${relPath} -> ID: ${finalLayer} | Layer: ${finalLayer}`);

    if (!DRY_RUN) {
        fs.writeFileSync(file, newContent);
    }
});

console.log(`\n✅ Migration Complete. Processed ${counter - 1} files.`);


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

    if (rootDir.includes('STRATEGY')) return { layer: Layer.STRATEGY, type: 'Vision' };
    if (rootDir.includes('ARCHITECTURE')) {
        if (rootDir.includes('DECISIONS')) return { layer: Layer.ARCHITECTURE, type: 'ADR' };
        return { layer: Layer.ARCHITECTURE, type: 'HLD' };
    }
    if (rootDir.includes('DOMAINS') || rootDir === 'CONSULTING') return { layer: Layer.DOMAIN, type: 'Domain Spec' };
    if (rootDir.includes('PRODUCT') || rootDir.includes('DESIGN')) return { layer: Layer.PRODUCT, type: 'UI Spec' };
    if (rootDir.includes('ENGINEERING')) return { layer: Layer.ENGINEERING, type: 'Service Spec' };
    if (rootDir.includes('OPERATIONS')) return { layer: Layer.OPERATIONS, type: 'Runbook' };
    if (rootDir.includes('METRICS')) return { layer: Layer.METRICS, type: 'KPI Spec' };
    if (rootDir.includes('IMPLEMENTATION') || rootDir.includes('EXECUTION')) return { layer: Layer.EXECUTION, type: 'Phase Plan' };

    if (fs.readFileSync(filePath, 'utf-8').includes('ADVISORY_')) return { layer: Layer.OPERATIONS, type: 'Report' };

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
    const content = fs.readFileSync(file, 'utf-8');
    if (content.startsWith('---')) {
        return;
    }

    const { layer, type } = inferLayerAndType(file);
    const id = generateId(layer, counter++);

    // Escape backticks if needed, though simple strings are usually fine
    const header = `---
id: ${id}
type: ${type}
layer: ${layer}
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: ${new Date().toISOString().split('T')[0]}
---

`;

    const newContent = header + content;

    console.log(`[MIGRATE] ${path.basename(file)} -> ID: ${id} | Layer: ${layer}`);

    if (!DRY_RUN) {
        fs.writeFileSync(file, newContent);
    }
});

console.log(`\n✅ Migration Complete. Processed ${counter - 1} files.`);

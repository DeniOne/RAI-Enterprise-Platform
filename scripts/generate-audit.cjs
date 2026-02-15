const fs = require('fs');
const path = require('path');

const DOCS_ROOT = 'docs';
const MATRIX_PATH = path.join(DOCS_ROOT, '01_ARCHITECTURE', 'TOPOLOGY', 'LAYER_TYPE_MATRIX.md');
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

function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.md')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

function extractMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata = {
        id: (content.match(/id:\s*(.+)/) || [])[1] || 'N/A',
        layer: (content.match(/layer:\s*(.+)/) || [])[1] || 'N/A',
        type: (content.match(/type:\s*(.+)/) || [])[1] || 'N/A',
        status: (content.match(/status:\s*(.+)/) || [])[1] || 'N/A',
    };
    return metadata;
}

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

        const layer = cols[0];
        const allowedTypes = cols[1].split(',').map(s => s.trim()).filter(Boolean);
        matrix[layer] = allowedTypes;
    });

    return matrix;
}

function expectedLayerByPath(relPath) {
    const parts = relPath.split('/');
    if (parts.length === 1 && ROOT_META_FILES.has(parts[0])) {
        return 'Meta';
    }

    const top = parts[0];
    return FOLDER_TO_LAYER[top] || null;
}

const files = getAllFiles(DOCS_ROOT);
const layerTypeMatrix = loadLayerTypeMatrix();
const report = [];

report.push('| File Path | ID | Layer | Type | Status | Logical Check |');
report.push('| :--- | :--- | :--- | :--- | :--- | :--- |');

files.forEach(f => {
    const rel = path.relative(DOCS_ROOT, f).replace(/\\/g, '/');
    const meta = extractMetadata(f);
    const layer = meta.layer.trim();
    const type = meta.type.trim();
    const expectedLayer = expectedLayerByPath(rel);
    const allowedTypes = layerTypeMatrix[layer] || [];

    const layerMatchesPath = expectedLayer ? layer === expectedLayer : false;
    const typeMatchesLayer = allowedTypes.includes(type);
    const isMatched = layerMatchesPath && typeMatchesLayer;
    const check = isMatched ? '✅' : '❓ MISMATCH';

    report.push(`| ${rel} | ${meta.id.trim()} | ${meta.layer.trim()} | ${meta.type.trim()} | ${meta.status.trim()} | ${check} |`);
});

fs.writeFileSync('docs_classification_table.md', report.join('\n'));
console.log('✅ Audit Table generated: docs_classification_table.md');

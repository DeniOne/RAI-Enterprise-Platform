
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const DRY_RUN = process.argv.includes('--dry-run');

enum Layer {
    STRATEGY = 'Strategy',
    ARCHITECTURE = 'Architecture',
    DOMAIN = 'Domain',
    PRODUCT = 'Product',
    ENGINEERING = 'Engineering',
    OPERATIONS = 'Operations',
    METRICS = 'Metrics',
    EXECUTION = 'Execution',
    ARCHIVE = 'Archive'
}

// Simple heuristic mapping based on directory names
function inferLayerAndType(filePath: string): { layer: Layer, type: string } {
    const relPath = path.relative(DOCS_ROOT, filePath).replace(/\\/g, '/');
    const segs = relPath.split('/');
    const rootDir = segs[0];

    if (rootDir.includes('STRATEGY')) return { layer: Layer.STRATEGY, type: 'Vision' };
    if (rootDir.includes('ARCHITECTURE')) return { layer: Layer.ARCHITECTURE, type: 'HLD' };
    if (rootDir === 'CONSULTING' || rootDir.includes('DOMAINS')) return { layer: Layer.DOMAIN, type: 'Domain Spec' };
    if (rootDir.includes('ENGINEERING')) return { layer: Layer.ENGINEERING, type: 'Service Spec' };
    if (rootDir.includes('IMPLEMENTATION') || rootDir.includes('EXECUTION')) return { layer: Layer.EXECUTION, type: 'Phase Plan' };
    if (filePath.includes('ADVISORY_')) return { layer: Layer.OPERATIONS, type: 'Report' };
    
    // Default fallback
    return { layer: Layer.ARCHIVE, type: 'Legacy' };
}

function generateId(layer: Layer, index: number): string {
    const shortMap: Record<Layer, string> = {
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

// --- MAIN ---

console.log(`🚀 Starting Migration Script (Dry Run: ${DRY_RUN})`);

function getAllFiles(dir: string, fileList: string[] = []): string[] {
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
        // Already has frontmatter, skip or update?
        // User said: "Скрипт для массового добавления ID и YAML-заголовков (с placeholder values) в существующие файлы перед перемещением."
        // We assume if it has FM, we leave it alone for now OR we validate it.
        // Let's print info.
        // console.log(`Skipping ${path.basename(file)} (already has frontmatter)`);
        return;
    }

    const { layer, type } = inferLayerAndType(file);
    const id = generateId(layer, counter++);

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

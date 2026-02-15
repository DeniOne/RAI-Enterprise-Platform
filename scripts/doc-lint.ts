
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const EXCLUDE_DIRS = ['.git', 'node_modules', '08_ARCHIVE']; // Archive is isolated but we might want to check its internal structure? User said Archive is isolated.

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

const LAYER_ORDER = [
    Layer.STRATEGY,
    Layer.ARCHITECTURE,
    Layer.DOMAIN,
    Layer.PRODUCT,
    Layer.ENGINEERING,
    Layer.OPERATIONS
];

// Matrix: Source Layer -> Allowed Target Layers
const DEPENDENCY_MATRIX: Record<Layer, Layer[]> = {
    [Layer.STRATEGY]: [Layer.STRATEGY],
    [Layer.ARCHITECTURE]: [Layer.STRATEGY, Layer.ARCHITECTURE],
    [Layer.DOMAIN]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT], // Domain might ref Product? No, Product refs Domain. Matrix says: Strategy -> Arch -> Domain -> Product -> Engineering. So Domain sees Arch/Strategy.
    // Wait, the user said: Strategy -> Architecture -> Domain -> Product -> Engineering -> Operations
    // So:
    // Strategy sees NOTHING below.
    // Architecture sees Strategy.
    // Domain sees Architecture, Strategy.
    // Product sees Domain, Architecture, Strategy.
    // Engineering sees Product, Domain, Architecture.
    // Operations sees Engineering, Product, Domain, Architecture.

    // Let's refine based on "Allowed Dependencies (Can reference...)" from GOVERNANCE.md

    [Layer.STRATEGY]: [Layer.STRATEGY],
    [Layer.ARCHITECTURE]: [Layer.STRATEGY, Layer.ARCHITECTURE],
    [Layer.DOMAIN]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN],
    [Layer.PRODUCT]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT],
    [Layer.ENGINEERING]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT, Layer.ENGINEERING],
    [Layer.OPERATIONS]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT, Layer.ENGINEERING, Layer.OPERATIONS], // Ops monitors everything
    [Layer.METRICS]: [Layer.STRATEGY, Layer.PRODUCT], // Aggregation
    [Layer.EXECUTION]: Object.values(Layer), // Can reference all
    [Layer.ARCHIVE]: [] // Isolated
};

const ALLOWED_TYPES: Record<string, Layer> = {
    'Vision': Layer.STRATEGY,
    'Roadmap': Layer.STRATEGY,
    'Economics': Layer.STRATEGY,
    'ADR': Layer.ARCHITECTURE,
    'HLD': Layer.ARCHITECTURE,
    'Topology': Layer.ARCHITECTURE,
    'Domain Spec': Layer.DOMAIN,
    'Policy': Layer.DOMAIN,
    'UI Spec': Layer.PRODUCT,
    'UX Flow': Layer.PRODUCT,
    'Bot Spec': Layer.PRODUCT,
    'API Contract': Layer.ENGINEERING,
    'Service Spec': Layer.ENGINEERING,
    'Database Spec': Layer.ENGINEERING,
    'Standards': Layer.ENGINEERING,
    'Runbook': Layer.OPERATIONS,
    'Incident Report': Layer.OPERATIONS,
    'Report': Layer.OPERATIONS,
    'Monitoring Spec': Layer.OPERATIONS,
    'KPI Spec': Layer.METRICS,
    'Phase Plan': Layer.EXECUTION,
    'WBS': Layer.EXECUTION,
    'Research': Layer.ARCHIVE,
    'Legacy': Layer.ARCHIVE
};

// --- HELPERS ---

interface DocMetadata {
    id?: string;
    type?: string;
    layer?: Layer;
    status?: string;
    allowed_refs?: string[];
}

interface ValidationResult {
    file: string;
    errors: string[];
}

function parseFrontMatter(content: string): { data: DocMetadata, content: string } | null {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const rawYaml = match[1];
    const data: any = {};

    rawYaml.split(/\r?\n/).forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            // Basic array handling for allowed_refs
            if (key === 'allowed_refs' || key === 'depends_on') {
                // TODO: proper yaml array parsing if needed, mostly single line for now in this simple script
                // For now assumes strictly formatted valid yaml or simple values
            } else {
                data[key] = val;
            }
        }
    });

    return { data, content: content.replace(match[0], '') };
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                getAllFiles(filePath, fileList);
            }
        } else {
            if (file.endsWith('.md')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// --- MAIN ---

async function validateDocs() {
    console.log(`🔍 Starting Semantic Lint on ${DOCS_ROOT}`);
    const files = getAllFiles(DOCS_ROOT);
    const results: ValidationResult[] = [];

    // 1. Build Index (Path -> Layer) to validate links later
    const fileIndex: Record<string, Layer> = {};

    // First Pass: Parse Headers & Build Index
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const fm = parseFrontMatter(content);
        const relPath = path.relative(DOCS_ROOT, file);

        if (!fm) {
            results.push({ file: relPath, errors: ['❌ Missing YAML Frontmatter'] });
            continue;
        }

        const { layer, type, id } = fm.data;

        if (!layer || !Object.values(Layer).includes(layer as Layer)) {
            results.push({ file: relPath, errors: [`❌ Invalid or Missing Layer: ${layer}`] });
            continue;
        }

        if (!type || !ALLOWED_TYPES[type]) {
            results.push({ file: relPath, errors: [`❌ Invalid or Missing Type: ${type}`] });
        } else if (ALLOWED_TYPES[type] !== layer) {
            results.push({ file: relPath, errors: [`❌ Type mismatch: ${type} belongs to ${ALLOWED_TYPES[type]}, but file is marked as ${layer}`] });
        }

        if (!id) {
            results.push({ file: relPath, errors: ['❌ Missing Document ID'] });
        }

        fileIndex[file] = layer as Layer;
    }

    // Second Pass: Validate Links & Logic
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const fm = parseFrontMatter(content);
        if (!fm) continue; // Already reported

        const sourceLayer = fm.data.layer as Layer;
        if (!sourceLayer) continue;

        const relPath = path.relative(DOCS_ROOT, file);
        const fileErrors: string[] = [];

        // Check Directory Structure Compliance
        // expected dir logic can be added here (e.g. Strategy docs must be in 00_STRATEGY)

        // Link Extraction (Markdown links)
        const linkRegex = /\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkPath = match[1].split('#')[0]; // remote anchor
            if (linkPath.startsWith('http') || linkPath.startsWith('mailto')) continue;

            // Resolve absolute path
            let targetAbsPath = '';
            if (path.isAbsolute(linkPath)) {
                // Assuming absolute links are rare or handled specifically, usually they are bad practice in repo
                // If it starts with /docs, try to map
                // For now, treat as relative to file
                // Skipping complex absolute path resolution for this MVP
                continue;
            } else {
                targetAbsPath = path.resolve(path.dirname(file), linkPath);
            }

            // Check if file exists
            if (!fs.existsSync(targetAbsPath) && !targetAbsPath.includes('http')) {
                // fileErrors.push(`⚠️ Broken Link: ${linkPath}`);
                // Don't error on broken links yet, focus on Layer Violation
            } else if (fileIndex[targetAbsPath]) {
                const targetLayer = fileIndex[targetAbsPath];
                const allowedLayers = DEPENDENCY_MATRIX[sourceLayer];

                if (!allowedLayers.includes(targetLayer)) {
                    fileErrors.push(`⛔ Layer Violation: ${sourceLayer} -> ${targetLayer} (${path.relative(DOCS_ROOT, targetAbsPath)}). Allowed: ${allowedLayers.join(', ')}`);
                }
            }
        }

        if (fileErrors.length > 0) {
            const existing = results.find(r => r.file === relPath);
            if (existing) {
                existing.errors.push(...fileErrors);
            } else {
                results.push({ file: relPath, errors: fileErrors });
            }
        }
    }

    // REPORT
    console.log('\n📊 VALIDATION REPORT\n');
    let errorCount = 0;
    results.forEach(r => {
        if (r.errors.length > 0) {
            console.log(`📄 ${r.file}`);
            r.errors.forEach(e => console.log(`  ${e}`));
            errorCount += r.errors.length;
            console.log('');
        }
    });

    if (errorCount === 0) {
        console.log('✅ All checks passed! Documentation is compliant.');
    } else {
        console.log(`❌ Found ${errorCount} violations.`);
        process.exit(1);
    }
}

validateDocs().catch(console.error);

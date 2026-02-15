
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const EXCLUDE_DIRS = ['.git', 'node_modules', '08_ARCHIVE'];

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

// Matrix: Source Layer -> Allowed Target Layers (Downward Visibility)
// Strategy -> Architecture -> Domain -> Product -> Engineering -> Operations
const DEPENDENCY_MATRIX = {
    [Layer.STRATEGY]: [Layer.STRATEGY],
    [Layer.ARCHITECTURE]: [Layer.STRATEGY, Layer.ARCHITECTURE],
    [Layer.DOMAIN]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN],
    [Layer.PRODUCT]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT],
    [Layer.ENGINEERING]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT, Layer.ENGINEERING],
    [Layer.OPERATIONS]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT, Layer.ENGINEERING, Layer.OPERATIONS],
    [Layer.METRICS]: [Layer.STRATEGY, Layer.PRODUCT], // Aggregation
    [Layer.EXECUTION]: [Layer.STRATEGY, Layer.ARCHITECTURE, Layer.DOMAIN, Layer.PRODUCT, Layer.ENGINEERING, Layer.OPERATIONS, Layer.METRICS, Layer.EXECUTION, Layer.ARCHIVE], // Can reference all
    [Layer.ARCHIVE]: [] // Isolated
};

const ALLOWED_TYPES = {
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

function parseFrontMatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const rawYaml = match[1];
    const data = {};

    rawYaml.split(/\r?\n/).forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            if (key !== 'allowed_refs' && key !== 'depends_on') {
                data[key] = val;
            } else {
                // Simple array parsing check
                if (val.startsWith('[')) {
                    // very basic cleanup found in '[doc-1, doc-2]'
                    const clean = val.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                    data[key] = clean;
                } else {
                    data[key] = [val];
                }
            }
        }
    });

    return { data, content: content.replace(match[0], '') };
}

function getAllFiles(dir, fileList = []) {
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
    if (!fs.existsSync(DOCS_ROOT)) {
        console.error(`❌ Root path does not exist: ${DOCS_ROOT}`);
        return;
    }

    const files = getAllFiles(DOCS_ROOT);
    const results = [];

    // 1. Build Index (Path -> Layer)
    const fileIndex = {};

    // First Pass: Parse Headers & Build Index
    for (const file of files) {
        // Skip INDEX/README for layer checks, they are portals
        if (path.basename(file).match(/^(README|INDEX|PROJECT_MAP|DOC_STRUCTURE)\.md$/i)) continue;

        const content = fs.readFileSync(file, 'utf-8');
        const fm = parseFrontMatter(content);
        const relPath = path.relative(DOCS_ROOT, file);

        if (!fm) {
            results.push({ file: relPath, errors: ['❌ Missing YAML Frontmatter'] });
            continue;
        }

        const { layer, type, id } = fm.data;

        if (!layer || !Object.values(Layer).includes(layer)) {
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

        fileIndex[file] = layer;
    }

    // Second Pass: Validate Links
    for (const file of files) {
        if (path.basename(file).match(/^(README|INDEX|PROJECT_MAP|DOC_STRUCTURE)\.md$/i)) continue;

        const content = fs.readFileSync(file, 'utf-8');
        const fm = parseFrontMatter(content);
        if (!fm) continue;

        const sourceLayer = fm.data.layer;
        if (!sourceLayer) continue;

        const relPath = path.relative(DOCS_ROOT, file);
        const fileErrors = [];
        const allowedRefs = fm.data.allowed_refs || [];

        const linkRegex = /\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            let linkPath = match[1].split('#')[0];
            if (!linkPath) continue; // anchor only
            if (linkPath.startsWith('http') || linkPath.startsWith('mailto')) continue;

            // Try to resolve absolute paths relative to project root or docs root?
            // User context mainly uses relative paths.
            // If absolute, usually means full FS path in this context (f:/...) which is bad but we check it.

            let targetAbsPath = '';
            if (path.isAbsolute(linkPath)) {
                // Try to map f:/RAI_EP/docs/... to current
                if (linkPath.toLowerCase().includes('docs')) {
                    // best effort
                    continue;
                }
                continue;
            } else {
                targetAbsPath = path.resolve(path.dirname(file), linkPath);
            }

            if (fileIndex[targetAbsPath]) {
                const targetLayer = fileIndex[targetAbsPath];
                const allowedLayers = DEPENDENCY_MATRIX[sourceLayer] || [];

                // Allow if target layer is allowed globally OR if explicitly whitelisted in doc
                if (!allowedLayers.includes(targetLayer)) {
                    // Check if specific ID or Layer allows it? 
                    // MVP: Just layer check
                    fileErrors.push(`⛔ Layer Violation: ${sourceLayer} -> ${targetLayer} (${path.relative(DOCS_ROOT, targetAbsPath)})`);
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
            r.errors.forEach(e => console.log(`  ${e.substr(0, 150)}`));
            errorCount += r.errors.length;
            // limit output per file to avoid spamming console
            if (r.errors.length > 5) console.log(`  ... and ${r.errors.length - 5} more errors`);
            console.log('');
        }
    });

    if (errorCount === 0) {
        console.log('✅ All checks passed! Documentation is compliant.');
    } else {
        console.log(`❌ Found ${errorCount} violations.`);
    }
}

validateDocs().catch(console.error);

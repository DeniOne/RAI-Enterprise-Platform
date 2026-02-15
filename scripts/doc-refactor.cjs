
const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const DRY_RUN = process.argv.includes('--dry-run');

// --- CONFIGURATION ---

const TARGET_STRUCTURE = {
    'Strategy': '00_STRATEGY',
    'Architecture': '01_ARCHITECTURE',
    'Domain': '02_DOMAINS',
    'Product': '03_PRODUCT',
    'Engineering': '04_ENGINEERING',
    'Operations': '05_OPERATIONS',
    'Metrics': '06_METRICS',
    'Execution': '07_EXECUTION',
    'Archive': '08_ARCHIVE'
};

const TYPE_TO_SUBFOLDER = {
    // Strategy
    'Vision': 'VISION',
    'Roadmap': 'ROADMAP',
    'Economics': 'ECONOMICS',
    // Architecture
    'Standards': 'PRINCIPLES',
    'Policy': 'PRINCIPLES',
    'HLD': 'HLD',
    'ADR': 'ADR',
    'Topology': 'TOPOLOGY',
    // Product
    'UI Spec': 'UI',
    'UX Flow': 'UX',
    'Bot Spec': 'BOT',
    // Engineering
    'API Contract': 'CONTRACTS',
    'Service Spec': 'SERVICES',
    'Database Spec': 'DATABASE',
    // Operations
    'Runbook': 'RUNBOOKS',
    'Incident Report': 'INCIDENTS',
    'Report': 'REPORTS',
    'Monitoring Spec': 'MONITORING',
    // Metrics
    'KPI Spec': 'KPI',
    // Execution
    'Phase Plan': 'PHASES',
    'WBS': 'WBS',
    // Archive
    'Research': 'RESEARCH',
    'Legacy': 'LEGACY'
};

// Special handling for Domains to preserve context
const DOMAIN_MAPPING = {
    'CONSULTING': 'CONSULTING_DOMAIN',
    'AGRO_DOMAIN': 'AGRO_DOMAIN',
    'ENTERPRISE_DOMAIN': 'ENTERPRISE_DOMAIN',
    'RAI_DOMAIN': 'RAI_DOMAIN'
};

// --- HELPERS ---

function parseFrontMatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;
    const rawYaml = match[1];
    const data = {};
    rawYaml.split(/\r?\n/).forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) data[parts[0].trim()] = parts.slice(1).join(':').trim();
    });
    return data;
}

function getMoveTarget(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const fm = parseFrontMatter(content);
    if (!fm || !fm.layer || !fm.type) return null;

    const layerDir = TARGET_STRUCTURE[fm.layer];
    if (!layerDir) return null;

    let subDir = TYPE_TO_SUBFOLDER[fm.type] || 'GENERAL';

    // Domain Preservation Logic
    if (fm.layer === 'Domain') {
        const relPath = path.relative(DOCS_ROOT, file);
        const parentDir = relPath.split(path.sep)[0]; // Top level folder

        // Check if parent matches a known domain root
        // or check if it's inside 02-DOMAINS/XYZ or CONSULTING
        if (parentDir === 'CONSULTING') {
            subDir = 'CONSULTING_DOMAIN';
        } else if (relPath.includes('DOMAINS')) {
            // Extraction: 02-DOMAINS/AGRO_DOMAIN -> AGRO_DOMAIN
            const parts = relPath.split(path.sep);
            if (parts.length > 2 && parts[0].includes('DOMAINS')) {
                subDir = parts[1];
            }
        } else {
            subDir = 'SHARED_KERNEL'; // Default fallback
        }
    }

    // Execution Preservation Logic
    if (fm.layer === 'Execution') {
        // Keep "PHASE_GAMMA" etc if possible?
        // For now, flatten to PHASES/WBS/SPRINTS as per plan, 
        // OR just map 'Phase Plan' -> PHASES.
        // Let's stick to Type mapping for simplicity, user can reorganize internally if needed.
    }

    // Special case for Strategy files currently in root?

    return path.join(DOCS_ROOT, layerDir, subDir);
}

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

// --- MAIN ---

console.log(`🚀 Starting Refactor (Dry Run: ${DRY_RUN})`);

const files = getAllFiles(DOCS_ROOT);
let movedCount = 0;

files.forEach(file => {
    // Skip special files
    if (file.match(/(README|INDEX|PROJECT_MAP|GOVERNANCE)\.md$/i)) return;

    const targetDir = getMoveTarget(file);
    if (!targetDir) {
        console.log(`⚠️  Skipping ${path.basename(file)} (No valid metadata)`);
        return;
    }

    const targetFile = path.join(targetDir, path.basename(file));

    // If path matches, skip
    if (path.resolve(file) === path.resolve(targetFile)) return;

    console.log(`[MOVE] ${path.relative(DOCS_ROOT, file)} -> ${path.relative(DOCS_ROOT, targetFile)}`);

    if (!DRY_RUN) {
        fs.mkdirSync(targetDir, { recursive: true });

        // Handle collision
        if (fs.existsSync(targetFile)) {
            console.log(`❌ Target exists: ${targetFile}. Skipping.`);
            return;
        }

        fs.renameSync(file, targetFile);
        movedCount++;
    }
});

// Cleanup Empty Dirs
if (!DRY_RUN) {
    function removeEmptyDirs(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        if (files.length > 0) {
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) removeEmptyDirs(fullPath);
            });
        }
        // Re-check
        if (fs.readdirSync(dir).length === 0) {
            console.log(`[CLEAN] Removing empty dir: ${path.relative(DOCS_ROOT, dir)}`);
            fs.rmdirSync(dir);
        }
    }

    // Only clean old structures, be careful not to delete new empty ones if any
    // removeEmptyDirs(DOCS_ROOT); 
    // Manual recursive sweep might be safer to call explicitly or just leave them for user validation
}

console.log(`✅ Refactor Complete. Moved ${movedCount} files.`);

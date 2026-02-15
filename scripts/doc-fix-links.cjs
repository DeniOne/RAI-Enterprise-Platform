
const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '../docs');
const DRY_RUN = process.argv.includes('--dry-run');

// --- HELPERS ---

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

console.log(`🔗 Starting Link Repair (Dry Run: ${DRY_RUN})`);

const files = getAllFiles(DOCS_ROOT);
const fileIndex = {}; // FileName -> AbsolutePath

// 1. Build Index
files.forEach(file => {
    fileIndex[path.basename(file)] = file;
});

let totalFixed = 0;

// 2. Scan and Fix
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let originalContent = content;
    const fileDir = path.dirname(file);

    // Match markdown links: [label](path)
    // We strictly look for relative paths, avoiding http/mailto/absolute
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // We need to use a replace function that handles promises/async if needed, but here simple sync replace is fine
    // Is updated content being used? Yes.

    const newContent = content.replace(linkRegex, (match, label, linkPath) => {
        // Ignore external links, anchors, or absolute paths
        if (linkPath.startsWith('http') || linkPath.startsWith('mailto') || linkPath.startsWith('#')) return match;

        // Remove anchor from linkPath for resolution
        const [basePath, anchor] = linkPath.split('#');
        if (!basePath) return match; // just anchor

        // Check if exists
        const absoluteTarget = path.resolve(fileDir, basePath);

        if (fs.existsSync(absoluteTarget)) {
            // Link is valid, do nothing
            return match;
        }

        // Link is broken! Try to find the file in index
        const targetFileName = path.basename(basePath);
        const newTarget = fileIndex[targetFileName];

        if (newTarget) {
            // Found it! Calculate new relative path
            let newRelPath = path.relative(fileDir, newTarget).replace(/\\/g, '/');
            if (!newRelPath.startsWith('.')) newRelPath = './' + newRelPath;

            if (anchor) newRelPath += '#' + anchor;

            // console.log(`[FIX] In ${path.basename(file)}: ${linkPath} -> ${newRelPath}`);
            return `[${label}](${newRelPath})`;
        } else {
            console.log(`[WARN] In ${path.basename(file)}: Could not resolve broken link: ${linkPath}`);
            return match;
        }
    });

    if (newContent !== originalContent) {
        if (!DRY_RUN) {
            fs.writeFileSync(file, newContent);
        }
        console.log(`[UPDATED] ${path.basename(file)}`);
        totalFixed++;
    }
});

console.log(`✅ Link Repair Complete. Fixed links in ${totalFixed} files.`);

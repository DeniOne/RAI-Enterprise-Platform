
const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '../docs');

function removeEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;

    // Skip new structure and special dirs
    const baseName = path.basename(dir);
    if (baseName.match(/^(00_|01_|02_|03_|04_|05_|06_|07_|08_|node_modules|\.git)/)) return;
    if (path.relative(DOCS_ROOT, dir) === '') {
        // Root: iterate children
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) removeEmptyDirs(fullPath);
        });
        return;
    }

    let files = fs.readdirSync(dir);

    if (files.length > 0) {
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                removeEmptyDirs(fullPath);
            }
        });

        // Check again after processing children
        files = fs.readdirSync(dir);
    }

    if (files.length === 0) {
        console.log(`[DELETE] ${path.relative(DOCS_ROOT, dir)}`);
        fs.rmdirSync(dir);
    } else {
        // console.log(`[KEEP] ${path.relative(DOCS_ROOT, dir)} (${files.length} items)`);
    }
}

console.log('🧹 Cleaning up empty directories...');
removeEmptyDirs(DOCS_ROOT);
console.log('✅ Cleanup Complete.');

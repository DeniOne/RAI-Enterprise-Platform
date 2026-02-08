const fs = require('fs');
const path = require('path');

const src = 'F:\\RAI_EP\\apps\\web\\app\\(strategic)';
const dest = 'F:\\RAI_EP\\apps\\web\\app\\strategic';

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    if (fs.existsSync(src)) {
        try {
            fs.renameSync(src, dest);
            console.log('Renamed successfully');
        } catch (e) {
            console.log('Rename failed (likely locked), trying copy...');
            copyDir(src, dest);
            console.log('Copy successfully');
        }
    } else {
        console.log('Source directory does not exist');
    }
} catch (e) {
    console.error('Operation failed:', e);
}

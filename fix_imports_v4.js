const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.resolve(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const srcDir = 'f:/RAI_EP/apps/api/src';
console.log(`Scanning ${srcDir}...`);
const files = walk(srcDir);
console.log(`Found ${files.length} files.`);

let fixedCount = 0;
files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        const regex = /from\s+["']@prisma\/client["']/g;
        if (regex.test(content)) {
            const newContent = content.replace(regex, 'from "@rai/prisma-client"');
            fs.writeFileSync(file, newContent);
            fixedCount++;
            console.log(`Fixed: ${file}`);
        }
    } catch (e) {
        console.error(`Error ${file}: ${e.message}`);
    }
});
console.log(`Done. Fixed ${fixedCount} files.`);

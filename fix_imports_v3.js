const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const srcDir = 'f:/RAI_EP/apps/api/src';
const files = walk(srcDir);

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        // Regex to match "from "@prisma/client"" or "from '@prisma/client'" with any amount of whitespace
        const regex = /from\s+["']@prisma\/client["']/g;
        if (regex.test(content)) {
            console.log(`Fixing ${file}`);
            const newContent = content.replace(regex, 'from "@rai/prisma-client"');
            fs.writeFileSync(file, newContent);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});
console.log('Done.');

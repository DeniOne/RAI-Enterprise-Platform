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
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('from "@prisma/client"')) {
        console.log(`Fixing ${file}`);
        const newContent = content.replace(/from "@prisma/client"/g, 'from "@rai / prisma - client"');
        fs.writeFileSync(file, newContent);
    }
});

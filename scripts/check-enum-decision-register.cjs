#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const args=new Set(process.argv.slice(2));
const mode=args.has('--mode=enforce')?'enforce':'warn';
const root=path.resolve(__dirname,'..');
const schema=fs.readFileSync(path.join(root,'packages/prisma-client/schema.prisma'),'utf8');
const regPath=path.join(root,'docs/01_ARCHITECTURE/DATABASE/ENUM_DECISION_REGISTER.md');
const failures=[];
if(!fs.existsSync(regPath)){failures.push('Missing ENUM_DECISION_REGISTER.md');}
else {
 const reg=fs.readFileSync(regPath,'utf8');
 const enumCount=(schema.match(/^enum\s+\w+\s*\{/gm)||[]).length;
 const rowCount=(reg.match(/^\| `[^`]+` \|/gm)||[]).length;
 if(rowCount<enumCount){failures.push(`Enum decisions missing: rows=${rowCount}, enums=${enumCount}`);} 
 if(!reg.includes('Decision table'))failures.push('Missing Decision table section');
}
console.log('DB Enum Decision Register Check');
console.log(`mode=${mode}`);
if(failures.length){console.log('Failures:');for(const f of failures)console.log(`- ${f}`);}
if(mode==='enforce'&&failures.length)process.exit(1);

#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const args=new Set(process.argv.slice(2));
const mode=args.has('--mode=enforce')?'enforce':'warn';
const root=path.resolve(__dirname,'..');
const p=path.join(root,'docs/01_ARCHITECTURE/DATABASE/DB_INDEX_EVIDENCE_REGISTER.md');
const migration=path.join(root,'packages/prisma-client/migrations/20260313113000_phase6_workload_index_tuning/migration.sql');
const failures=[];
if(!fs.existsSync(p)) failures.push('Missing DB_INDEX_EVIDENCE_REGISTER.md');
if(!fs.existsSync(migration)) failures.push('Missing phase6 migration');
if(failures.length===0){
 const c=fs.readFileSync(p,'utf8');
 const m=fs.readFileSync(migration,'utf8');
 const indexes=[...m.matchAll(/CREATE INDEX "([^"]+)"/g)].map(x=>x[1]);
 for(const idx of indexes){if(!c.includes(idx.split('_idx')[0])){failures.push(`Index evidence missing for ${idx}`);} }
}
console.log('DB Index Evidence Register Check');
console.log(`mode=${mode}`);
if(failures.length){console.log('Failures:');for(const f of failures)console.log(`- ${f}`);} 
if(mode==='enforce'&&failures.length)process.exit(1);

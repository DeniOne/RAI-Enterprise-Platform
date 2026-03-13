#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const args=new Set(process.argv.slice(2));
const mode=args.has('--mode=enforce')?'enforce':'warn';
const p=path.join(path.resolve(__dirname,'..'),'docs/01_ARCHITECTURE/DATABASE/DB_PROJECTION_REGISTER.md');
const failures=[];
if(!fs.existsSync(p)) failures.push('Missing DB_PROJECTION_REGISTER.md');
else {
 const c=fs.readFileSync(p,'utf8');
 const required=['staleness_tolerance','deletion_reconciliation_semantics','planning_workspace_projection','party_workspace_projection','frontoffice_operator_projection','runtime_governance_projection'];
 for(const r of required){if(!c.includes(r)) failures.push(`Missing token: ${r}`);}
}
console.log('DB Projection Register Check');
console.log(`mode=${mode}`);
if(failures.length){console.log('Failures:');for(const f of failures)console.log(`- ${f}`);} 
if(mode==='enforce'&&failures.length)process.exit(1);

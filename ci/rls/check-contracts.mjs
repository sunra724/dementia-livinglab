import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
function hasServerCrudTests(text, schema, table) {
 const target=schema+'."'+table+'"';
 const blocks=[...text.matchAll(/SET LOCAL ROLE (anon|authenticated|service_role)\s*;([\s\S]*?)(?=RESET ROLE;|$)/g)];
 const denied=blocks.filter(b=>b[1]!=='service_role'&&['SELECT','INSERT','UPDATE','DELETE'].every(op=>b[2].split(/\r?\n/).some(line=>new RegExp('^\\s*SELECT throws_ok\\(\''+op+'\\b').test(line)&&line.includes(target)&&line.includes("'42501'"))));
 const service=blocks.some(b=>b[1]==='service_role'&&['INSERT','UPDATE','DELETE'].every(op=>b[2].split(/\r?\n/).some(line=>(new RegExp('^\\s*SELECT lives_ok\\(\''+op+'\\b').test(line)||new RegExp('^\\s*SELECT results_eq\\(\'WITH changed AS \\('+op+'\\b').test(line))&&line.includes(target)))&&b[2].split(/\r?\n/).some(line=>/^\s*SELECT is\(\(SELECT\b/.test(line)&&line.includes(target)));
 return denied.some(b=>b[1]==='anon')&&denied.filter(b=>b[1]==='authenticated').length>=3&&service;
}
export function validateContract(contract, relations, policies, root) {
 const errors=[],reviewed=new Map(contract.reviewedTargets.map(t=>[t.schema+'.'+t.table,t]));
 const baseline=new Set(contract.baselineRelations.map(t=>t.includes('.')?t:'public.'+t));
 for(const key of reviewed.keys())if(!relations.some(r=>r.schema+'.'+r.name===key))errors.push(key+': reviewed table missing from database');
 for(const r of relations.filter(r=>r.kind==='r'||r.kind==='p')){
  if(!contract.exposedSchemas.includes(r.schema))continue;
  const key=r.schema+'.'+r.name,c=reviewed.get(key);
  if(!r.rls)errors.push(key+': RLS missing');
  if(!c&&!baseline.has(key)){errors.push(key+': new table has no reviewed access contract/policy tests');continue;}
  if(!c)continue; // Explicit baseline exception; not a certification of old permissions.
  if(!['server_only','public_read','user_private','organization_private'].includes(c.classification))errors.push(key+': access classification missing');
  const file=path.resolve(root,c.test||'__MISSING__');if(!fs.existsSync(file)){errors.push(key+': policy test file missing');continue;}
  const text=fs.readFileSync(file,'utf8');if(!text.includes(r.name)||!text.includes('throws_ok')||!text.includes('service'))errors.push(key+': allow/deny test coverage missing');
  if(c.classification==='server_only'&&!hasServerCrudTests(text,r.schema,r.name))errors.push(key+': table-specific anon/A/B/other-organization deny and service CRUD tests missing');
  for(const role of ['anon','authenticated']){const e=r.effective.find(x=>x.role===role);if(!e){errors.push(key+': effective privileges unavailable for '+role);continue;}
   const expected=new Set(c[role]||[]);for(const op of ['select','insert','update','delete','truncate','references','trigger','maintain'])if(Boolean(e[op])!==expected.has(op))errors.push(key+': '+role+' '+op+' grant differs from contract');}
  if(c.classification==='server_only')for(const e of r.effective)if(['anon','authenticated'].includes(e.role)&&['select','insert','update','references'].some(op=>e['any_column_'+op]))errors.push(key+': effective client column privileges must be revoked');
  if((r.acl||[]).some(x=>x.startsWith('='))||(r.column_acl||[]).flat().some(x=>x.startsWith('=')))errors.push(key+': PUBLIC privileges require removal');
  if(c.classification==='server_only'&&(policies||[]).some(p=>p.schemaname===r.schema&&p.tablename===r.name))errors.push(key+': server-only table unexpectedly has policies');
  if(c.classification==='public_read'&&((c.anon||[]).some(x=>x!=='select')||(c.authenticated||[]).some(x=>x!=='select')))errors.push(key+': public read table has client write access');
  if(['user_private','organization_private'].includes(c.classification)){
   const required=['SELECT','INSERT','UPDATE','DELETE'];for(const op of required){const p=(policies||[]).filter(p=>p.schemaname===r.schema&&p.tablename===r.name&&p.cmd===op);if(!p.length)errors.push(key+': '+op+' policy missing');for(const x of p){if(['SELECT','UPDATE','DELETE'].includes(op)&&(!x.qual||x.qual.trim()==='true'))errors.push(key+': restricted USING required');if(['INSERT','UPDATE'].includes(op)&&(!x.with_check||x.with_check.trim()==='true'))errors.push(key+': restricted WITH CHECK required');}}
   if(!c.ownershipEvidence||!c.crossUserTests||c.classification==='organization_private'&&!c.membershipEvidence)errors.push(key+': ownership/membership evidence and cross-user tests required');
  }
 }
 return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [root,catalog]=process.argv.slice(2);if(!root||!catalog)throw new Error('Usage: node ci/check-contracts.mjs PROJECT_DIR LOCAL_CATALOG.json');
 const c=JSON.parse(fs.readFileSync(path.join(root,'access-contract.json'),'utf8')),a=JSON.parse(fs.readFileSync(catalog,'utf8'));
 const errors=validateContract(c,a.relations,a.policies,root);for(const e of errors)console.error(e);if(errors.length)process.exitCode=1;else process.stdout.write('RLS/grant/test contracts passed\n');
}

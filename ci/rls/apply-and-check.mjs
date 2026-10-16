import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateContract} from './check-contracts.mjs';
// This runner never reads .env or hosting secrets and refuses non-loopback DBs.
if(process.env.RLS_DISPOSABLE_DATABASE!=='true')throw Error('Explicit disposable database marker required');
const connection=process.env.RLS_TEST_DATABASE_URL||'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const parsed=new URL(connection);
if(!['postgresql:','postgres:'].includes(parsed.protocol)||parsed.hostname!=='127.0.0.1'||!['54322','55432'].includes(parsed.port)||parsed.username!=='postgres'||!(/^\/(?:postgres|rls_ci_[a-z_]+)$/.test(parsed.pathname)))throw Error('Only disposable loopback PostgreSQL is permitted');
const childEnv={...process.env,DATABASE_URL:connection,DIRECT_URL:connection,POSTGRES_URL:connection};
function run(binary,args,input){const r=spawnSync(binary,args,{input,env:childEnv,encoding:'utf8',windowsHide:true,maxBuffer:12*1024*1024});if(r.status!==0){const safe=(r.stderr||r.stdout||'').replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@\s]+@/g,'$1[REDACTED]@');throw Error(binary+' failed: '+safe);}return r.stdout;}
function sql(text){return run('psql',[connection,'-X','-qAt','-v','ON_ERROR_STOP=1'],text);}
const source=JSON.parse(fs.readFileSync('ci/rls/schema-sources.json','utf8'));
const contract=JSON.parse(fs.readFileSync('access-contract.json','utf8'));
const tracked=run('git',['ls-files','-z']).split('\0').filter(Boolean);
const registered=new Set(source.sources);
const unregistered=tracked.filter(f=>/\.(?:ts|tsx|sql|prisma)$/.test(f)&&/^(?:src|lib|app|supabase|prisma)\//.test(f)&&!f.startsWith('supabase/tests/')&&!f.startsWith('prisma/migrations_sqlite_backup/')&&!f.startsWith('src/generated/')&&/CREATE\s+TABLE\b/i.test(fs.readFileSync(f,'utf8'))&&!registered.has(f)&&!/^prisma\/migrations\/.+\/migration\.sql$/.test(f)&&!/^supabase\/migrations\/.+\.sql$/.test(f));
if(unregistered.length)throw Error('Register and apply new DDL source files in schema-sources.json: '+unregistered.join(', '));
sql("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='audit_backend') THEN CREATE ROLE audit_backend NOLOGIN BYPASSRLS; END IF; END $; GRANT audit_backend TO postgres WITH SET TRUE;");
if(source.kind==='prisma'){
 const prisma=path.join('node_modules/prisma',JSON.parse(fs.readFileSync('node_modules/prisma/package.json','utf8')).bin.prisma);
 run(process.execPath,[prisma,'migrate','deploy']);
 // Fresh disposable DB only: include current models that have not yet been migrated.
 run(process.execPath,[prisma,'db','push','--accept-data-loss']);
}else if(source.kind==='typescript-ddl'){
 const ts=(await import('typescript')).default;
 for(const file of source.sources){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  const queries=[];
  function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(sf)==='dbExecute'){
   const arg=node.arguments[0];if(arg&&(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg))&&/^\s*(?:CREATE|ALTER|DROP)\b/i.test(arg.text))queries.push(arg.text);
   else if(arg&&/CREATE\s+TABLE/i.test(arg.getText(sf)))throw Error('Dynamic DDL requires explicit test integration: '+file);
  }ts.forEachChild(node,visit);}visit(sf);
  if(!queries.length)throw Error('No registered DDL extracted: '+file);
  if((queries.join('\n').match(/CREATE\s+TABLE\b/gi)||[]).length!==(sf.text.match(/CREATE\s+TABLE\b/gi)||[]).length)throw Error('Not every CREATE TABLE is covered by the registered static DDL adapter: '+file);
  for(const query of queries)sql(query);
 }
}else{
 // A minimal local storage schema supports schema.sql; Storage API is not tested.
 sql("DO $storage_stub$ BEGIN IF to_regclass('storage.buckets') IS NULL THEN CREATE SCHEMA IF NOT EXISTS storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean); END IF; END $storage_stub$;");
 for(const file of source.sources)sql(fs.readFileSync(file,'utf8'));
}
// Repository SQL migrations outside Prisma are also part of the tested source.
// Supabase CLI db start already applies supabase/migrations in order.
// Supplement externally owned reviewed tables from the audited empty catalog.
// Existing application tables stay intact; this is not a production restore script.
let fixture=fs.readFileSync('ci/rls/catalog-subset.sql','utf8');
fixture=fixture.replace(/CREATE SEQUENCE public\./g,'CREATE SEQUENCE IF NOT EXISTS public.').replace(/CREATE TABLE public\./g,'CREATE TABLE IF NOT EXISTS public.');
fixture=fixture.replace(/ALTER TABLE public\."([^"]+)" ADD CONSTRAINT "([^"]+)" ([^;]+);/g,(whole,table,name)=>'DO $constraint$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid=\'public."'+table+'"\'::regclass AND conname=\''+name+'\') THEN '+whole+' END IF; END $constraint$;');
sql(fixture);
const baseline=JSON.parse(fs.readFileSync('ci/rls/catalog-security-baseline.json','utf8'));
for(const r of baseline.existingRlsTables)sql('ALTER TABLE IF EXISTS "'+r.schema.replaceAll('"','""')+'"."'+r.name.replaceAll('"','""')+'" ENABLE ROW LEVEL SECURITY;');
for(const file of fs.readdirSync('security/migrations').filter(f=>f.endsWith('.sql')).sort())sql(fs.readFileSync(path.join('security/migrations',file),'utf8'));
sql(fs.readFileSync('ci/rls/pgtap-local.sql','utf8'));
const catalogSql=fs.readFileSync('ci/rls/catalog_guard.sql','utf8');
const catalog=JSON.parse(sql(catalogSql));
const errors=validateContract(contract,catalog.relations,catalog.policies,process.cwd());
if(errors.length)throw Error(errors.join('\n'));
// The actual database must reject a new table even if RLS is already enabled.
const probe=JSON.parse(sql('BEGIN; CREATE TABLE public.__ci_unreviewed_table(id integer); ALTER TABLE public.__ci_unreviewed_table ENABLE ROW LEVEL SECURITY;'+catalogSql+'ROLLBACK;'));
const rejected=validateContract(contract,probe.relations,probe.policies,process.cwd());
if(!rejected.some(e=>e.includes('__ci_unreviewed_table: new table')))throw Error('New-table rejection probe did not fail');
const missingTestContract=structuredClone(contract);
missingTestContract.reviewedTargets.push({schema:'public',table:'__ci_unreviewed_table',classification:'server_only',anon:[],authenticated:[],test:'ci/rls/__missing_policy_test.sql'});
if(!validateContract(missingTestContract,probe.relations,probe.policies,process.cwd()).some(e=>e.includes('policy test file missing')))throw Error('Missing-test rejection probe did not fail');
fs.writeFileSync('rls-ci-evidence.json',JSON.stringify({project:contract.project,sourceKind:source.kind,sourceFiles:source.sources,reviewedTables:contract.reviewedTargets.length,contractPassed:true,newTableWithoutContractRejected:true,missingPolicyTestRejected:true,productionAccessed:false,catalog},null,2));
process.stdout.write('Actual source schema + reviewed RLS/grant/test contracts passed; real new-table/missing-test probes rejected.\n');

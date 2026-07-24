import { loadEnvConfig } from '@next/env';
import { closeSql } from '@/lib/db';
import { ensureIssueStore } from '@/lib/issue-store';
import { initDb } from '@/lib/schema';

loadEnvConfig(process.cwd());

async function migrateDb() {
  await initDb();
  await ensureIssueStore({ force: true });
}

migrateDb()
  .then(() => closeSql())
  .catch((error: unknown) => {
    console.error('db:migrate failed:', error);
    process.exit(1);
  });

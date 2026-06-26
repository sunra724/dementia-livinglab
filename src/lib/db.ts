import postgres from 'postgres';

export type DbValue = string | number | boolean | null | Date;

let sqlClient: postgres.Sql | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('POSTGRES_URL or DATABASE_URL is required for persistent storage on Vercel.');
  }

  return databaseUrl;
}

function shouldUseSsl(databaseUrl: string) {
  return !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
}

function toPostgresPlaceholders(query: string) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

export function getSql() {
  if (!sqlClient) {
    const databaseUrl = getDatabaseUrl();
    sqlClient = postgres(databaseUrl, {
      max: 1,
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 1,
      max_lifetime: 60,
      onnotice: () => undefined,
      ssl: shouldUseSsl(databaseUrl) ? 'require' : undefined,
    });
  }

  return sqlClient;
}

export async function dbQuery<T extends object>(
  query: string,
  values: DbValue[] = []
) {
  const rows = await getSql().unsafe(toPostgresPlaceholders(query), values);
  return rows as unknown as T[];
}

export async function dbQueryOne<T extends object>(
  query: string,
  values: DbValue[] = []
) {
  const rows = await dbQuery<T>(query, values);
  return rows[0];
}

export async function dbExecute(query: string, values: DbValue[] = []) {
  await dbQuery(query, values);
}

export async function updateById(
  tableName: string,
  id: number,
  changes: Record<string, DbValue>
) {
  const entries = Object.entries(changes);

  if (!entries.length) {
    return false;
  }

  const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
  await dbExecute(
    `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
    [...entries.map(([, value]) => value), id]
  );

  return true;
}

export async function closeSql() {
  if (sqlClient) {
    const client = sqlClient;
    sqlClient = null;
    await client.end({ timeout: 1 });
  }
}

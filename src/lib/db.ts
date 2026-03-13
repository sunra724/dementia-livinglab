import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function resolveDbPath() {
  const configuredPath = process.env.DATABASE_PATH?.trim();
  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const configuredDir = process.env.DATABASE_DIR?.trim();
  const dbDir = configuredDir ? path.resolve(configuredDir) : path.join(process.cwd(), 'data');
  return path.join(dbDir, 'livinglab.db');
}

const DB_PATH = resolveDbPath();
const DB_DIR = path.dirname(DB_PATH);

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

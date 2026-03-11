import { getDb } from './db';

const WORKSHEET_ENTRY_COLUMNS = [
  'id',
  'token_id',
  'workshop_id',
  'template_key',
  'group_name',
  'filled_by_name',
  'filled_by_role',
  'content_json',
  'submitted_at',
  'reviewed',
  'reviewed_by',
  'reviewed_at',
  'review_note',
] as const;

function getColumnNames(tableName: string) {
  const db = getDb();
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

function ensureWorksheetEntriesSchema() {
  const db = getDb();
  const existingColumns = getColumnNames('worksheet_entries');

  if (!existingColumns.length) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS worksheet_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER UNIQUE,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        template_key TEXT NOT NULL,
        group_name TEXT NOT NULL DEFAULT '',
        filled_by_name TEXT NOT NULL DEFAULT '',
        filled_by_role TEXT NOT NULL DEFAULT 'activist',
        content_json TEXT NOT NULL DEFAULT '{}',
        submitted_at TEXT,
        reviewed INTEGER NOT NULL DEFAULT 0,
        reviewed_by TEXT NOT NULL DEFAULT '',
        reviewed_at TEXT,
        review_note TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (token_id) REFERENCES worksheet_tokens(id)
      )
    `);
    return;
  }

  const hasModernSchema = WORKSHEET_ENTRY_COLUMNS.every((column) => existingColumns.includes(column));
  if (hasModernSchema) {
    return;
  }

  db.exec('ALTER TABLE worksheet_entries RENAME TO worksheet_entries_legacy');

  db.exec(`
    CREATE TABLE worksheet_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id INTEGER UNIQUE,
      workshop_id INTEGER NOT NULL REFERENCES workshops(id),
      template_key TEXT NOT NULL,
      group_name TEXT NOT NULL DEFAULT '',
      filled_by_name TEXT NOT NULL DEFAULT '',
      filled_by_role TEXT NOT NULL DEFAULT 'activist',
      content_json TEXT NOT NULL DEFAULT '{}',
      submitted_at TEXT,
      reviewed INTEGER NOT NULL DEFAULT 0,
      reviewed_by TEXT NOT NULL DEFAULT '',
      reviewed_at TEXT,
      review_note TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (token_id) REFERENCES worksheet_tokens(id)
    )
  `);

  db.exec(`
    INSERT INTO worksheet_entries (
      id,
      token_id,
      workshop_id,
      template_key,
      group_name,
      filled_by_name,
      filled_by_role,
      content_json,
      submitted_at,
      reviewed,
      reviewed_by,
      reviewed_at,
      review_note
    )
    SELECT
      legacy.id,
      NULL,
      legacy.workshop_id,
      legacy.template_key,
      '',
      COALESCE(participants.name, ''),
      CASE WHEN COALESCE(participants.role, 'activist') = 'facilitator' THEN 'facilitator' ELSE 'activist' END,
      legacy.content_json,
      legacy.submitted_at,
      COALESCE(legacy.reviewed, 0),
      '',
      NULL,
      ''
    FROM worksheet_entries_legacy AS legacy
    LEFT JOIN participants ON participants.id = legacy.filled_by
  `);

  db.exec('DROP TABLE worksheet_entries_legacy');
}

function ensureWorksheetTokensSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS worksheet_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      workshop_id INTEGER NOT NULL REFERENCES workshops(id),
      template_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);
}

function ensureSafetyTables() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS safety_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase INTEGER NOT NULL,
      workshop_id INTEGER REFERENCES workshops(id),
      log_type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      recorder TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL DEFAULT 'info',
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS facilitator_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER NOT NULL REFERENCES workshops(id),
      participant_id INTEGER NOT NULL REFERENCES participants(id),
      role TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      UNIQUE(workshop_id, participant_id, role)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS field_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER REFERENCES workshops(id),
      worksheet_id INTEGER REFERENCES worksheet_entries(id),
      phase INTEGER,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      taken_by TEXT NOT NULL DEFAULT '',
      taken_at TEXT,
      consent_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      affiliation TEXT NOT NULL,
      contact TEXT NOT NULL,
      joined_date TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      notes TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      representative TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact TEXT NOT NULL,
      address TEXT NOT NULL,
      mou_signed INTEGER DEFAULT 0,
      mou_date TEXT,
      participating_phases TEXT DEFAULT '[]',
      notes TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      dementia_stage TEXT NOT NULL,
      age_group TEXT NOT NULL,
      institution_id INTEGER NOT NULL,
      consent_signed INTEGER DEFAULT 0,
      participation_phases TEXT DEFAULT '[]',
      dropout INTEGER DEFAULT 0,
      dropout_reason TEXT,
      notes TEXT DEFAULT '',
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      phase INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      actual_date TEXT,
      location TEXT NOT NULL,
      facilitator_id INTEGER,
      participants_count INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      outcome_summary TEXT NOT NULL,
      FOREIGN KEY (facilitator_id) REFERENCES participants(id)
    )
  `);

  ensureWorksheetTokensSchema();
  ensureWorksheetEntriesSchema();
  ensureSafetyTables();

  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      completed_date TEXT,
      completed_by TEXT,
      evidence_note TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kpi_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      indicator TEXT NOT NULL,
      target INTEGER NOT NULL,
      current INTEGER NOT NULL,
      unit TEXT NOT NULL,
      trend TEXT NOT NULL,
      phase_related INTEGER,
      notes TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      planned_amount INTEGER NOT NULL,
      actual_amount INTEGER NOT NULL,
      payment_date TEXT,
      payee TEXT NOT NULL,
      receipt_attached INTEGER DEFAULT 0,
      phase INTEGER,
      active INTEGER DEFAULT 1,
      notes TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS promotion_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      title TEXT NOT NULL,
      published_date TEXT,
      phase INTEGER,
      reach_count INTEGER DEFAULT 0,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT DEFAULT ''
    )
  `);
}

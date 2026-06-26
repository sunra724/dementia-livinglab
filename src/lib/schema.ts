import { dbExecute } from './db';

let initPromise: Promise<void> | null = null;

async function createCoreTables() {
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      affiliation TEXT NOT NULL,
      contact TEXT NOT NULL,
      joined_date TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      notes TEXT DEFAULT ''
    )
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS institutions (
      id SERIAL PRIMARY KEY,
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

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      dementia_stage TEXT NOT NULL,
      age_group TEXT NOT NULL,
      institution_id INTEGER NOT NULL REFERENCES institutions(id),
      consent_signed INTEGER DEFAULT 0,
      participation_phases TEXT DEFAULT '[]',
      dropout INTEGER DEFAULT 0,
      dropout_reason TEXT,
      notes TEXT DEFAULT ''
    )
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS workshops (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      phase INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      actual_date TEXT,
      location TEXT NOT NULL,
      facilitator_id INTEGER REFERENCES participants(id),
      participants_count INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      outcome_summary TEXT NOT NULL
    )
  `);
}

async function createWorksheetTables() {
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS worksheet_tokens (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      workshop_id INTEGER NOT NULL REFERENCES workshops(id),
      template_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS worksheet_entries (
      id SERIAL PRIMARY KEY,
      token_id INTEGER UNIQUE REFERENCES worksheet_tokens(id),
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
      review_note TEXT NOT NULL DEFAULT ''
    )
  `);
}

async function createSafetyTables() {
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS safety_logs (
      id SERIAL PRIMARY KEY,
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

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS facilitator_roles (
      id SERIAL PRIMARY KEY,
      workshop_id INTEGER NOT NULL REFERENCES workshops(id),
      participant_id INTEGER NOT NULL REFERENCES participants(id),
      role TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      UNIQUE(workshop_id, participant_id, role)
    )
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS field_photos (
      id SERIAL PRIMARY KEY,
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

async function createManagementTables() {
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id SERIAL PRIMARY KEY,
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

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS kpi_items (
      id SERIAL PRIMARY KEY,
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

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id SERIAL PRIMARY KEY,
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

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS promotion_records (
      id SERIAL PRIMARY KEY,
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

export async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await createCoreTables();
      await createWorksheetTables();
      await createSafetyTables();
      await createManagementTables();
    })();
  }

  await initPromise;
}

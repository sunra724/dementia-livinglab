import { getDb } from './db';

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS worksheet_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER NOT NULL,
      template_key TEXT NOT NULL,
      filled_by INTEGER,
      content_json TEXT NOT NULL,
      submitted_at TEXT,
      reviewed INTEGER DEFAULT 0,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id),
      FOREIGN KEY (filled_by) REFERENCES participants(id)
    )
  `);

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

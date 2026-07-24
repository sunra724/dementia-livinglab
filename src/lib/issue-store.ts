import { dbExecute } from '@/lib/db';

let issueStorePromise: Promise<void> | null = null;

interface IssueStoreOptions {
  force?: boolean;
}

async function createIssueTable() {
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS issue_items (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      problem_statement TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'problem_defined',
      priority TEXT NOT NULL DEFAULT 'medium',
      owner_institution_id INTEGER REFERENCES institutions(id),
      source_worksheet_id INTEGER REFERENCES worksheet_entries(id),
      idea_summary TEXT NOT NULL DEFAULT '',
      prototype_summary TEXT NOT NULL DEFAULT '',
      test_summary TEXT NOT NULL DEFAULT '',
      policy_proposal TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

async function seedInitialIssues() {
  const now = new Date().toISOString();

  await dbExecute(
    `
      INSERT INTO issue_items (
        code, title, category, problem_statement, status, priority,
        owner_institution_id, source_worksheet_id, idea_summary,
        prototype_summary, test_summary, policy_proposal, created_at, updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?,
        (SELECT id FROM institutions WHERE id = ?),
        (SELECT id FROM worksheet_entries WHERE id = ?),
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT (code) DO NOTHING
    `,
    [
      'ISSUE-001',
      '익숙한 동선을 활용한 안전한 일상 외출 지원',
      'mobility',
      '경증 치매 어르신이 외출을 원하지만 이동 과정과 대중교통 이용에 대한 불안으로 가족 동행이 반복된다.',
      'problem_defined',
      'high',
      1,
      1,
      '익숙한 동선과 심리적 안정감을 중심으로 지원 아이디어를 구체화한다.',
      '',
      '',
      '',
      now,
      now,
    ]
  );

  await dbExecute(
    `
      INSERT INTO issue_items (
        code, title, category, problem_statement, status, priority,
        owner_institution_id, source_worksheet_id, idea_summary,
        prototype_summary, test_summary, policy_proposal, created_at, updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?,
        (SELECT id FROM institutions WHERE id = ?),
        (SELECT id FROM worksheet_entries WHERE id = ?),
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT (code) DO NOTHING
    `,
    [
      'ISSUE-002',
      '복약 확인 부담을 줄이는 생활 루틴 설계',
      'medication',
      '약 복용 시간을 놓치는 일이 반복되어 가족이 매번 전화로 확인해야 하고 돌봄 부담이 커진다.',
      'problem_defined',
      'high',
      2,
      3,
      '기억 보조 도구와 기존 생활 루틴을 결합하는 아이디어를 검토한다.',
      '',
      '',
      '',
      now,
      now,
    ]
  );
}

export async function ensureIssueStore(options: IssueStoreOptions = {}) {
  if (
    !options.force &&
    process.env.VERCEL === '1' &&
    process.env.AUTO_MIGRATE_DB !== 'true'
  ) {
    return;
  }

  if (!issueStorePromise) {
    issueStorePromise = (async () => {
      await createIssueTable();
      await seedInitialIssues();
    })();
  }

  try {
    await issueStorePromise;
  } catch (error) {
    issueStorePromise = null;
    throw error;
  }
}

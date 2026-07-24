import { unstable_cache } from 'next/cache';
import { dbQueryOne } from '@/lib/db';
import { calculatePhaseGateResults } from '@/lib/safety';
import { seedDb } from '@/lib/seed';
import type {
  BudgetItem,
  ChecklistItem,
  InstitutionAggregateSummary,
  KpiItem,
  PhaseGateResult,
  PromotionRecord,
  Workshop,
} from '@/lib/types';

export interface PublicDashboardResponse {
  kpis: KpiItem[];
  workshops: Workshop[];
  checklist: ChecklistItem[];
  promotions: PromotionRecord[];
  budget: BudgetItem[];
  safety: {
    gate_status: PhaseGateResult[];
  };
  subject_severity_counts: Record<'mild' | 'moderate' | 'severe', number>;
  institution_totals: {
    mou_count: number;
    active_subject_count: number;
    consent_count: number;
    staff_count: number;
  };
  institutions: InstitutionAggregateSummary[];
}

type ChecklistRow = Omit<ChecklistItem, 'required' | 'completed'> & {
  required: number;
  completed: number;
};

type BudgetRow = Omit<BudgetItem, 'receipt_attached' | 'active'> & {
  receipt_attached: number;
  active: number;
};

type InstitutionSummaryRow = Omit<InstitutionAggregateSummary, 'mou_signed'> & {
  mou_signed: number;
};

type DashboardQueryRow = {
  kpis: KpiItem[];
  workshops: Workshop[];
  checklist: ChecklistRow[];
  promotions: PromotionRecord[];
  budget: BudgetRow[];
  safety_checklist: ChecklistRow[];
  subject_severity_counts: PublicDashboardResponse['subject_severity_counts'];
  institution_totals: PublicDashboardResponse['institution_totals'];
  institutions: InstitutionSummaryRow[];
};

function toChecklistItem(row: ChecklistRow): ChecklistItem {
  return {
    ...row,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
  };
}

function toBudgetItem(row: BudgetRow): BudgetItem {
  return {
    ...row,
    receipt_attached: Boolean(row.receipt_attached),
    active: Boolean(row.active),
  };
}

function toInstitutionSummary(
  row: InstitutionSummaryRow
): InstitutionAggregateSummary {
  return {
    ...row,
    mou_signed: Boolean(row.mou_signed),
  };
}

async function loadPublicDashboardData(): Promise<PublicDashboardResponse> {
  await seedDb();

  const row = await dbQueryOne<DashboardQueryRow>(`
    SELECT
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'category', item.category,
              'indicator', item.indicator,
              'target', item.target,
              'current', item.current,
              'unit', item.unit,
              'trend', item.trend,
              'phase_related', item.phase_related,
              'notes', ''
            )
            ORDER BY item.category ASC, item.id ASC
          )
          FROM kpi_items AS item
        ),
        '[]'::json
      ) AS kpis,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'title', item.title,
              'type', item.type,
              'phase', item.phase,
              'scheduled_date', item.scheduled_date,
              'actual_date', item.actual_date,
              'location', '',
              'facilitator_id', NULL,
              'participants_count', item.participants_count,
              'status', item.status,
              'description', '',
              'outcome_summary', ''
            )
            ORDER BY item.scheduled_date ASC, item.id ASC
          )
          FROM workshops AS item
        ),
        '[]'::json
      ) AS workshops,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'phase', item.phase,
              'category', item.category,
              'title', item.title,
              'description', '',
              'required', item.required,
              'completed', item.completed,
              'completed_date', item.completed_date,
              'completed_by', NULL,
              'evidence_note', ''
            )
            ORDER BY item.phase ASC, item.id ASC
          )
          FROM checklist_items AS item
        ),
        '[]'::json
      ) AS checklist,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'channel', item.channel,
              'title', item.title,
              'published_date', item.published_date,
              'phase', item.phase,
              'reach_count', item.reach_count,
              'url', item.url,
              'status', item.status,
              'notes', ''
            )
            ORDER BY item.published_date DESC NULLS LAST, item.id DESC
          )
          FROM promotion_records AS item
          WHERE item.status = 'completed'
        ),
        '[]'::json
      ) AS promotions,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'category', item.category,
              'item_name', '',
              'planned_amount', item.planned_amount,
              'actual_amount', item.actual_amount,
              'payment_date', item.payment_date,
              'payee', '',
              'receipt_attached', FALSE,
              'phase', item.phase,
              'active', item.active,
              'notes', ''
            )
            ORDER BY item.id ASC
          )
          FROM budget_items AS item
          WHERE item.active = 1
        ),
        '[]'::json
      ) AS budget,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'phase', item.phase,
              'category', item.category,
              'title', item.title,
              'description', '',
              'required', item.required,
              'completed', item.completed,
              'completed_date', item.completed_date,
              'completed_by', NULL,
              'evidence_note', ''
            )
            ORDER BY item.phase ASC, item.id ASC
          )
          FROM checklist_items AS item
          WHERE item.category = 'safety'
        ),
        '[]'::json
      ) AS safety_checklist,
      json_build_object(
        'mild', (
          SELECT COUNT(*)
          FROM subjects
          WHERE dementia_stage IN ('mild', 'mild_cognitive') AND dropout = 0
        ),
        'moderate', (
          SELECT COUNT(*)
          FROM subjects
          WHERE dementia_stage = 'moderate' AND dropout = 0
        ),
        'severe', (
          SELECT COUNT(*)
          FROM subjects
          WHERE dementia_stage = 'severe' AND dropout = 0
        )
      ) AS subject_severity_counts,
      json_build_object(
        'mou_count', (SELECT COUNT(*) FROM institutions WHERE mou_signed = 1),
        'active_subject_count', (SELECT COUNT(*) FROM subjects WHERE dropout = 0),
        'consent_count', (SELECT COUNT(*) FROM subjects WHERE consent_signed = 1),
        'staff_count', (
          SELECT COUNT(*)
          FROM participants
          WHERE role = 'institution_staff' AND active = 1
        )
      ) AS institution_totals,
      COALESCE(
        (
          SELECT json_agg(item ORDER BY item.name ASC, item.id ASC)
          FROM (
            SELECT
              institutions.id,
              institutions.name,
              institutions.type,
              institutions.mou_signed,
              CASE
                WHEN COUNT(subjects.id) >= 5 THEN COUNT(subjects.id)
                ELSE -1
              END AS subject_count,
              CASE
                WHEN COUNT(subjects.id) FILTER (WHERE subjects.dropout = 0) >= 5
                  THEN COUNT(subjects.id) FILTER (WHERE subjects.dropout = 0)
                ELSE -1
              END AS active_subject_count,
              CASE
                WHEN COUNT(subjects.id) FILTER (WHERE subjects.consent_signed = 1) >= 5
                  THEN COUNT(subjects.id) FILTER (WHERE subjects.consent_signed = 1)
                ELSE -1
              END AS consent_count,
              (
                SELECT COUNT(*)
                FROM participants
                WHERE participants.role = 'institution_staff'
                  AND participants.active = 1
                  AND participants.affiliation = institutions.name
              ) AS staff_count
            FROM institutions
            LEFT JOIN subjects ON subjects.institution_id = institutions.id
            GROUP BY
              institutions.id,
              institutions.name,
              institutions.type,
              institutions.mou_signed
          ) AS item
        ),
        '[]'::json
      ) AS institutions
  `);

  const checklist = (row?.checklist ?? []).map(toChecklistItem);
  const safetyChecklist = (row?.safety_checklist ?? []).map(toChecklistItem);

  return {
    kpis: row?.kpis ?? [],
    workshops: row?.workshops ?? [],
    checklist,
    promotions: row?.promotions ?? [],
    budget: (row?.budget ?? []).map(toBudgetItem),
    safety: {
      gate_status: calculatePhaseGateResults(safetyChecklist),
    },
    subject_severity_counts: row?.subject_severity_counts ?? {
      mild: 0,
      moderate: 0,
      severe: 0,
    },
    institution_totals: row?.institution_totals ?? {
      mou_count: 0,
      active_subject_count: 0,
      consent_count: 0,
      staff_count: 0,
    },
    institutions: (row?.institutions ?? []).map(toInstitutionSummary),
  };
}

export const getPublicDashboardData = loadPublicDashboardData;

export const getCachedPublicDashboardData = unstable_cache(
  loadPublicDashboardData,
  ['public-dashboard-data-v2'],
  {
    revalidate: 60,
    tags: ['dashboard-data'],
  }
);

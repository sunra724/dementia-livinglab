import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { recordAdminAudit } from '@/lib/audit';
import { dbQuery, dbQueryOne } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import { calculatePhaseGateResults } from '@/lib/safety';
import type {
  ImpactBudgetStats,
  ImpactChecklistPhaseStat,
  ImpactContextResponse,
  ImpactInstitutionStats,
  ImpactKpiSummary,
  ImpactParticipantStats,
  ImpactPromotionStats,
  ImpactSafetyStats,
  ImpactSubjectStats,
  ImpactWorkshopStats,
  ImpactWorksheetTemplateStat,
} from '@/lib/impact';
import type {
  BudgetItem,
  ChecklistItem,
  InstitutionAggregateSummary,
  KpiItem,
  LivingLabPhase,
  PromotionRecord,
  Workshop,
  WorksheetTemplateKey,
} from '@/lib/types';

export const runtime = 'nodejs';

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

type SubjectSeverityCounts = Record<'mild' | 'moderate' | 'severe', number>;
type InstitutionTotals = {
  mou_count: number;
  active_subject_count: number;
  consent_count: number;
  staff_count: number;
};

type DashboardQueryRow = {
  kpis: KpiItem[];
  workshops: Workshop[];
  checklist: ChecklistRow[];
  promotions: PromotionRecord[];
  budget: BudgetRow[];
  safety_checklist: ChecklistRow[];
  subject_severity_counts: SubjectSeverityCounts;
  institution_totals: InstitutionTotals;
  institutions: InstitutionSummaryRow[];
};

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

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

function toInstitutionSummary(row: InstitutionSummaryRow): InstitutionAggregateSummary {
  return {
    ...row,
    mou_signed: Boolean(row.mou_signed),
  };
}

async function getDashboardContext() {
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
        'moderate', (SELECT COUNT(*) FROM subjects WHERE dementia_stage = 'moderate' AND dropout = 0),
        'severe', (SELECT COUNT(*) FROM subjects WHERE dementia_stage = 'severe' AND dropout = 0)
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

export async function GET(request: NextRequest) {
  try {
    await seedDb();
    if (isAdminRequest(request)) {
      await recordAdminAudit(request, 'impact_context');
    }

    if (request.nextUrl.searchParams.get('view') === 'dashboard') {
      return NextResponse.json(await getDashboardContext());
    }

    const participantRow = await dbQueryOne<Record<string, unknown>>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role='activist' AND active=1 THEN 1 ELSE 0 END) as activist_count,
        SUM(CASE WHEN role='facilitator' AND active=1 THEN 1 ELSE 0 END) as facilitator_count,
        SUM(CASE WHEN role='expert' AND active=1 THEN 1 ELSE 0 END) as expert_count,
        SUM(CASE WHEN role='institution_staff' AND active=1 THEN 1 ELSE 0 END) as staff_count
      FROM participants
    `);

    const subjectRow = await dbQueryOne<Record<string, unknown>>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type='elder' AND dropout=0 THEN 1 ELSE 0 END) as elder_count,
        SUM(CASE WHEN type='family_caregiver' AND dropout=0 THEN 1 ELSE 0 END) as family_count,
        SUM(CASE WHEN consent_signed=1 THEN 1 ELSE 0 END) as consent_count
      FROM subjects
    `);

    const institutionRow = await dbQueryOne<Record<string, unknown>>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN mou_signed=1 THEN 1 ELSE 0 END) as mou_count
      FROM institutions
    `);

    const workshops = await dbQuery<Record<string, unknown>>(`
      SELECT id, title, phase, scheduled_date, actual_date, status, participants_count, outcome_summary
      FROM workshops
      ORDER BY phase ASC, id ASC
    `);

    const worksheetRows = await dbQuery<Record<string, unknown>>(`
      SELECT
        template_key,
        COUNT(*) as total,
        SUM(CASE WHEN reviewed=1 THEN 1 ELSE 0 END) as reviewed_count
      FROM worksheet_entries
      WHERE submitted_at IS NOT NULL
      GROUP BY template_key
      ORDER BY template_key ASC
    `);

    const kpis = await dbQuery<ImpactKpiSummary>(`
      SELECT id, category, indicator, target, current, unit, notes
      FROM kpi_items
      ORDER BY id ASC
    `);

    const budgetRow = await dbQueryOne<Record<string, unknown>>(`
      SELECT
        SUM(planned_amount) as total_planned,
        SUM(actual_amount) as total_actual
      FROM budget_items
      WHERE active=1
    `);

    const promotionRow = await dbQueryOne<Record<string, unknown>>(`
      SELECT
        COUNT(*) as total,
        SUM(reach_count) as total_reach,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_count
      FROM promotion_records
    `);

    const checklistRows = await dbQuery<Record<string, unknown>>(`
      SELECT
        phase,
        COUNT(*) as total,
        SUM(completed) as done,
        SUM(CASE WHEN required=1 THEN 1 ELSE 0 END) as required_total,
        SUM(CASE WHEN required=1 AND completed=1 THEN 1 ELSE 0 END) as required_done
      FROM checklist_items
      GROUP BY phase
      ORDER BY phase ASC
    `);

    const safetyRow =
      (await dbQueryOne<Record<string, unknown>>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN resolved=1 THEN 1 ELSE 0 END) as resolved
        FROM safety_logs
      `)) ?? { total: 0, critical: 0, resolved: 0 };

    const participantStats: ImpactParticipantStats = {
      total: toNumber(participantRow?.total),
      activist_count: toNumber(participantRow?.activist_count),
      facilitator_count: toNumber(participantRow?.facilitator_count),
      expert_count: toNumber(participantRow?.expert_count),
      staff_count: toNumber(participantRow?.staff_count),
    };

    const subjectStats: ImpactSubjectStats = {
      total: toNumber(subjectRow?.total),
      elder_count: toNumber(subjectRow?.elder_count),
      family_count: toNumber(subjectRow?.family_count),
      consent_count: toNumber(subjectRow?.consent_count),
    };

    const institutionStats: ImpactInstitutionStats = {
      total: toNumber(institutionRow?.total),
      mou_count: toNumber(institutionRow?.mou_count),
    };

    const workshopStats: ImpactWorkshopStats = {
      total: workshops.length,
      completed: workshops.filter((item) => item.status === 'completed').length,
      in_progress: workshops.filter((item) => item.status === 'in_progress').length,
    };

    const worksheetByTemplate: ImpactWorksheetTemplateStat[] = worksheetRows.map((row) => ({
      template_key: String(row.template_key) as WorksheetTemplateKey,
      total: toNumber(row.total),
      reviewed_count: toNumber(row.reviewed_count),
    }));

    const worksheetTotal = worksheetByTemplate.reduce((sum, item) => sum + item.total, 0);
    const worksheetReviewed = worksheetByTemplate.reduce(
      (sum, item) => sum + item.reviewed_count,
      0
    );

    const budgetStats: ImpactBudgetStats = {
      total_planned: toNumber(budgetRow?.total_planned),
      total_actual: toNumber(budgetRow?.total_actual),
    };

    const promotionStats: ImpactPromotionStats = {
      total: toNumber(promotionRow?.total),
      total_reach: toNumber(promotionRow?.total_reach),
      completed_count: toNumber(promotionRow?.completed_count),
    };

    const checklistByPhase: ImpactChecklistPhaseStat[] = checklistRows.map((row) => ({
      phase: toNumber(row.phase) as LivingLabPhase,
      total: toNumber(row.total),
      done: toNumber(row.done),
      required_total: toNumber(row.required_total),
      required_done: toNumber(row.required_done),
    }));

    const safetyStats: ImpactSafetyStats = {
      total: toNumber(safetyRow.total),
      critical: toNumber(safetyRow.critical),
      resolved: toNumber(safetyRow.resolved),
    };

    const currentPhase = checklistByPhase.reduce<LivingLabPhase>((current, row) => {
      const completionRate = row.total > 0 ? row.done / row.total : 0;
      return completionRate >= 0.5 && row.phase > current ? row.phase : current;
    }, 1 as LivingLabPhase);

    const response: ImpactContextResponse = {
      projectName: '2026년 치매돌봄 리빙랩 통합 성과관리 대시보드',
      organization: '협동조합 소이랩',
      period: '2026년 3월 ~ 2026년 11월',
      currentPhase,
      participantStats,
      subjectStats,
      institutionStats,
      workshopStats,
      worksheetTotal,
      worksheetReviewed,
      worksheetByTemplate,
      kpis: isAdminRequest(request)
        ? kpis
        : kpis.map((item) => ({
            ...item,
            notes: '',
          })),
      budgetStats,
      promotionStats,
      checklistByPhase,
      safetyStats,
      sroiDefaults: {
        totalBudget: budgetStats.total_planned || 4_510_000,
        nonCashInput: 8_694_000,
        activistCount: participantStats.activist_count || 12,
        elderCount: subjectStats.elder_count || 15,
        familyCount: subjectStats.family_count || 5,
        institutionCount: institutionStats.mou_count || 5,
        promotionReach: promotionStats.total_reach || 3200,
        guideBookCreated:
          (checklistByPhase.find((item) => item.phase === 6)?.done ?? 0) > 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/impact/context error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
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
import type { LivingLabPhase, WorksheetTemplateKey } from '@/lib/types';

export const runtime = 'nodejs';

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();

    const participantRow = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN role='activist' AND active=1 THEN 1 ELSE 0 END) as activist_count,
            SUM(CASE WHEN role='facilitator' AND active=1 THEN 1 ELSE 0 END) as facilitator_count,
            SUM(CASE WHEN role='expert' AND active=1 THEN 1 ELSE 0 END) as expert_count,
            SUM(CASE WHEN role='institution_staff' AND active=1 THEN 1 ELSE 0 END) as staff_count
          FROM participants
        `
      )
      .get() as Record<string, unknown>;

    const subjectRow = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN type='elder' AND dropout=0 THEN 1 ELSE 0 END) as elder_count,
            SUM(CASE WHEN type='family_caregiver' AND dropout=0 THEN 1 ELSE 0 END) as family_count,
            SUM(CASE WHEN consent_signed=1 THEN 1 ELSE 0 END) as consent_count
          FROM subjects
        `
      )
      .get() as Record<string, unknown>;

    const institutionRow = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN mou_signed=1 THEN 1 ELSE 0 END) as mou_count
          FROM institutions
        `
      )
      .get() as Record<string, unknown>;

    const workshops = db
      .prepare(
        `
          SELECT id, title, phase, scheduled_date, actual_date, status, participants_count, outcome_summary
          FROM workshops
          ORDER BY phase ASC, id ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    const worksheetRows = db
      .prepare(
        `
          SELECT
            template_key,
            COUNT(*) as total,
            SUM(CASE WHEN reviewed=1 THEN 1 ELSE 0 END) as reviewed_count
          FROM worksheet_entries
          WHERE submitted_at IS NOT NULL
          GROUP BY template_key
          ORDER BY template_key ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    const kpis = db
      .prepare(
        `
          SELECT id, category, indicator, target, current, unit, notes
          FROM kpi_items
          ORDER BY id ASC
        `
      )
      .all() as ImpactKpiSummary[];

    const budgetRow = db
      .prepare(
        `
          SELECT
            SUM(planned_amount) as total_planned,
            SUM(actual_amount) as total_actual
          FROM budget_items
          WHERE active=1
        `
      )
      .get() as Record<string, unknown>;

    const promotionRow = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            SUM(reach_count) as total_reach,
            SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_count
          FROM promotion_records
        `
      )
      .get() as Record<string, unknown>;

    const checklistRows = db
      .prepare(
        `
          SELECT
            phase,
            COUNT(*) as total,
            SUM(completed) as done,
            SUM(CASE WHEN required=1 THEN 1 ELSE 0 END) as required_total,
            SUM(CASE WHEN required=1 AND completed=1 THEN 1 ELSE 0 END) as required_done
          FROM checklist_items
          GROUP BY phase
          ORDER BY phase ASC
        `
      )
      .all() as Array<Record<string, unknown>>;

    let safetyRow: Record<string, unknown> = { total: 0, critical: 0, resolved: 0 };
    try {
      safetyRow = db
        .prepare(
          `
            SELECT
              COUNT(*) as total,
              SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) as critical,
              SUM(CASE WHEN resolved=1 THEN 1 ELSE 0 END) as resolved
            FROM safety_logs
          `
        )
        .get() as Record<string, unknown>;
    } catch {
      safetyRow = { total: 0, critical: 0, resolved: 0 };
    }

    const participantStats: ImpactParticipantStats = {
      total: toNumber(participantRow.total),
      activist_count: toNumber(participantRow.activist_count),
      facilitator_count: toNumber(participantRow.facilitator_count),
      expert_count: toNumber(participantRow.expert_count),
      staff_count: toNumber(participantRow.staff_count),
    };

    const subjectStats: ImpactSubjectStats = {
      total: toNumber(subjectRow.total),
      elder_count: toNumber(subjectRow.elder_count),
      family_count: toNumber(subjectRow.family_count),
      consent_count: toNumber(subjectRow.consent_count),
    };

    const institutionStats: ImpactInstitutionStats = {
      total: toNumber(institutionRow.total),
      mou_count: toNumber(institutionRow.mou_count),
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
      total_planned: toNumber(budgetRow.total_planned),
      total_actual: toNumber(budgetRow.total_actual),
    };

    const promotionStats: ImpactPromotionStats = {
      total: toNumber(promotionRow.total),
      total_reach: toNumber(promotionRow.total_reach),
      completed_count: toNumber(promotionRow.completed_count),
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
      projectName: '2026년 치매돌봄 리빙랩 통합 성과관리 시스템',
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
      kpis,
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

import type { KpiItem, LivingLabPhase, WorksheetTemplateKey } from '@/lib/types';
import type { SroiInput } from '@/lib/sroi';

export const IMPACT_SECTIONS = [
  { key: 'overview', title: '1. 사업 개요 및 이해관계자 분석' },
  { key: 'logicmodel', title: '2. 투입·산출·성과 분석 (Logic Model)' },
  { key: 'sroi', title: '3. 사회적투자수익률 (SROI) 분석' },
  { key: 'policy', title: '4. 정책부합성 분석' },
  { key: 'scalability', title: '5. 확장가능성 및 지속가능성' },
  { key: 'highlights', title: '6. 리빙랩 6단계 주요 성과' },
  { key: 'conclusion', title: '7. 결론 및 제언' },
] as const;

export type ImpactSectionKey = (typeof IMPACT_SECTIONS)[number]['key'];

export interface ImpactParticipantStats {
  total: number;
  activist_count: number;
  facilitator_count: number;
  expert_count: number;
  staff_count: number;
}

export interface ImpactSubjectStats {
  total: number;
  elder_count: number;
  family_count: number;
  consent_count: number;
}

export interface ImpactInstitutionStats {
  total: number;
  mou_count: number;
}

export interface ImpactWorkshopStats {
  total: number;
  completed: number;
  in_progress: number;
}

export interface ImpactBudgetStats {
  total_planned: number;
  total_actual: number;
}

export interface ImpactPromotionStats {
  total: number;
  total_reach: number;
  completed_count: number;
}

export interface ImpactChecklistPhaseStat {
  phase: LivingLabPhase;
  total: number;
  done: number;
  required_total: number;
  required_done: number;
}

export interface ImpactSafetyStats {
  total: number;
  critical: number;
  resolved: number;
}

export interface ImpactWorksheetTemplateStat {
  template_key: WorksheetTemplateKey;
  total: number;
  reviewed_count: number;
}

export type ImpactKpiSummary = Pick<
  KpiItem,
  'id' | 'category' | 'indicator' | 'target' | 'current' | 'unit' | 'notes'
>;

export interface ImpactContextResponse {
  projectName: string;
  organization: string;
  period: string;
  currentPhase: LivingLabPhase;
  participantStats: ImpactParticipantStats;
  subjectStats: ImpactSubjectStats;
  institutionStats: ImpactInstitutionStats;
  workshopStats: ImpactWorkshopStats;
  worksheetTotal: number;
  worksheetReviewed: number;
  worksheetByTemplate: ImpactWorksheetTemplateStat[];
  kpis: ImpactKpiSummary[];
  budgetStats: ImpactBudgetStats;
  promotionStats: ImpactPromotionStats;
  checklistByPhase: ImpactChecklistPhaseStat[];
  safetyStats: ImpactSafetyStats;
  sroiDefaults: Omit<
    SroiInput,
    'attributionRate' | 'deadweightRate' | 'dropOffRate'
  >;
}

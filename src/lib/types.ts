export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
export type LivingLabPhase = 1 | 2 | 3 | 4 | 5 | 6;
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type RoleType =
  | 'activist'
  | 'institution_staff'
  | 'subject_elder'
  | 'subject_family'
  | 'facilitator'
  | 'expert';

export interface Participant {
  id: number;
  name: string;
  role: RoleType;
  affiliation: string;
  contact: string;
  joined_date: string;
  active: boolean;
  notes: string;
}

export type InstitutionType =
  | 'dementia_center'
  | 'welfare_facility'
  | 'university'
  | 'public'
  | 'ngo'
  | 'other';

export interface Institution {
  id: number;
  name: string;
  type: InstitutionType;
  representative: string;
  contact_person: string;
  contact: string;
  address: string;
  mou_signed: boolean;
  mou_date: string | null;
  participating_phases: number[];
  notes: string;
}

export type SubjectType = 'elder' | 'family_caregiver';
export type DementiaStage =
  | 'normal'
  | 'mild_cognitive'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'unknown';

export interface Subject {
  id: number;
  code: string;
  type: SubjectType;
  dementia_stage: DementiaStage;
  age_group: string;
  institution_id: number;
  consent_signed: boolean;
  participation_phases: number[];
  dropout: boolean;
  dropout_reason: string | null;
  notes: string;
}

export type WorkshopType =
  | 'orientation'
  | 'field_observation'
  | 'problem_definition'
  | 'idea_generation'
  | 'prototype_design'
  | 'field_test'
  | 'reflection'
  | 'sharing';

export interface Workshop {
  id: number;
  title: string;
  type: WorkshopType;
  phase: LivingLabPhase;
  scheduled_date: string;
  actual_date: string | null;
  location: string;
  facilitator_id: number | null;
  participants_count: number;
  status: ProgressStatus;
  description: string;
  outcome_summary: string;
}

export type WorksheetTemplateKey =
  | 'hmw'
  | 'persona'
  | 'empathy_map'
  | 'journey_map'
  | 'idea_card'
  | 'prototype_spec'
  | 'test_result'
  | 'reflection';

export interface WorksheetEntry {
  id: number;
  workshop_id: number;
  template_key: WorksheetTemplateKey;
  filled_by: number | null;
  content_json: string;
  submitted_at: string | null;
  reviewed: boolean;
}

export interface ChecklistItem {
  id: number;
  phase: LivingLabPhase;
  category: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completed_date: string | null;
  completed_by: string | null;
  evidence_note: string;
}

export interface KpiItem {
  id: number;
  category: string;
  indicator: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  phase_related: LivingLabPhase | null;
  notes: string;
}

export type BudgetCategory =
  | 'personnel'
  | 'activity'
  | 'workshop'
  | 'printing'
  | 'travel'
  | 'equipment'
  | 'consulting'
  | 'misc';

export interface BudgetItem {
  id: number;
  category: BudgetCategory;
  item_name: string;
  planned_amount: number;
  actual_amount: number;
  payment_date: string | null;
  payee: string;
  receipt_attached: boolean;
  phase: LivingLabPhase | null;
  active: boolean;
  notes: string;
}

export type PromotionChannel =
  | 'sns_instagram'
  | 'sns_facebook'
  | 'press_release'
  | 'newsletter'
  | 'event'
  | 'video'
  | 'other';

export interface PromotionRecord {
  id: number;
  channel: PromotionChannel;
  title: string;
  published_date: string | null;
  phase: LivingLabPhase | null;
  reach_count: number;
  url: string;
  status: ProgressStatus;
  notes: string;
}

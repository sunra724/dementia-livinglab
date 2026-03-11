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
  | 'observation_log'
  | 'hmw'
  | 'persona'
  | 'empathy_map'
  | 'journey_map'
  | 'idea_card'
  | 'prototype_spec'
  | 'test_result'
  | 'reflection';

export type WorksheetContributorRole = 'activist' | 'facilitator';

export interface WorksheetEntry {
  id: number;
  token_id: number | null;
  workshop_id: number;
  template_key: WorksheetTemplateKey;
  group_name: string;
  filled_by_name: string;
  filled_by_role: WorksheetContributorRole;
  content_json: string;
  submitted_at: string | null;
  reviewed: boolean;
  reviewed_by: string;
  reviewed_at: string | null;
  review_note: string;
}

export interface WorksheetToken {
  id: number;
  token: string;
  workshop_id: number;
  template_key: WorksheetTemplateKey;
  created_at: string;
  expires_at: string | null;
  active: boolean;
}

export interface ObservationItem {
  time: string;
  who: string;
  what: string;
  how: string;
  note: string;
  emotion_hint: string;
}

export interface ObservationLogContent {
  observation_date: string;
  location: string;
  subject_codes: string[];
  observer_role: string;
  context_description: string;
  observations: ObservationItem[];
  photos_note: string;
  key_finding: string;
  questions_raised: string;
}

export interface HmwContent {
  problem_context: string;
  target_subject: string;
  questions: string[];
  key_insight: string;
}

export interface PersonaContent {
  subject_code: string;
  age_group: string;
  daily_routine: string;
  needs: string[];
  pains: string[];
  gains: string;
  quote: string;
}

export interface EmpathyMapContent {
  says: string;
  thinks: string;
  does: string;
  feels: string;
  core_pain: string;
  core_gain: string;
}

export interface JourneyMapStage {
  name: string;
  action: string;
  emotion: number;
  pain_point: string;
  opportunity: string;
}

export interface JourneyMapContent {
  persona_code: string;
  stages: JourneyMapStage[];
}

export interface IdeaCardContent {
  title: string;
  related_hmw: string;
  description: string;
  required_resources: string;
  feasibility: number;
  field_relevance: number;
  vote_count: number;
}

export interface PrototypeSpecContent {
  idea_title: string;
  problem_to_solve: string;
  target_users: string;
  core_function: string;
  prototype_type: 'physical' | 'digital' | 'service' | 'process';
  components: string[];
  test_scenario: string;
  success_criteria: string;
}

export interface TestResultContent {
  test_date: string;
  location: string;
  participants: string[];
  process_summary: string;
  went_well: string;
  needs_improvement: string;
  participant_feedback: string;
  next_action: string;
  overall_score: number;
}

export interface ReflectionContent {
  what_i_did: string;
  what_i_learned: string;
  what_was_hard: string;
  what_i_want_to_try: string;
  message_to_team: string;
}

export type WorksheetContent =
  | ObservationLogContent
  | HmwContent
  | PersonaContent
  | EmpathyMapContent
  | JourneyMapContent
  | IdeaCardContent
  | PrototypeSpecContent
  | TestResultContent
  | ReflectionContent;

export const WORKSHOP_TEMPLATE_MAP: Record<number, WorksheetTemplateKey[]> = {
  1: ['reflection'],
  2: ['observation_log', 'reflection'],
  3: ['observation_log', 'persona'],
  4: ['hmw', 'persona'],
  5: ['empathy_map'],
  6: ['journey_map'],
  7: ['idea_card'],
  8: ['idea_card'],
  9: ['prototype_spec'],
  10: ['test_result'],
  11: ['test_result'],
  12: ['reflection'],
};

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

export type SafetyLogType = 'consent' | 'anonymization' | 'incident' | 'stop_criterion';
export type SafetySeverity = 'info' | 'warning' | 'critical';
export type FacilitatorRole = 'facilitator' | 'recorder' | 'safety_officer' | 'photographer';

export interface SafetyLog {
  id: number;
  phase: LivingLabPhase;
  workshop_id: number | null;
  log_type: SafetyLogType;
  description: string;
  recorder: string;
  severity: SafetySeverity;
  resolved: boolean;
  resolved_note: string;
  created_at: string;
}

export interface FacilitatorRoleAssignment {
  id: number;
  workshop_id: number;
  participant_id: number;
  participant_name: string;
  role: FacilitatorRole;
  notes: string;
}

export interface FieldPhoto {
  id: number;
  workshop_id: number | null;
  worksheet_id: number | null;
  phase: LivingLabPhase | null;
  filename: string;
  original_name: string;
  description: string;
  taken_by: string;
  taken_at: string | null;
  consent_verified: boolean;
  created_at: string;
}

export interface PhaseGateResult {
  phase: LivingLabPhase;
  can_proceed: boolean;
  blocking_items: ChecklistItem[];
  warning_items: ChecklistItem[];
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

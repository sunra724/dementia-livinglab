import type {
  EmpathyMapContent,
  HmwContent,
  IdeaCardContent,
  ObservationItem,
  ObservationLogContent,
  JourneyMapContent,
  JourneyMapStage,
  PersonaContent,
  PrototypeSpecContent,
  ReflectionContent,
  TestResultContent,
  WorksheetContent,
  WorksheetContributorRole,
  WorksheetTemplateKey,
} from '@/lib/types';

export const WORKSHEET_TEMPLATE_LABELS: Record<WorksheetTemplateKey, string> = {
  observation_log: '관찰 기록지',
  hmw: 'HMW 질문',
  persona: '페르소나',
  empathy_map: '공감지도',
  journey_map: '고객여정지도',
  idea_card: '아이디어 카드',
  prototype_spec: '프로토타입 명세',
  test_result: '테스트 결과',
  reflection: '회고',
};

export const WORKSHEET_TEMPLATE_DESCRIPTIONS: Record<WorksheetTemplateKey, string> = {
  observation_log: '현장 관찰 맥락과 시간대별 기록을 정리합니다.',
  hmw: '문제 상황에서 해결 질문을 도출합니다.',
  persona: '대상자의 일상과 필요를 입체적으로 정리합니다.',
  empathy_map: '말, 생각, 행동, 감정을 2x2 구조로 정리합니다.',
  journey_map: '단계별 경험과 감정 곡선을 시각화합니다.',
  idea_card: '해결 아이디어를 한 장의 카드로 구조화합니다.',
  prototype_spec: '프로토타입의 핵심 기능과 테스트 시나리오를 정리합니다.',
  test_result: '현장 테스트 결과와 다음 액션을 기록합니다.',
  reflection: '활동 과정과 배움을 회고합니다.',
};

export const WORKSHEET_TEMPLATE_BADGES: Record<WorksheetTemplateKey, string> = {
  observation_log: 'bg-cyan-100 text-cyan-700',
  hmw: 'bg-blue-100 text-blue-700',
  persona: 'bg-amber-100 text-amber-700',
  empathy_map: 'bg-emerald-100 text-emerald-700',
  journey_map: 'bg-violet-100 text-violet-700',
  idea_card: 'bg-rose-100 text-rose-700',
  prototype_spec: 'bg-sky-100 text-sky-700',
  test_result: 'bg-red-100 text-red-700',
  reflection: 'bg-slate-100 text-slate-700',
};

const defaultObservationItem = (): ObservationItem => ({
  time: '',
  who: '',
  what: '',
  how: '',
  note: '',
  emotion_hint: '',
});

const defaultObservationLogContent: ObservationLogContent = {
  observation_date: '',
  location: '',
  subject_codes: [],
  observer_role: '',
  context_description: '',
  observations: [defaultObservationItem(), defaultObservationItem(), defaultObservationItem()],
  photos_note: '',
  key_finding: '',
  questions_raised: '',
};

const defaultHmwContent: HmwContent = {
  problem_context: '',
  target_subject: '',
  questions: [''],
  key_insight: '',
};

const defaultPersonaContent: PersonaContent = {
  subject_code: '',
  age_group: '',
  daily_routine: '',
  needs: [],
  pains: [],
  gains: '',
  quote: '',
};

const defaultEmpathyMapContent: EmpathyMapContent = {
  says: '',
  thinks: '',
  does: '',
  feels: '',
  core_pain: '',
  core_gain: '',
};

const defaultJourneyStage = (): JourneyMapStage => ({
  name: '',
  action: '',
  emotion: 3,
  pain_point: '',
  opportunity: '',
});

const defaultJourneyMapContent: JourneyMapContent = {
  persona_code: '',
  stages: [defaultJourneyStage(), defaultJourneyStage(), defaultJourneyStage()],
};

const defaultIdeaCardContent: IdeaCardContent = {
  title: '',
  related_hmw: '',
  description: '',
  required_resources: '',
  feasibility: 3,
  field_relevance: 3,
  vote_count: 0,
};

const defaultPrototypeSpecContent: PrototypeSpecContent = {
  idea_title: '',
  problem_to_solve: '',
  target_users: '',
  core_function: '',
  prototype_type: 'service',
  components: [''],
  test_scenario: '',
  success_criteria: '',
};

const defaultTestResultContent: TestResultContent = {
  test_date: '',
  location: '',
  participants: [],
  process_summary: '',
  went_well: '',
  needs_improvement: '',
  participant_feedback: '',
  next_action: '',
  overall_score: 3,
};

const defaultReflectionContent: ReflectionContent = {
  what_i_did: '',
  what_i_learned: '',
  what_was_hard: '',
  what_i_want_to_try: '',
  message_to_team: '',
};

function cloneWorksheetContent(content: WorksheetContent): Record<string, unknown> {
  return structuredClone(content) as unknown as Record<string, unknown>;
}

export function getDefaultWorksheetData(templateKey: WorksheetTemplateKey): Record<string, unknown> {
  switch (templateKey) {
    case 'observation_log':
      return cloneWorksheetContent(defaultObservationLogContent);
    case 'hmw':
      return cloneWorksheetContent(defaultHmwContent);
    case 'persona':
      return cloneWorksheetContent(defaultPersonaContent);
    case 'empathy_map':
      return cloneWorksheetContent(defaultEmpathyMapContent);
    case 'journey_map':
      return cloneWorksheetContent(defaultJourneyMapContent);
    case 'idea_card':
      return cloneWorksheetContent(defaultIdeaCardContent);
    case 'prototype_spec':
      return cloneWorksheetContent(defaultPrototypeSpecContent);
    case 'test_result':
      return cloneWorksheetContent(defaultTestResultContent);
    case 'reflection':
      return cloneWorksheetContent(defaultReflectionContent);
  }
}

export function parseWorksheetContent(
  templateKey: WorksheetTemplateKey,
  rawContent: string | null | undefined
): Record<string, unknown> {
  const fallback = getDefaultWorksheetData(templateKey);

  if (!rawContent) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function getWorksheetTemplateLabel(templateKey: WorksheetTemplateKey) {
  return WORKSHEET_TEMPLATE_LABELS[templateKey];
}

export function formatWorksheetContributorRole(role: WorksheetContributorRole) {
  return role === 'facilitator' ? '퍼실리테이터' : '활동가';
}

export function buildWorksheetUrl(origin: string, token: string) {
  return `${origin}/worksheets/${token}`;
}

export interface LocalContextNewsItem {
  id: number;
  institution: string;
  title: string;
  description: string;
  date: string;
  badge: string;
  badgeColor: 'yellow' | 'blue';
}

// 출처: 보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」 2025년 3월 발표
export const NATIONAL_DEMENTIA_STATS = {
  source: '보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」',
  published: '2025년 3월',
  patients_2025: 970000,
  patients_2026: 1010000,
  patients_2044: 2010000,
  prevalence_rate: 9.17,
  mci_patients_2025: 2980000,
  family_burden_rate: 45.8,
  family_care_hours: 18,
  cost_per_patient: 22200000,
  national_total_cost: 20.8,
  severity_mild: 67.7,
  severity_moderate: 29.5,
  severity_severe: 2.8,
} as const;

export const LOCAL_CONTEXT_NEWS = [
  {
    id: 1,
    institution: '수성구 치매안심센터',
    title: '2025 치매관리사업 우수사례 공모전 보건복지부장관상 수상',
    description:
      '독거 치매환자 방문 맞춤형 프로그램 "독거 치매 도망쳐, 건강수호대가 간다!" 운영 사례가 우수사례로 선정되었습니다.',
    date: '2026-01-02',
    badge: '장관상',
    badgeColor: 'yellow',
  },
  {
    id: 2,
    institution: '수성구 치매안심센터',
    title: '치매환자 단기 쉼터 프로그램 "기억튼튼! 인지튼튼!" 운영',
    description:
      '경증 치매 환자를 대상으로 인지훈련, 회상훈련, 실버 레크리에이션을 결합한 쉼터 프로그램을 운영 중입니다.',
    date: '2025-04-01',
    badge: '프로그램',
    badgeColor: 'blue',
  },
] satisfies ReadonlyArray<LocalContextNewsItem>;
